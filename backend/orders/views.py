import datetime
from decimal import Decimal
from django.db import transaction
from django.contrib.auth.models import User
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework import status

from .models import Cart, CartItem, Order, OrderItem
from .serializers import CartSerializer, CartItemSerializer, OrderSerializer
from products.models import Product, ProductVariant, GlobalGSMPrice
from inventory.models import StockHistory
from notifications.models import Notification
from inventory.views import trigger_stock_notifications


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def cart_detail_api(request):
    """
    Retrieves the shopping cart of the authenticated customer.
    Creates a new empty cart automatically if one does not exist.
    """
    cart, _ = Cart.objects.get_or_create(user=request.user)
    serializer = CartSerializer(cart, context={'request': request})
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cart_item_add_api(request):
    """
    Adds a product item (with optional variant or raw material GSM) to the customer's cart.
    Validates product availability and active status before adding.
    """
    product_id = request.data.get('product_id')
    variant_id = request.data.get('variant_id')
    gsm_val = request.data.get('gsm')
    quantity = int(request.data.get('quantity', 1))

    if not product_id:
        return Response({"error": "product_id is required."}, status=status.HTTP_400_BAD_REQUEST)

    if quantity < 1:
        return Response({"error": "Quantity must be at least 1."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        product = Product.objects.get(pk=product_id)
    except Product.DoesNotExist:
        return Response({"error": "Product not found."}, status=status.HTTP_404_NOT_FOUND)

    if not product.is_active:
        return Response(
            {"error": "This product is currently not available."},
            status=status.HTTP_400_BAD_REQUEST
        )

    variant = None
    if variant_id:
        try:
            variant = ProductVariant.objects.get(pk=variant_id, product=product)
        except ProductVariant.DoesNotExist:
            return Response({"error": "Product variant not found."}, status=status.HTTP_404_NOT_FOUND)

    cart, _ = Cart.objects.get_or_create(user=request.user)

    existing_item = CartItem.objects.filter(
        cart=cart,
        product=product,
        variant=variant,
        gsm=gsm_val
    ).first()

    if existing_item:
        existing_item.quantity += quantity
        existing_item.save()
        item = existing_item
        res_status = status.HTTP_200_OK
    else:
        item = CartItem.objects.create(
            cart=cart,
            product=product,
            variant=variant,
            gsm=gsm_val,
            quantity=quantity
        )
        res_status = status.HTTP_201_CREATED

    serializer = CartItemSerializer(item, context={'request': request})
    cart_serializer = CartSerializer(cart, context={'request': request})
    return Response({
        "message": f"Added '{product.name}' to your cart.",
        "item": serializer.data,
        "cart": cart_serializer.data
    }, status=res_status)


@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def cart_item_update_api(request, pk):
    """
    Updates item quantity in customer's cart.
    """
    try:
        item = CartItem.objects.get(pk=pk, cart__user=request.user)
    except CartItem.DoesNotExist:
        return Response({"error": "Cart item not found."}, status=status.HTTP_404_NOT_FOUND)

    quantity = int(request.data.get('quantity', item.quantity))
    if quantity < 1:
        return Response({"error": "Quantity must be at least 1."}, status=status.HTTP_400_BAD_REQUEST)

    item.quantity = quantity
    item.save()

    cart = item.cart
    serializer = CartItemSerializer(item, context={'request': request})
    cart_serializer = CartSerializer(cart, context={'request': request})
    return Response({
        "message": "Cart item updated successfully.",
        "item": serializer.data,
        "cart": cart_serializer.data
    }, status=status.HTTP_200_OK)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def cart_item_delete_api(request, pk):
    """
    Removes a specific item from customer's cart.
    """
    try:
        item = CartItem.objects.get(pk=pk, cart__user=request.user)
    except CartItem.DoesNotExist:
        return Response({"error": "Cart item not found."}, status=status.HTTP_404_NOT_FOUND)

    prod_name = item.product.name
    cart = item.cart
    item.delete()

    cart_serializer = CartSerializer(cart, context={'request': request})
    return Response({
        "message": f"Removed '{prod_name}' from your cart.",
        "cart": cart_serializer.data
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cart_clear_api(request):
    """
    Empties all items from customer's cart.
    """
    cart, _ = Cart.objects.get_or_create(user=request.user)
    cart.items.all().delete()
    cart_serializer = CartSerializer(cart, context={'request': request})
    return Response({
        "message": "Cart cleared successfully.",
        "cart": cart_serializer.data
    }, status=status.HTTP_200_OK)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def order_list_create_api(request):
    """
    Customer Checkout & Order List API.
    - GET: Returns all historical orders placed by the authenticated customer.
    - POST: Checkout API. Converts cart items into a locked Order with OrderItem snapshots inside an atomic transaction.
    """
    if request.method == 'GET':
        orders = Order.objects.filter(user=request.user).order_by('-created_at')
        serializer = OrderSerializer(orders, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    elif request.method == 'POST':
        cart, _ = Cart.objects.get_or_create(user=request.user)
        cart_items = cart.items.select_related('product', 'variant', 'product__category').all()

        if not cart_items.exists():
            return Response({"error": "Your cart is empty. Please add products before checking out."}, status=status.HTTP_400_BAD_REQUEST)

        customer_name = request.data.get('customer_name') or request.user.first_name or request.user.username
        customer_mobile = request.data.get('customer_mobile') or (getattr(request.user, 'profile', None) and request.user.profile.mobile_number) or request.user.username
        customer_address = request.data.get('customer_address') or (getattr(request.user, 'profile', None) and request.user.profile.address) or ""

        if not customer_mobile or not customer_address:
            return Response(
                {"error": "Shipping mobile number and delivery address are required to complete checkout."},
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            now_str = datetime.datetime.now().strftime('%Y%m%d%H%M%S')
            order_number = f"RP-{now_str}-{request.user.id}"

            total_amount = Decimal('0.00')

            order = Order.objects.create(
                user=request.user,
                order_number=order_number,
                status=Order.STATUS_PENDING,
                total_amount=Decimal('0.00'),
                customer_name=customer_name,
                customer_mobile=customer_mobile,
                customer_address=customer_address
            )

            for item in cart_items:
                prod = item.product
                var = item.variant
                gsm_val = item.gsm or (prod.gsm if prod else None)

                size_str = prod.size if prod else ""
                weight_val = prod.weight if prod else None
                gsm_price_per_kg_val = None

                if prod and prod.category and prod.category.category_type == 'RAW_MATERIAL':
                    if gsm_val and weight_val:
                        global_obj = GlobalGSMPrice.objects.filter(gsm=gsm_val).first()
                        if global_obj and global_obj.price > 0:
                            gsm_price_per_kg_val = global_obj.price
                            unit_price = (global_obj.price * Decimal(str(weight_val))).quantize(Decimal('0.01'))
                        else:
                            unit_price = Decimal('0.00')
                    else:
                        unit_price = Decimal('0.00')
                    var_name_str = f"{gsm_val} GSM Roll" if gsm_val else "Raw Material Reel"
                    unit_pack_str = f"{weight_val:g} kg" if weight_val else ""
                elif var:
                    unit_price = var.price
                    var_name_str = var.variant_name
                    unit_pack_str = var.unit_packing

                    if var.stock >= item.quantity:
                        old_stock = var.stock
                        var.stock -= item.quantity
                        var.save()

                        StockHistory.objects.create(
                            variant=var,
                            previous_stock=old_stock,
                            change_amount=-item.quantity,
                            new_stock=var.stock,
                            reason=StockHistory.REASON_ORDER,
                            user=request.user
                        )
                        trigger_stock_notifications(var)
                else:
                    unit_price = prod.base_price if prod else Decimal('0.00')
                    var_name_str = ""
                    unit_pack_str = ""

                item_total = (unit_price * Decimal(str(item.quantity))).quantize(Decimal('0.01'))
                total_amount += item_total

                OrderItem.objects.create(
                    order=order,
                    product=prod,
                    variant=var,
                    gsm=gsm_val,
                    product_name=prod.name if prod else "Deleted Product",
                    size=size_str,
                    weight=weight_val,
                    gsm_price_per_kg=gsm_price_per_kg_val,
                    variant_name=var_name_str,
                    unit_packing=unit_pack_str,
                    price=unit_price,
                    quantity=item.quantity,
                    item_total=item_total
                )

            order.total_amount = total_amount
            order.save()

            cart.items.all().delete()

            Notification.objects.create(
                user=request.user,
                is_admin_notification=False,
                notification_type=Notification.TYPE_ORDER_STATUS,
                title=f"Order #{order.order_number} Placed",
                message=f"Your order #{order.order_number} for ₹{float(total_amount):.2f} has been placed successfully and is pending confirmation.",
                order=order
            )

            Notification.objects.create(
                user=None,
                is_admin_notification=True,
                notification_type=Notification.TYPE_NEW_ORDER,
                title=f"New Order Received: #{order.order_number}",
                message=f"New order placed by {customer_name} ({customer_mobile}) worth ₹{float(total_amount):.2f}.",
                order=order
            )

        serializer = OrderSerializer(order, context={'request': request})
        return Response({
            "message": f"Order #{order.order_number} placed successfully!",
            "order": serializer.data
        }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def order_detail_api(request, pk):
    """
    Retrieves complete snapshot details of a specific customer order.
    """
    try:
        order = Order.objects.get(pk=pk, user=request.user)
    except Order.DoesNotExist:
        return Response({"error": "Order not found."}, status=status.HTTP_404_NOT_FOUND)

    serializer = OrderSerializer(order, context={'request': request})
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def order_cancel_api(request, pk):
    """
    Customer Order Cancellation API.
    Cancels order if status is PENDING and restores variant stock.
    """
    try:
        order = Order.objects.get(pk=pk, user=request.user)
    except Order.DoesNotExist:
        return Response({"error": "Order not found."}, status=status.HTTP_404_NOT_FOUND)

    if order.status != Order.STATUS_PENDING:
        return Response(
            {"error": f"Cannot cancel order with status '{order.get_status_display()}'. Only 'Pending' orders can be cancelled."},
            status=status.HTTP_400_BAD_REQUEST
        )

    with transaction.atomic():
        order.status = Order.STATUS_CANCELLED
        order.save()

        for item in order.items.all():
            if item.variant:
                var = item.variant
                old_stock = var.stock
                var.stock += item.quantity
                var.save()

                StockHistory.objects.create(
                    variant=var,
                    previous_stock=old_stock,
                    change_amount=item.quantity,
                    new_stock=var.stock,
                    reason=StockHistory.REASON_RESTORE,
                    user=request.user
                )

        Notification.objects.create(
            user=request.user,
            is_admin_notification=False,
            notification_type=Notification.TYPE_ORDER_STATUS,
            title=f"Order #{order.order_number} Cancelled",
            message=f"Your order #{order.order_number} has been cancelled successfully.",
            order=order
        )

    serializer = OrderSerializer(order, context={'request': request})
    return Response({
        "message": f"Order #{order.order_number} cancelled successfully.",
        "order": serializer.data
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_dashboard_api(request):
    """
    Admin Executive Dashboard Analytics API.
    Calculates live metrics from actual database tables.
    Filters out soft-removed orders (is_removed_by_admin=False).
    """
    total_customers = User.objects.filter(is_staff=False).count()
    total_products = Product.objects.count()
    active_orders = Order.objects.filter(is_removed_by_admin=False)
    
    total_orders = active_orders.count()
    pending_orders = active_orders.filter(status=Order.STATUS_PENDING).count()
    received_orders = active_orders.filter(status=Order.STATUS_RECEIVED).count()

    valid_orders = active_orders.exclude(status=Order.STATUS_CANCELLED)
    total_sales = sum(float(o.total_amount) for o in valid_orders)

    sales_chart = []
    today = datetime.date.today()
    for i in range(6, -1, -1):
        day_date = today - datetime.timedelta(days=i)
        day_orders = valid_orders.filter(created_at__date=day_date)
        day_sales = sum(float(o.total_amount) for o in day_orders)
        sales_chart.append({
            "date": day_date.strftime("%b %d"),
            "sales": round(day_sales, 2),
            "orders": day_orders.count()
        })

    status_counts = {
        "PENDING": active_orders.filter(status=Order.STATUS_PENDING).count(),
        "CONFIRMED": active_orders.filter(status=Order.STATUS_CONFIRMED).count(),
        "PROCESSING": active_orders.filter(status=Order.STATUS_PROCESSING).count(),
        "SHIPPED": active_orders.filter(status=Order.STATUS_SHIPPED).count(),
        "RECEIVED": active_orders.filter(status=Order.STATUS_RECEIVED).count(),
        "DELIVERED": active_orders.filter(status=Order.STATUS_RECEIVED).count(),
        "CANCELLED": active_orders.filter(status=Order.STATUS_CANCELLED).count(),
    }

    low_stock_variants = ProductVariant.objects.filter(stock__lte=10).select_related('product')
    low_stock_list = [
        {
            "id": v.id,
            "product_name": v.product.name,
            "variant_name": v.variant_name,
            "unit_packing": v.unit_packing,
            "stock": v.stock,
            "status": "OUT_OF_STOCK" if v.stock == 0 else "LOW_STOCK"
        }
        for v in low_stock_variants
    ]

    recent_orders_qs = active_orders.order_by('-created_at')[:5]
    recent_orders_data = OrderSerializer(recent_orders_qs, many=True, context={'request': request}).data

    unread_admin_notifications = Notification.objects.filter(is_admin_notification=True, is_read=False).count()

    return Response({
        "summary": {
            "total_customers": total_customers,
            "total_products": total_products,
            "total_orders": total_orders,
            "pending_orders": pending_orders,
            "received_orders": received_orders,
            "delivered_orders": received_orders,
            "total_sales": round(total_sales, 2),
            "unread_admin_notifications": unread_admin_notifications
        },
        "sales_chart": sales_chart,
        "status_counts": status_counts,
        "low_stock_products": low_stock_list,
        "recent_orders": recent_orders_data
    })


@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_orders_api(request):
    """
    Admin Orders List & Search API.
    Filters out soft-removed orders (is_removed_by_admin=False).
    """
    status_filter = request.GET.get('status', '').strip().upper()
    search_query = request.GET.get('search', '').strip()

    orders = Order.objects.filter(is_removed_by_admin=False)

    if status_filter:
        if status_filter == 'DELIVERED':
            status_filter = Order.STATUS_RECEIVED
        orders = orders.filter(status=status_filter)

    if search_query:
        orders = orders.filter(
            order_number__icontains=search_query
        ) | orders.filter(
            customer_name__icontains=search_query
        ) | orders.filter(
            customer_mobile__icontains=search_query
        )

    orders = orders.order_by('-created_at')
    serializer = OrderSerializer(orders, many=True, context={'request': request})
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['PATCH'])
@permission_classes([IsAdminUser])
def admin_order_status_api(request, pk):
    """
    Admin Order Status Update API.
    Maps legacy 'DELIVERED' status to 'RECEIVED'.
    """
    try:
        order = Order.objects.get(pk=pk)
    except Order.DoesNotExist:
        return Response({"error": "Order not found."}, status=status.HTTP_404_NOT_FOUND)

    new_status = request.data.get('status', '').strip().upper()
    if new_status == 'DELIVERED':
        new_status = Order.STATUS_RECEIVED

    valid_statuses = [choice[0] for choice in Order.STATUS_CHOICES]
    if new_status not in valid_statuses:
        return Response({"error": f"Invalid status '{new_status}'."}, status=status.HTTP_400_BAD_REQUEST)

    if order.status == Order.STATUS_RECEIVED and new_status != Order.STATUS_RECEIVED:
        return Response({"error": "Order marked as Received cannot be reverted."}, status=status.HTTP_400_BAD_REQUEST)

    old_status_display = order.get_status_display()
    order.status = new_status
    order.save()

    new_status_display = order.get_status_display()

    if order.user:
        Notification.objects.create(
            user=order.user,
            is_admin_notification=False,
            notification_type=Notification.TYPE_ORDER_STATUS,
            title=f"Order #{order.order_number} Status Updated",
            message=f"Your order #{order.order_number} status has been updated to '{new_status_display}'.",
            order=order
        )

    serializer = OrderSerializer(order, context={'request': request})
    return Response({
        "message": f"Order #{order.order_number} status updated from '{old_status_display}' to '{new_status_display}'.",
        "order": serializer.data
    }, status=status.HTTP_200_OK)


@api_view(['DELETE'])
@permission_classes([IsAdminUser])
def admin_order_delete_api(request, pk):
    """
    Admin Soft Order Removal API.
    Sets is_removed_by_admin=True to hide order from active list while preserving DB history.
    """
    try:
        order = Order.objects.get(pk=pk)
    except Order.DoesNotExist:
        return Response({"error": "Order not found."}, status=status.HTTP_404_NOT_FOUND)

    order.is_removed_by_admin = True
    order.save()

    return Response({
        "message": f"Order #{order.order_number} soft-removed from active admin orders list. Customer order history & DB metrics preserved.",
        "removed_order_id": pk
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_orders_bulk_remove_api(request):
    """
    POST: Admin Bulk Soft Order Removal API.
    """
    ids = request.data.get('ids', [])
    if not isinstance(ids, list) or not ids:
        return Response({"error": "No order IDs provided for bulk removal."}, status=status.HTTP_400_BAD_REQUEST)

    removed_count = 0
    failed_count = 0
    failed_items = []

    for oid in ids:
        try:
            order = Order.objects.get(pk=oid)
            order.is_removed_by_admin = True
            order.save()
            removed_count += 1
        except Order.DoesNotExist:
            failed_count += 1
            failed_items.append({"id": oid, "reason": "Order record not found."})

    msg = f"{removed_count} order(s) soft-removed from active list."
    if failed_count > 0:
        msg += f" {failed_count} order(s) could not be removed."

    return Response({
        "message": msg,
        "removed_count": removed_count,
        "deleted_count": removed_count,
        "failed_count": failed_count,
        "failed_items": failed_items
    }, status=status.HTTP_200_OK)
