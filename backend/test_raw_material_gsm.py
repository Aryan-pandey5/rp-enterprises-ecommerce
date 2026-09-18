import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from decimal import Decimal
from rest_framework.test import APIClient
from django.contrib.auth.models import User
from categories.models import Category
from products.models import Product, ProductVariant, GlobalGSMPrice
from orders.models import Cart, CartItem, Order, OrderItem

def test_raw_material_gsm_pricing():
    print("--- TESTING RAW MATERIAL SIZE, WEIGHT & AUTOMATIC GSM PRICING ---")

    client = APIClient()

    # 1. Setup Admin and Customer users
    User.objects.filter(username="gsm_test_admin").delete()
    User.objects.filter(username="gsm_test_cust").delete()

    admin_user = User.objects.create_user(username="gsm_test_admin", password="Password123!", is_staff=True, is_superuser=True)
    cust_user = User.objects.create_user(username="gsm_test_cust", password="Password123!", is_staff=False)

    # 2. Setup Categories (RAW_MATERIAL vs DISPOSABLE)
    raw_cat = Category.objects.filter(name="Paper Rolls & Reels", category_type="RAW_MATERIAL").first()
    if not raw_cat:
        raw_cat = Category.objects.create(name="Paper Rolls & Reels", category_type="RAW_MATERIAL", is_active=True)
    else:
        raw_cat.is_active = True
        raw_cat.save()

    dispo_cat = Category.objects.filter(name="Disposable Dona", category_type="DISPOSABLE").first()
    if not dispo_cat:
        dispo_cat = Category.objects.create(name="Disposable Dona", category_type="DISPOSABLE", is_active=True)
    else:
        dispo_cat.is_active = True
        dispo_cat.save()

    # 3. Admin configures Central Global GSM Prices (/api/gsm-prices/)
    client.force_authenticate(user=admin_user)

    global_prices_payload = [
        {"gsm": 80, "price": "70.00"},
        {"gsm": 90, "price": "75.00"},
        {"gsm": 100, "price": "80.00"},
        {"gsm": 120, "price": "90.00"},
        {"gsm": 140, "price": "100.00"}
    ]

    res_global = client.put('/api/gsm-prices/', global_prices_payload, format='json')
    assert res_global.status_code == 200, f"Updating global GSM prices failed: {res_global.data}"
    print("[OK] Global GSM Prices configured: 80 GSM=Rs.70/kg, 90 GSM=Rs.75/kg, 100 GSM=Rs.80/kg, 120 GSM=Rs.90/kg, 140 GSM=Rs.100/kg.")

    # 4. Test Weight Validation (Weight <= 0 or missing must be rejected with 'Weight must be greater than 0 kg.')
    invalid_weight_payload = {
        "name": "Invalid Weight Roll",
        "category": raw_cat.id,
        "size": "36 × 48 inch",
        "weight": "0",
        "gsm": 100
    }
    res_inv = client.post('/api/products/', invalid_weight_payload, format='multipart')
    assert res_inv.status_code == 400, f"Expected 400 for weight <= 0, got {res_inv.status_code}"
    assert "Weight must be greater than 0 kg." in str(res_inv.data), f"Expected validation error message, got {res_inv.data}"
    print("[OK] Weight Validation verified: Weight <= 0 properly rejected with message 'Weight must be greater than 0 kg.'.")

    # 5. Create Raw Material product (Paper Roll: Size="36 × 48 inch", Weight=25 kg, GSM=100)
    roll_payload = {
        "name": "Paper Roll",
        "category": raw_cat.id,
        "size": "36 × 48 inch",
        "weight": "25.00",
        "gsm": 100,
        "description": "Premium wholesale paper roll",
        "is_active": True
    }

    res_create = client.post('/api/products/', roll_payload, format='multipart')
    assert res_create.status_code == 201, f"Raw Material product creation failed: {res_create.data}"
    prod_id = res_create.data['id']
    paper_roll = Product.objects.get(id=prod_id)

    # Verify calculated price = GSM rate (80) * Weight (25) = Rs. 2,000
    assert float(res_create.data['calculated_price']) == 2000.00, f"Expected Rs.2000.00, got {res_create.data['calculated_price']}"
    assert res_create.data['size'] == "36 × 48 inch"
    assert float(res_create.data['weight']) == 25.00
    assert res_create.data['gsm'] == 100
    print("[OK] Raw Material product created: Paper Roll (36 × 48 inch, 25 kg, 100 GSM) -> Final Price = Rs. 2,000 (80/kg x 25 kg).")

    # 6. Test Automatic Price Update when Global GSM Price changes (100 GSM from Rs.80/kg to Rs.90/kg)
    client.put('/api/gsm-prices/', [{"gsm": 100, "price": "90.00"}], format='json')

    res_roll_updated = client.get(f'/api/products/{paper_roll.id}/')
    assert float(res_roll_updated.data['calculated_price']) == 2250.00, f"Expected Rs.2250.00 (90*25), got {res_roll_updated.data['calculated_price']}"
    print("[OK] Global Price Update verified: Updating 100 GSM to Rs.90/kg automatically updated Paper Roll price to Rs. 2,250 without editing the product.")

    # Reset 100 GSM price back to Rs. 80/kg for remaining tests
    client.put('/api/gsm-prices/', [{"gsm": 100, "price": "80.00"}], format='json')

    # 7. Test Different Weight (50 kg roll)
    roll_50kg = Product.objects.create(
        category=raw_cat,
        name="Heavy Duty Paper Roll",
        size="36 × 48 inch",
        weight=Decimal("50.00"),
        gsm=100
    )
    res_50kg = client.get(f'/api/products/{roll_50kg.id}/')
    assert float(res_50kg.data['calculated_price']) == 4000.00, f"Expected 4000.00, got {res_50kg.data['calculated_price']}"
    print("[OK] Weight = 50 kg test passed: Rs.80 x 50 kg = Rs. 4,000.")

    # 8. Test Decimal Weight (12.5 kg roll)
    roll_decimal = Product.objects.create(
        category=raw_cat,
        name="Small PE Reel",
        size="24 × 36 inch",
        weight=Decimal("12.50"),
        gsm=100
    )
    res_dec = client.get(f'/api/products/{roll_decimal.id}/')
    assert float(res_dec.data['calculated_price']) == 1000.00, f"Expected 1000.00, got {res_dec.data['calculated_price']}"
    print("[OK] Decimal Weight = 12.5 kg test passed: Rs.80 x 12.5 kg = Rs. 1,000.")

    # 9. Test Cart Calculation
    client.force_authenticate(user=cust_user)
    res_cart = client.post('/api/cart/items/', {"product_id": paper_roll.id, "quantity": 2}, format='json')
    assert res_cart.status_code in [200, 201], f"Add to cart failed: {res_cart.data}"

    cart = Cart.objects.get(user=cust_user)
    cart_item = cart.items.first()
    assert float(res_cart.data['cart']['subtotal']) == 4000.00, f"Expected subtotal 4000.00 (2000*2), got {res_cart.data['cart']['subtotal']}"
    print("[OK] Cart backend price calculation verified: Subtotal = Rs. 4,000 for 2 units of 25 kg roll @ Rs.80/kg.")

    # 10. Test Order Creation & Historical Price Snapshot
    order_payload = {
        "customer_name": "R.P. Client",
        "customer_mobile": "9876543210",
        "customer_address": "Factory Gate 1, Industrial Area"
    }
    res_order = client.post('/api/orders/', order_payload, format='json')
    assert res_order.status_code == 201, f"Order creation failed: {res_order.data}"

    order_id = res_order.data['order']['id']
    order = Order.objects.get(id=order_id)
    order_item = order.items.first()

    assert float(order_item.price) == 2000.00
    assert order_item.weight == Decimal("25.00")
    assert order_item.gsm == 100
    assert float(order_item.gsm_price_per_kg) == 80.00
    print(f"[OK] Order #{order.order_number} created: Historical snapshot locked at Rs. 2,000 per unit (25 kg @ Rs.80/kg).")

    # 11. Test Future GSM Price Change does NOT alter past orders
    client.force_authenticate(user=admin_user)
    client.put('/api/gsm-prices/', [{"gsm": 100, "price": "120.00"}], format='json')

    order_item.refresh_from_db()
    assert float(order_item.price) == 2000.00, f"Order price altered! Expected 2000.00, got {order_item.price}"
    print("[OK] Historical Order Protection verified: Updating global GSM rate later did NOT change past order invoice.")

    # 12. Verify Disposable Products remain 100% operational
    dispo_prod = Product.objects.create(name="Paper Dona 8 Inch", category=dispo_cat, base_price=300.00)
    dispo_var = ProductVariant.objects.create(product=dispo_prod, variant_name="100 Pcs/Bori", unit_packing="100 Pcs", price=400.00, stock=20)

    client.force_authenticate(user=cust_user)
    res_dispo_cart = client.post('/api/cart/items/', {"product_id": dispo_prod.id, "variant_id": dispo_var.id, "quantity": 1}, format='json')
    assert res_dispo_cart.status_code in [200, 201], f"Disposable add to cart failed: {res_dispo_cart.data}"
    print("[OK] Disposable products system remains 100% operational & unaffected.")

    print("\n=== ALL RAW MATERIAL SIZE, WEIGHT & AUTOMATIC GSM PRICING TESTS PASSED PERFECTLY ===")

if __name__ == '__main__':
    test_raw_material_gsm_pricing()

