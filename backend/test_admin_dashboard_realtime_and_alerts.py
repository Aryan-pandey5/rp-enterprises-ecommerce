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

def test_admin_dashboard_realtime_and_alerts():
    print("--- TESTING ADMIN DASHBOARD REAL-TIME COUNTS & UNREAD ALERTS APIs ---")

    client = APIClient()

    # Cleanup test users, test orders and test notifications
    Order.objects.filter(order_number__startswith="ORD-DASH-").delete()
    User.objects.filter(username__in=["dash_admin_user", "dash_cust_user", "9666655555"]).delete()
    Notification.objects.filter(title__startswith="Test Dashboard Alert").delete()

    admin_user = User.objects.create_user(username="dash_admin_user", password="Password123!", is_staff=True, is_superuser=True)
    cust_user = User.objects.create_user(username="dash_cust_user", first_name="Vikram", password="Password123!", is_staff=False)
    CustomerProfile.objects.create(user=cust_user, mobile_number="9888877777", address="45 Market Yard")

    # 1. Security Test: Customer access rejected with 403 Forbidden
    client.force_authenticate(user=cust_user)
    res_unauth = client.get('/api/admin/dashboard/')
    assert res_unauth.status_code == 403, f"Expected 403 Forbidden for customer dashboard access, got {res_unauth.status_code}"
    print("[OK] Admin Dashboard API properly protected with 403 Forbidden for non-staff users.")

    # 2. Test Live Dashboard Summary Metrics
    client.force_authenticate(user=admin_user)
    res_dash1 = client.get('/api/admin/dashboard/')
    assert res_dash1.status_code == 200, f"Dashboard fetch failed: {res_dash1.data}"
    
    summary1 = res_dash1.data['summary']
    expected_customers = User.objects.filter(is_staff=False).count()
    expected_active_orders = Order.objects.filter(is_removed_by_admin=False).count()
    expected_pending = Order.objects.filter(is_removed_by_admin=False, status=Order.STATUS_PENDING).count()
    expected_received = Order.objects.filter(is_removed_by_admin=False, status=Order.STATUS_RECEIVED).count()

    assert summary1['total_customers'] == expected_customers, f"Customer count mismatch: expected {expected_customers}, got {summary1['total_customers']}"
    assert summary1['total_orders'] == expected_active_orders, f"Total orders mismatch: expected {expected_active_orders}, got {summary1['total_orders']}"
    assert summary1['pending_orders'] == expected_pending, f"Pending orders mismatch: expected {expected_pending}, got {summary1['pending_orders']}"
    assert summary1['received_orders'] == expected_received, f"Received orders mismatch: expected {expected_received}, got {summary1['received_orders']}"
    print("[OK] Live Dashboard counts match exact database queries (Total Orders, Pending Orders, Received Orders, Total Customers).")

    # 3. Test Real-time Customer Count Increment
    User.objects.create_user(username="9666655555", first_name="New Cust", password="Password123!")
    res_dash2 = client.get('/api/admin/dashboard/')
    assert res_dash2.data['summary']['total_customers'] == expected_customers + 1
    print("[OK] Real-time customer count update verified: Customer count increased automatically on DB insert.")

    # 4. Test Real-time Order Creation & Status Update
    cat = Category.objects.create(name="Dona DashTest", category_type="DISPOSABLE")
    prod = Product.objects.create(name="Paper Dona 7 Inch DashTest", category=cat, base_price=200.00)
    var = ProductVariant.objects.create(product=prod, variant_name="Std", unit_packing="100 pcs", price=300.00, stock=50)

    order = Order.objects.create(
        user=cust_user,
        order_number="ORD-DASH-001",
        status=Order.STATUS_PENDING,
        total_amount=600.00,
        customer_name="Vikram",
        customer_mobile="9888877777",
        customer_address="45 Market Yard"
    )

    res_dash3 = client.get('/api/admin/dashboard/')
    assert res_dash3.data['summary']['total_orders'] == expected_active_orders + 1
    assert res_dash3.data['summary']['pending_orders'] == expected_pending + 1
    print("[OK] Real-time order creation verified: Total & Pending order counts updated.")

    # Update Order to Received
    client.patch(f'/api/admin/orders/{order.id}/status/', {"status": "RECEIVED"}, format='json')
    res_dash4 = client.get('/api/admin/dashboard/')
    assert res_dash4.data['summary']['pending_orders'] == expected_pending
    assert res_dash4.data['summary']['received_orders'] == expected_received + 1
    print("[OK] Real-time status update to Received verified: Pending count decreased, Received count increased.")

    # Soft-remove Order
    client.delete(f'/api/admin/orders/{order.id}/delete/')
    res_dash5 = client.get('/api/admin/dashboard/')
    assert res_dash5.data['summary']['total_orders'] == expected_active_orders
    print("[OK] Soft-removed order excluded from Dashboard active counts.")

    # 5. Test Unread Alerts API & Actions
    Notification.objects.create(
        is_admin_notification=True,
        is_read=False,
        title="Test Dashboard Alert 1",
        message="Order ORD-DASH-100 placed by customer."
    )
    n2 = Notification.objects.create(
        is_admin_notification=True,
        is_read=False,
        title="Test Dashboard Alert 2",
        message="Low stock warning for Dona 7 Inch."
    )

    res_unread_list = client.get('/api/notifications/?admin=true&unread=true')
    assert res_unread_list.status_code == 200
    unread_ids = [n['id'] for n in res_unread_list.data]
    assert n2.id in unread_ids
    print("[OK] GET /api/notifications/?admin=true&unread=true returned live unread admin alerts.")

    # Mark single alert as read
    res_mark_one = client.patch(f'/api/notifications/{n2.id}/read/')
    assert res_mark_one.status_code == 200
    n2.refresh_from_db()
    assert n2.is_read == True
    print("[OK] Mark single alert as read (PATCH /api/notifications/<id>/read/) verified.")

    # Mark all alerts as read
    res_mark_all = client.patch('/api/notifications/read-all/?admin=true')
    assert res_mark_all.status_code == 200
    unread_remaining = Notification.objects.filter(is_admin_notification=True, is_read=False).count()
    assert unread_remaining == 0
    
    res_dash_final = client.get('/api/admin/dashboard/')
    assert res_dash_final.data['summary']['unread_admin_notifications'] == 0
    print("[OK] Mark all alerts as read verified: Unread count reset to 0.")

    print("\n=== ALL ADMIN DASHBOARD REAL-TIME COUNTS & UNREAD ALERTS TESTS PASSED PERFECTLY ===")

if __name__ == '__main__':
    test_admin_dashboard_realtime_and_alerts()
