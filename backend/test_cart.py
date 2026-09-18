import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from rest_framework.test import APIClient
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken
from categories.models import Category
from products.models import Product, ProductVariant
from orders.models import Cart, CartItem

def test_cart_system():
    print("--- TESTING STEP 6 CART SYSTEM APIs ---")

    # Clean up test users
    User.objects.filter(username="cart_cust_a").delete()
    User.objects.filter(username="cart_cust_b").delete()

    cust_a = User.objects.create_user(username="cart_cust_a", first_name="Customer A", password="PassA123!")
    cust_b = User.objects.create_user(username="cart_cust_b", first_name="Customer B", password="PassB123!")

    token_a = str(RefreshToken.for_user(cust_a).access_token)
    token_b = str(RefreshToken.for_user(cust_b).access_token)

    client_unauth = APIClient()
    client_a = APIClient()
    client_a.credentials(HTTP_AUTHORIZATION=f'Bearer {token_a}')
    client_b = APIClient()
    client_b.credentials(HTTP_AUTHORIZATION=f'Bearer {token_b}')

    # 1. Unauthenticated Request -> 401 Unauthorized
    res_unauth = client_unauth.get('/api/cart/')
    assert res_unauth.status_code == 401, f"Expected 401 for unauthenticated cart access, got {res_unauth.status_code}"
    print("[OK] Unauthenticated access to /api/cart/ rejected with 401 Unauthorized.")

    # 2. Get Test Product & Variants
    category, _ = Category.objects.get_or_create(name="Test Dona", category_type="DISPOSABLE")
    category.is_active = True
    category.save()
    product, _ = Product.objects.get_or_create(
        name="8 Inch Paper Dona Test", 
        category=category, 
        defaults={"base_price": 300.00, "is_active": True}
    )
    product.is_active = True
    product.save()
    var1, _ = ProductVariant.objects.get_or_create(
        product=product,
        variant_name="100 Pcs/Bori",
        defaults={"unit_packing": "100 pcs/bori", "price": 400.00, "stock": 100}
    )
    var2, _ = ProductVariant.objects.get_or_create(
        product=product,
        variant_name="200 Pcs/Bori",
        defaults={"unit_packing": "200 pcs/bori", "price": 750.00, "stock": 50}
    )

    # 3. Add Item to Cart (Customer A)
    add_payload_1 = {
        "product_id": product.id,
        "variant_id": var1.id,
        "quantity": 2
    }
    res_add_1 = client_a.post('/api/cart/items/', add_payload_1, format='json')
    assert res_add_1.status_code in [200, 201], f"Add to cart failed: {res_add_1.data}"
    cart_data_1 = res_add_1.data['cart']
    assert cart_data_1['total_items'] == 2, f"Expected 2 total items, got {cart_data_1['total_items']}"
    assert cart_data_1['subtotal'] == 800.00, f"Expected subtotal 800.00 (400*2), got {cart_data_1['subtotal']}"
    print(f"[OK] Added Product+Variant 1 to cart: Subtotal=Rs.{cart_data_1['subtotal']}.")

    # 4. Duplicate Add (Same Product + Variant) -> Should increment quantity to 5
    add_payload_duplicate = {
        "product_id": product.id,
        "variant_id": var1.id,
        "quantity": 3
    }
    res_add_dup = client_a.post('/api/cart/items/', add_payload_duplicate, format='json')
    assert res_add_dup.status_code == 200, f"Duplicate add failed: {res_add_dup.data}"
    cart_data_dup = res_add_dup.data['cart']
    assert len(cart_data_dup['items']) == 1, "Duplicate item created separate entry instead of incrementing"
    assert cart_data_dup['items'][0]['quantity'] == 5, "Quantity increment failed"
    assert cart_data_dup['subtotal'] == 2000.00, f"Expected subtotal 2000.00, got {cart_data_dup['subtotal']}"
    print("[OK] Duplicate product+variant add incremented quantity to 5 (no duplicate item created).")

    # 5. Add Different Variant (Variant 2) -> Should create separate cart item
    add_payload_2 = {
        "product_id": product.id,
        "variant_id": var2.id,
        "quantity": 1
    }
    res_add_2 = client_a.post('/api/cart/items/', add_payload_2, format='json')
    assert res_add_2.status_code in [200, 201], f"Add variant 2 failed: {res_add_2.data}"
    cart_data_2 = res_add_2.data['cart']
    assert len(cart_data_2['items']) == 2, "Different variant did not create separate item"
    assert cart_data_2['subtotal'] == 2750.00, f"Expected subtotal 2750.00 (2000 + 750), got {cart_data_2['subtotal']}"
    print(f"[OK] Added different variant created separate cart item: Total items=6, Subtotal=Rs.{cart_data_2['subtotal']}.")

    # 6. Customer Isolation Test: Customer B tries to update Customer A's cart item -> 404 Not Found
    item_id_a = cart_data_2['items'][0]['id']
    res_cust_b_hack = client_b.patch(f'/api/cart/items/{item_id_a}/', {"quantity": 10}, format='json')
    assert res_cust_b_hack.status_code == 404, f"Customer B was able to modify Customer A's cart item! Got {res_cust_b_hack.status_code}"
    print("[OK] Customer isolation verified: Customer B cannot tamper with Customer A's cart items.")

    # 7. Update Quantity (Customer A)
    res_patch = client_a.patch(f'/api/cart/items/{item_id_a}/', {"quantity": 2}, format='json')
    assert res_patch.status_code == 200, f"PATCH quantity failed: {res_patch.data}"
    print(f"[OK] Customer A updated cart item quantity to 2.")

    # 8. Delete Item (Customer A)
    res_del = client_a.delete(f'/api/cart/items/{item_id_a}/delete/')
    assert res_del.status_code == 200, f"Delete cart item failed: {res_del.data}"
    assert len(res_del.data['cart']['items']) == 1, "Item deletion failed"
    print("[OK] Removed cart item successfully.")

    print("\n=== ALL STEP 6 CART SYSTEM TESTS PASSED PERFECTLY ===")

if __name__ == '__main__':
    test_cart_system()
