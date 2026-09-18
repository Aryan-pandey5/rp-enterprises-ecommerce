import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from rest_framework.test import APIClient
from django.contrib.auth.models import User
from categories.models import Category
from products.models import Product, ProductVariant
from orders.models import Cart, CartItem, Order, OrderItem

def test_product_delete_and_availability():
    print("--- TESTING PRODUCT AVAILABILITY & PERMANENT DELETE APIs ---")

    client = APIClient()

    # 1. Setup Admin and Customer users
    User.objects.filter(username="prod_test_admin").delete()
    User.objects.filter(username="prod_test_cust").delete()

    admin_user = User.objects.create_user(username="prod_test_admin", password="Password123!", is_staff=True, is_superuser=True)
    cust_user = User.objects.create_user(username="prod_test_cust", password="Password123!", is_staff=False)

    # 2. Setup Category, Product & Variant
    cat = Category.objects.create(name="Disposable Bowls", category_type="DISPOSABLE")
    prod = Product.objects.create(name="Silver Bowl 250ml", category=cat, base_price=180.00, is_active=True)
    var = ProductVariant.objects.create(product=prod, variant_name="100 Pcs Pack", unit_packing="100 Pcs", price=180.00, stock=50, is_active=True)

    # 3. Test Availability Toggle (Available -> Not Available)
    client.force_authenticate(user=admin_user)
    res_toggle = client.post(f'/api/products/{prod.id}/toggle-active/')
    assert res_toggle.status_code == 200, f"Toggle active failed: {res_toggle.data}"
    prod.refresh_from_db()
    assert prod.is_active is False, "Product should now be inactive (Not Available)"
    print("[OK] Product status toggled to 'Not Available' (is_active=False).")

    # 4. Test Add-to-Cart Rejection on Unavailable Product -> 400 Bad Request
    client.force_authenticate(user=cust_user)
    res_cart = client.post('/api/cart/items/', {"product_id": prod.id, "variant_id": var.id, "quantity": 1}, format='json')
    assert res_cart.status_code == 400, f"Expected 400 Bad Request for unavailable product add-to-cart, got {res_cart.status_code}"
    assert "not available" in res_cart.data.get('error', '').lower(), f"Unexpected cart error message: {res_cart.data}"
    print("[OK] Add-to-Cart rejected with 400 Bad Request for 'Not Available' product ('This product is currently not available.').")

    # 5. Toggle Product back to Available & Place an Order
    client.force_authenticate(user=admin_user)
    client.post(f'/api/products/{prod.id}/toggle-active/')
    prod.refresh_from_db()
    assert prod.is_active is True, "Product should be Available"

    client.force_authenticate(user=cust_user)
    client.post('/api/cart/items/', {"product_id": prod.id, "variant_id": var.id, "quantity": 2}, format='json')
    
    order_payload = {
        "customer_name": "Test Customer",
        "customer_mobile": "9876543210",
        "customer_address": "Test Delivery Address"
    }
    res_order = client.post('/api/orders/', order_payload, format='json')
    assert res_order.status_code == 201, f"Order placement failed: {res_order.data}"
    order_id = res_order.data['order']['id']
    order = Order.objects.get(id=order_id)
    order_item = order.items.first()
    assert order_item.product_name == "Silver Bowl 250ml", "OrderItem product name snapshot missing"
    assert float(order_item.price) == 180.00, "OrderItem price snapshot missing"
    print(f"[OK] Order #{order.order_number} placed successfully with OrderItem snapshot values.")

    # 6. Test Customer Delete attempt -> 403 Forbidden
    res_cust_del = client.delete(f'/api/products/{prod.id}/')
    assert res_cust_del.status_code == 403, f"Expected 403 Forbidden for customer product delete, got {res_cust_del.status_code}"
    print("[OK] Customer product deletion request properly rejected with 403 Forbidden.")

    # 7. Test Admin Permanent Product Deletion (DELETE /api/products/<id>/)
    client.force_authenticate(user=admin_user)
    res_perm_del = client.delete(f'/api/products/{prod.id}/')
    assert res_perm_del.status_code == 200, f"Permanent product deletion failed: {res_perm_del.data}"
    assert not Product.objects.filter(id=prod.id).exists(), "Product was not permanently deleted from DB"
    assert not ProductVariant.objects.filter(id=var.id).exists(), "ProductVariant child was not deleted"
    print(f"[OK] Permanent Product Deletion (DELETE) successful: Product #{prod.id} & variants removed from DB.")

    # 8. CRUCIAL ORDER HISTORY PROTECTION VERIFICATION
    # Verify the order and OrderItem still exist intact with stored snapshot values
    order.refresh_from_db()
    order_item.refresh_from_db()
    assert order_item.product is None, "OrderItem.product foreign key should be set to NULL"
    assert order_item.product_name == "Silver Bowl 250ml", "OrderItem snapshot product_name must be preserved"
    assert order_item.variant_name == "100 Pcs Pack", "OrderItem snapshot variant_name must be preserved"
    assert float(order_item.price) == 180.00, "OrderItem snapshot price must be preserved"
    print("[OK] Order History Protection verified: Order & OrderItem snapshot data preserved 100% intact after permanent product deletion.")

    print("\n=== ALL PRODUCT AVAILABILITY & PERMANENT DELETE TESTS PASSED PERFECTLY ===")

if __name__ == '__main__':
    test_product_delete_and_availability()
