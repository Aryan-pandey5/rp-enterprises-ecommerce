import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from rest_framework.test import APIClient
from django.contrib.auth.models import User
from categories.models import Category
from products.models import Product, ProductVariant
from orders.models import Order, OrderItem
from notifications.models import Notification
from accounts.models import CustomerProfile

def test_admin_order_remove_and_received_status():
    print("--- TESTING ADMIN ORDER REMOVE & AUTOMATIC RECEIVED STATUS APIs ---")

    client = APIClient()

    # Cleanup test users and test orders
    Order.objects.filter(order_number__startswith="ORD-REM-").delete()
    User.objects.filter(username__in=["rem_admin_user", "rem_cust_user"]).delete()

    admin_user = User.objects.create_user(username="rem_admin_user", password="Password123!", is_staff=True, is_superuser=True)
    cust_user = User.objects.create_user(username="rem_cust_user", first_name="Karan", password="Password123!", is_staff=False)
    CustomerProfile.objects.create(user=cust_user, mobile_number="9777788888", address="99 Factory Zone")

    cat = Category.objects.create(name="Disposable Plate", category_type="DISPOSABLE")
    prod = Product.objects.create(name="Thali 12 Inch", category=cat, base_price=400.00)
    var = ProductVariant.objects.create(product=prod, variant_name="Silver Heavy", unit_packing="100 pcs/bori", price=500.00, stock=100)

    # Create Order
    order = Order.objects.create(
        user=cust_user,
        order_number="ORD-REM-001",
        status=Order.STATUS_PENDING,
        total_amount=1000.00,
        customer_name="Karan",
        customer_mobile="9777788888",
        customer_address="99 Factory Zone"
    )
    OrderItem.objects.create(
        order=order,
        product=prod,
        variant=var,
        product_name="Thali 12 Inch",
        variant_name="Silver Heavy",
        price=500.00,
        quantity=2,
        item_total=1000.00
    )

    # 1. Test Customer Security Protection (403 Forbidden)
    client.force_authenticate(user=cust_user)
    res_cust_del = client.delete(f'/api/admin/orders/{order.id}/delete/')
    assert res_cust_del.status_code == 403, f"Expected 403 Forbidden for customer order delete, got {res_cust_del.status_code}"
    
    res_cust_status = client.patch(f'/api/admin/orders/{order.id}/status/', {"status": "RECEIVED"}, format='json')
    assert res_cust_status.status_code == 403, f"Expected 403 Forbidden for customer status change, got {res_cust_status.status_code}"
    print("[OK] Admin order removal & status endpoints protected with 403 Forbidden for non-staff users.")

    # 2. Test Transition to Received status (Admin updates status to DELIVERED or RECEIVED)
    client.force_authenticate(user=admin_user)
    res_status = client.patch(f'/api/admin/orders/{order.id}/status/', {"status": "DELIVERED"}, format='json')
    assert res_status.status_code == 200, f"Status update failed: {res_status.data}"
    
    order.refresh_from_db()
    assert order.status == Order.STATUS_RECEIVED, f"Expected status RECEIVED, got {order.status}"
    assert order.get_status_display() == "Received", f"Expected display 'Received', got {order.get_status_display()}"
    print("[OK] Delivered -> Received automatic mapping verified: Stored status='RECEIVED', display='Received'.")

    # Verify Customer Notification created
    cust_notif = Notification.objects.filter(user=cust_user, order=order, notification_type=Notification.TYPE_ORDER_STATUS).first()
    assert cust_notif is not None, "Customer Received notification missing!"
    assert "Received" in cust_notif.message
    print("[OK] Customer 'Received' status notification created successfully.")

    # 3. Test Invalid Transition Rejection (Received -> Pending/Processing)
    res_invalid_trans = client.patch(f'/api/admin/orders/{order.id}/status/', {"status": "PENDING"}, format='json')
    assert res_invalid_trans.status_code == 400, f"Expected 400 Bad Request for Received -> Pending transition, got {res_invalid_trans.status_code}"
    print("[OK] Invalid status transition (Received -> Pending) rejected with 400 Bad Request.")

    # 4. Test Admin Order Removal from Active List (DELETE /api/admin/orders/<id>/delete/)
    res_remove = client.delete(f'/api/admin/orders/{order.id}/delete/')
    assert res_remove.status_code == 200, f"Order removal failed: {res_remove.data}"
    
    order.refresh_from_db()
    assert order.is_removed_by_admin == True, "Order is_removed_by_admin flag was not set to True!"

    # Verify order is hidden from active Admin Orders List
    res_admin_list = client.get('/api/admin/orders/')
    assert res_admin_list.status_code == 200
    active_order_ids = [o['id'] for o in res_admin_list.data]
    assert order.id not in active_order_ids, "Removed order still appeared in active Admin orders list!"
    print("[OK] Order soft-removal verified: Order hidden from active Admin orders list.")

    # Verify Customer Order History STILL INCLUDES the order
    client.force_authenticate(user=cust_user)
    res_cust_orders = client.get('/api/orders/')
    assert res_cust_orders.status_code == 200
    cust_order_ids = [o['id'] for o in res_cust_orders.data]
    assert order.id in cust_order_ids, "Order was lost from customer history!"
    print("[OK] Customer order history preserved 100% intact after Admin soft-removal.")

    # Verify Customer Purchase Statistics (Total Purchase & Total Orders) include the order
    client.force_authenticate(user=admin_user)
    res_cust_detail = client.get(f'/api/admin/customers/{cust_user.id}/')
    assert res_cust_detail.status_code == 200
    stats = res_cust_detail.data['statistics']
    assert stats['total_orders'] == 1
    assert float(stats['total_purchase']) == 1000.00
    print("[OK] Customer purchase statistics and sales revenue preserved 100% intact.")

    print("\n=== ALL ADMIN ORDER REMOVE & RECEIVED STATUS TESTS PASSED PERFECTLY ===")

if __name__ == '__main__':
    test_admin_order_remove_and_received_status()
