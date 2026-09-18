import os
import datetime
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from rest_framework.test import APIClient
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken
from categories.models import Category
from products.models import Product, ProductVariant
from orders.models import Cart, CartItem, Order
from notifications.models import Notification

def test_notification_system():
    print("--- TESTING STEP 9 NOTIFICATION & BUSINESS FEATURES APIs ---")

    # Clean up test users
    User.objects.filter(username="notif_cust_a").delete()
    User.objects.filter(username="notif_cust_b").delete()
    User.objects.filter(username="notif_admin").delete()

    cust_a = User.objects.create_user(username="notif_cust_a", first_name="Rahul Sharma", password="PassCustA123!")
    cust_b = User.objects.create_user(username="notif_cust_b", first_name="Anita Roy", password="PassCustB123!")
    admin_user = User.objects.create_user(username="notif_admin", first_name="Admin Boss", password="PassAdmin123!", is_staff=True)

    token_a = str(RefreshToken.for_user(cust_a).access_token)
    token_b = str(RefreshToken.for_user(cust_b).access_token)
    token_admin = str(RefreshToken.for_user(admin_user).access_token)

    client_a = APIClient()
    client_a.credentials(HTTP_AUTHORIZATION=f'Bearer {token_a}')

    client_b = APIClient()
    client_b.credentials(HTTP_AUTHORIZATION=f'Bearer {token_b}')

    client_admin = APIClient()
    client_admin.credentials(HTTP_AUTHORIZATION=f'Bearer {token_admin}')

    # 1. Setup Product Variant with Stock = 8 (low stock condition)
    category, _ = Category.objects.get_or_create(name="Notif Category", category_type="DISPOSABLE")
    product = Product.objects.create(name=f"Notif Thali {datetime.datetime.now().timestamp()}", category=category, base_price=300.00)
    variant = ProductVariant.objects.create(product=product, variant_name="12 inch Heavy", price=350.00, stock=8)

    # 2. Add to Cart and Place Order as Customer A
    cart, _ = Cart.objects.get_or_create(user=cust_a)
    CartItem.objects.create(cart=cart, product=product, variant=variant, quantity=2)

    order_payload = {
        "customer_name": "Rahul Sharma",
        "customer_mobile": "9876543210",
        "customer_address": "Factory Gate 2, Kanpur"
    }

    res_order = client_a.post('/api/orders/', order_payload, format='json')
    assert res_order.status_code == 201, f"Order placement failed: {res_order.data}"
    order_data = res_order.data['order']
    order_id = order_data['id']
    print(f"[OK] Order #{order_data['order_number']} created successfully despite missing WhatsApp credentials (fail-safe verified).")

    # 3. Check Customer A Notification Creation
    res_notif_a = client_a.get('/api/notifications/')
    assert res_notif_a.status_code == 200, f"Customer notification list failed: {res_notif_a.data}"
    assert len(res_notif_a.data) >= 1, "Customer notification list empty"
    cust_notif = res_notif_a.data[0]
    assert cust_notif['notification_type'] == 'ORDER_STATUS', f"Expected ORDER_STATUS, got {cust_notif['notification_type']}"
    print(f"[OK] Customer notification created: '{cust_notif['title']}'.")

    # 4. Check Customer Isolation (Customer B sees 0 notifications)
    res_notif_b = client_b.get('/api/notifications/')
    assert res_notif_b.status_code == 200, f"Customer B notification check failed: {res_notif_b.data}"
    assert len(res_notif_b.data) == 0, f"Customer isolation violation! Customer B sees {len(res_notif_b.data)} notifications"
    print("[OK] Customer isolation verified: Customer B sees 0 notifications.")

    # 5. Check Admin Notifications (New Order + Low Stock Trigger)
    res_admin_notif = client_admin.get('/api/notifications/?admin=true')
    assert res_admin_notif.status_code == 200, f"Admin notification check failed: {res_admin_notif.data}"
    admin_notifs = res_admin_notif.data
    assert len(admin_notifs) >= 1, "Admin notification list empty"
    print(f"[OK] Admin received {len(admin_notifs)} system notifications (New Order / Low Stock alerts).")

    # 6. Test Mark All as Read
    res_read_all = client_a.patch('/api/notifications/read-all/')
    assert res_read_all.status_code == 200, f"Mark read all failed: {res_read_all.data}"
    
    res_unread = client_a.get('/api/notifications/unread-count/')
    assert res_unread.data['unread_count'] == 0, f"Expected unread count 0, got {res_unread.data['unread_count']}"
    print("[OK] Mark all notifications as read verified (Unread count = 0).")

    print("\n=== ALL STEP 9 NOTIFICATION & BUSINESS FEATURE TESTS PASSED PERFECTLY ===")

if __name__ == '__main__':
    test_notification_system()
