from django.db import transaction
from django.db.models import Q
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework import status

from .models import StockHistory
from .serializers import StockHistorySerializer
from products.models import ProductVariant
from products.serializers import ProductVariantSerializer
from notifications.models import Notification


def trigger_stock_notifications(variant):
    """
    Helper trigger creating system & admin notifications when stock drops below thresholds (<= 10 low stock, 0 out of stock).
    """
    if variant.stock == 0:
        Notification.objects.create(
            user=None,
            is_admin_notification=True,
            notification_type=Notification.TYPE_OUT_OF_STOCK,
            title=f"Out of Stock Alert: {variant.product.name}",
            message=f"Variant '{variant.variant_name}' of product '{variant.product.name}' is completely out of stock (0 units)."
        )
    elif variant.stock <= 10:
        Notification.objects.create(
            user=None,
            is_admin_notification=True,
            notification_type=Notification.TYPE_LOW_STOCK,
            title=f"Low Stock Warning: {variant.product.name}",
            message=f"Variant '{variant.variant_name}' of product '{variant.product.name}' is low in stock ({variant.stock} units remaining)."
        )


@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_stock_api(request):
    """
    Admin Inventory & Stock Search API.
    Lists all product variants with live stock levels, audit logs, and status indicators.
    Supports filtering by search query (?search=), section (?section=DISPOSABLE|RAW_MATERIAL),
    and stock status (?status=ALL|LOW_STOCK|OUT_OF_STOCK|IN_STOCK).
    """
    search_query = request.GET.get('search', '').strip()
    section_filter = request.GET.get('section', '').strip().upper()
    status_filter = request.GET.get('status', '').strip().upper()

    variants = ProductVariant.objects.select_related('product', 'product__category').all()

    if search_query:
        query_parts = search_query.split()
        gsm_match = None
        for part in query_parts:
            if part.lower().endswith('gsm'):
                try:
                    gsm_match = int(part[:-3])
                except ValueError:
                    pass

        q_filter = (
            Q(product__name__icontains=search_query) |
            Q(variant_name__icontains=search_query) |
            Q(unit_packing__icontains=search_query) |
            Q(product__category__name__icontains=search_query) |
            Q(product__size__icontains=search_query)
        )

        if gsm_match:
            q_filter |= Q(product__gsm=gsm_match)

        variants = variants.filter(q_filter)

    if section_filter in ['DISPOSABLE', 'RAW_MATERIAL']:
        variants = variants.filter(product__category__category_type=section_filter)

    if status_filter == 'OUT_OF_STOCK':
        variants = variants.filter(stock=0)
    elif status_filter == 'LOW_STOCK':
        variants = variants.filter(stock__gt=0, stock__lte=10)
    elif status_filter == 'IN_STOCK':
        variants = variants.filter(stock__gt=10)

    result_data = []
    for v in variants:
        if v.stock == 0:
            stock_status = "OUT_OF_STOCK"
        elif v.stock <= 10:
            stock_status = "LOW_STOCK"
        else:
            stock_status = "IN_STOCK"

        result_data.append({
            "id": v.id,
            "product_id": v.product.id,
            "product_name": v.product.name,
            "category_name": v.product.category.name if v.product.category else "Uncategorized",
            "category_type": v.product.category.category_type if v.product.category else "DISPOSABLE",
            "variant_name": v.variant_name,
            "unit_packing": v.unit_packing,
            "price": str(v.price),
            "stock": v.stock,
            "stock_status": stock_status,
            "gsm": v.product.gsm,
            "weight": str(v.product.weight) if v.product.weight else None,
            "size": v.product.size,
            "is_active": v.is_active,
            "updated_at": v.updated_at
        })

    return Response({
        "total_count": len(result_data),
        "variants": result_data
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_stock_update_api(request):
    """
    Admin Stock Update API.
    Updates variant stock level and logs StockHistory audit record.
    """
    variant_id = request.data.get('variant_id')
    new_stock = request.data.get('new_stock')
    reason = request.data.get('reason', StockHistory.REASON_MANUAL)

    if variant_id is None or new_stock is None:
        return Response({"error": "Both variant_id and new_stock are required."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        new_stock_int = int(new_stock)
        if new_stock_int < 0:
            return Response({"error": "Stock level cannot be negative."}, status=status.HTTP_400_BAD_REQUEST)
    except (ValueError, TypeError):
        return Response({"error": "Invalid stock quantity value."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        variant = ProductVariant.objects.get(pk=variant_id)
    except ProductVariant.DoesNotExist:
        return Response({"error": "Product variant not found."}, status=status.HTTP_404_NOT_FOUND)

    with transaction.atomic():
        old_stock = variant.stock
        change_amount = new_stock_int - old_stock
        variant.stock = new_stock_int
        variant.save()

        history = StockHistory.objects.create(
            variant=variant,
            previous_stock=old_stock,
            change_amount=change_amount,
            new_stock=new_stock_int,
            reason=reason,
            user=request.user
        )

        trigger_stock_notifications(variant)

    variant_serializer = ProductVariantSerializer(variant)
    history_serializer = StockHistorySerializer(history)

    return Response({
        "message": f"Stock for '{variant.product.name} ({variant.variant_name})' updated from {old_stock} to {new_stock_int}.",
        "variant": variant_serializer.data,
        "history": history_serializer.data
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_stock_bulk_delete_api(request):
    """
    POST: Admin Bulk Stock & Variant Delete API.
    Enforces IsAdminUser staff permission.
    """
    ids = request.data.get('ids', [])
    if not isinstance(ids, list) or not ids:
        return Response({"error": "No variant IDs provided for bulk deletion."}, status=status.HTTP_400_BAD_REQUEST)

    deleted_count = 0
    failed_count = 0
    failed_items = []

    for vid in ids:
        try:
            variant = ProductVariant.objects.get(pk=vid)
            variant.delete()
            deleted_count += 1
        except ProductVariant.DoesNotExist:
            failed_count += 1
            failed_items.append({"id": vid, "reason": "Variant not found."})

    msg = f"{deleted_count} product variant(s) deleted successfully."
    if failed_count > 0:
        msg += f" {failed_count} variant(s) could not be deleted."

    return Response({
        "message": msg,
        "deleted_count": deleted_count,
        "failed_count": failed_count,
        "failed_items": failed_items
    }, status=status.HTTP_200_OK)
