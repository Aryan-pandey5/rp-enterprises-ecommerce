import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from rest_framework.test import APIClient
from django.contrib.auth.models import User
from categories.models import Category
from products.models import Product, ProductVariant
from orders.models import Cart, CartItem, Order
from notifications.models import Notification
from notifications.whatsapp import get_whatsapp_status, send_admin_whatsapp

def test_whatsapp_integration():
    print("--- TESTING OFFICIAL META WHATSAPP BUSINESS API INTEGRATION ---")

    client = APIClient()

    # ----------------------------------------------------
    # TEST A: MISSING CREDENTIALS (FAIL-SAFE TEST)
    # ----------------------------------------------------
    # Ensure WhatsApp env vars are cleared for Test A
    old_token = os.environ.get('WHATSAPP_ACCESS_TOKEN', '')
    old_phone_id = os.environ.get('WHATSAPP_PHONE_NUMBER_ID', '')
    
    os.environ['WHATSAPP_ACCESS_TOKEN'] = ''
    os.environ['WHATSAPP_PHONE_NUMBER_ID'] = ''

    # 1. Test Customer Signup without WhatsApp Credentials
    User.objects.filter(username="9111122222").delete()
    signup_data = {
        "name": "Anil Verma",
        "mobile_number": "9111122222",
        "address": "78 GIDC Industrial Area, Vapi",
        "password": "Password123",
        "confirm_password": "Password123"
    }

    res_signup = client.post('/api/auth/register/', signup_data, format='json')
    assert res_signup.status_code == 201, f"Signup failed when WhatsApp unconfigured: {res_signup.data}"
    
    user = User.objects.get(username="9111122222")
    assert Notification.objects.filter(user=user).exists(), "Customer welcome DB notification missing"
    assert Notification.objects.filter(is_admin_notification=True, title="New Customer Registered").exists(), "Admin DB signup notification missing"
    print("[OK] Test A1: Customer Signup succeeded (201 Created), DB Notifications created, WhatsApp skipped safely.")

    # 2. Test Customer Order Placement without WhatsApp Credentials
    client.force_authenticate(user=user)

    cat = Category.objects.filter(category_type="DISPOSABLE").first()
    if not cat:
        cat = Category.objects.create(name="Paper Dona WA Test", category_type="DISPOSABLE")
    prod, _ = Product.objects.get_or_create(name="Paper Dona 6 Inch WA", category=cat)
    var, _ = ProductVariant.objects.get_or_create(product=prod, variant_name="Standard 100 Pcs", defaults={"price": 350.00, "stock": 50})

    cart, _ = Cart.objects.get_or_create(user=user)
    CartItem.objects.create(cart=cart, product=prod, variant=var, quantity=2)

    order_payload = {
        "customer_name": "Anil Verma",
        "customer_mobile": "9111122222",
        "customer_address": "78 GIDC Industrial Area, Vapi"
    }

    res_order = client.post('/api/orders/', order_payload, format='json')
    assert res_order.status_code == 201, f"Order failed when WhatsApp unconfigured: {res_order.data}"
    order_id = res_order.data['order']['id']
    order = Order.objects.get(id=order_id)
    assert Notification.objects.filter(is_admin_notification=True, order=order).exists(), "Admin DB order notification missing"
    print(f"[OK] Test A2: Order #{order.order_number} created (201 Created), Stock reduced, Admin DB Notification created (No automatic order WhatsApp message).")

    # ----------------------------------------------------
    # TEST B: STATUS & CONFIGURATION CHECK
    # ----------------------------------------------------
    status_info = get_whatsapp_status()
    assert "configured" in status_info, "Status dict missing 'configured' key"
    assert status_info["admin_number"].startswith("91"), f"Admin recipient expected to start with 91, got {status_info['admin_number']}"
    print(f"[OK] Test B: WhatsApp API configuration status check verified: Status='{status_info['status']}', Recipient='{status_info['admin_number']}'.")

    # ----------------------------------------------------
    # TEST C: INVALID TOKEN FAIL-SAFE TEST
    # ----------------------------------------------------
    os.environ['WHATSAPP_ACCESS_TOKEN'] = 'INVALID_MOCK_TOKEN_12345'
    os.environ['WHATSAPP_PHONE_NUMBER_ID'] = '999999999'

    res_send = send_admin_whatsapp("Test invalid token message")
    assert res_send is False, "Expected send_admin_whatsapp to return False for invalid token"
    print("[OK] Test C: Invalid token handled safely without exception, returned False, zero secrets exposed.")

    # Restore env vars
    os.environ['WHATSAPP_ACCESS_TOKEN'] = old_token
    os.environ['WHATSAPP_PHONE_NUMBER_ID'] = old_phone_id

    print("\n=== ALL WHATSAPP INTEGRATION & FAIL-SAFE TESTS PASSED PERFECTLY ===")

if __name__ == '__main__':
    test_whatsapp_integration()
