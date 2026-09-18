import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from rest_framework.test import APIClient
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken
from categories.models import Category
from products.models import Product, ProductVariant
from orders.models import Cart, CartItem, Order, OrderItem

def test_order_system():
    print("--- TESTING STEP 7 ORDER & CHECKOUT APIs ---")

    # Clean up test users
    User.objects.filter(username="order_cust_a").delete()
    User.objects.filter(username="order_cust_b").delete()

    cust_a = User.objects.create_user(username="order_cust_a", first_name="Order Customer A", password="PassA123!")
    cust_b = User.objects.create_user(username="order_cust_b", first_name="Order Customer B", password="PassB123!")

    token_a = str(RefreshToken.for_user(cust_a).access_token)
    token_b = str(RefreshToken.for_user(cust_b).access_token)

    client_a = APIClient()
    client_a.credentials(HTTP_AUTHORIZATION=f'Bearer {token_a}')
    client_b = APIClient()
    client_b.credentials(HTTP_AUTHORIZATION=f'Bearer {token_b}')

    # 1. Empty Cart Order Attempt -> 400 Bad Request
    res_empty = client_a.post('/api/orders/', {}, format='json')
    assert res_empty.status_code == 400, f"Expected 400 for empty cart checkout, got {res_empty.status_code}"
    print("[OK] Empty cart checkout rejected with 400 Bad Request.")

    # 2. Setup Category, Product & Variant with Stock = 10
    category, _ = Category.objects.get_or_create(name="Order Dona Category", category_type="DISPOSABLE")
    category.is_active = True
    category.save()
    product, _ = Product.objects.get_or_create(
        name="10 Inch Thali Test", 
        category=category, 
        defaults={"base_price": 500.00, "is_active": True}
    )
    product.is_active = True
    product.save()
    variant, _ = ProductVariant.objects.get_or_create(
        product=product,
        variant_name="200 Pcs/Bori",
        defaults={"unit_packing": "200 pcs/bori", "price": 900.00, "stock": 10, "is_active": True}
    )
    variant.is_active = True
    variant.stock = 10
    variant.save()

    # 3. Add 4 units to Customer A's Cart
    client_a.post('/api/cart/items/', {"product_id": product.id, "variant_id": variant.id, "quantity": 4}, format='json')

    # 4. Place Order (Customer A)
    order_payload = {
        "customer_name": "Order Customer A",
        "customer_mobile": "9876543210",
        "customer_address": "Factory Gate 2, Industrial Estate"
    }
    res_order = client_a.post('/api/orders/', order_payload, format='json')
    assert res_order.status_code == 201, f"Order placement failed: {res_order.data}"
    
    order_data = res_order.data['order']
    order_id = order_data['id']
    order_number = order_data['order_number']
    
    assert order_number.startswith("RP-"), f"Invalid order number format: {order_number}"
    assert float(order_data['total_amount']) == 3600.00, f"Expected total 3600.00 (900*4), got {order_data['total_amount']}"
    assert len(order_data['items']) == 1, "Order item snapshot missing"
    
    # Verify stock deduction: Stock was 10, ordered 4 -> Remaining stock should be 6
    variant.refresh_from_db()
    assert variant.stock == 6, f"Expected stock 6 after ordering 4, got {variant.stock}"
    
    # Verify cart clearing
    cart_res = client_a.get('/api/cart/')
    assert cart_res.data['total_items'] == 0, "Cart was not cleared after order placement"
    
    print(f"[OK] Created Order #{order_number}: Total=Rs.{order_data['total_amount']}, Stock reduced 10 -> {variant.stock}, Cart cleared.")

    # 5. Customer Isolation Test: Customer B tries to view Customer A's order -> 404 Not Found
    res_b_view = client_b.get(f'/api/orders/{order_id}/')
    assert res_b_view.status_code == 404, f"Customer B accessed Customer A's order! Got {res_b_view.status_code}"
    print("[OK] Customer isolation verified: Customer B cannot view Customer A's order.")

    # 6. Cancel Order & Verify Stock Restoration
    res_cancel = client_a.post(f'/api/orders/{order_id}/cancel/')
    assert res_cancel.status_code == 200, f"Order cancellation failed: {res_cancel.data}"
    assert res_cancel.data['order']['status'] == 'CANCELLED', "Order status not updated to CANCELLED"
    
    # Verify stock restored: Remaining stock 6 + 4 restored = 10
    variant.refresh_from_db()
    assert variant.stock == 10, f"Expected stock restored to 10, got {variant.stock}"
    print(f"[OK] Order #{order_number} cancelled: Status=CANCELLED, Stock restored to {variant.stock}.")

    print("\n=== ALL STEP 7 ORDER & CHECKOUT TESTS PASSED PERFECTLY ===")

if __name__ == '__main__':
    test_order_system()
