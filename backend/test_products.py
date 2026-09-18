import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from rest_framework.test import APIClient
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken
from categories.models import Category
from products.models import Product, ProductVariant

def test_product_apis():
    print("--- TESTING STEP 4 PRODUCT & CATEGORY APIs ---")

    # Clean up test user & admin
    User.objects.filter(username="test_cust_user").delete()
    User.objects.filter(username="test_admin_user").delete()

    customer_user = User.objects.create_user(
        username="test_cust_user",
        first_name="Customer User",
        password="CustomerPassword123"
    )
    admin_user = User.objects.create_user(
        username="test_admin_user",
        first_name="Admin User",
        password="AdminPassword123",
        is_staff=True
    )

    cust_token = str(RefreshToken.for_user(customer_user).access_token)
    admin_token = str(RefreshToken.for_user(admin_user).access_token)

    client_public = APIClient()
    client_customer = APIClient()
    client_customer.credentials(HTTP_AUTHORIZATION=f'Bearer {cust_token}')
    client_admin = APIClient()
    client_admin.credentials(HTTP_AUTHORIZATION=f'Bearer {admin_token}')

    # 1. Test Public GET Categories & Products
    res_cat_get = client_public.get('/api/categories/')
    assert res_cat_get.status_code == 200, f"GET /api/categories/ failed: {res_cat_get.data}"
    print("[OK] Public GET /api/categories/ works (200 OK).")

    res_prod_get = client_public.get('/api/products/')
    assert res_prod_get.status_code == 200, f"GET /api/products/ failed: {res_prod_get.data}"
    print("[OK] Public GET /api/products/ works (200 OK).")

    # 2. Test Customer POST Category / Product (Expect 403 Forbidden)
    cat_payload = {
        "name": "Disposable Thalis",
        "category_type": "DISPOSABLE",
        "description": "Full plate & compartment thalis"
    }
    res_cust_cat = client_customer.post('/api/categories/', cat_payload, format='json')
    assert res_cust_cat.status_code == 403, f"Expected 403 for Customer POST category, got {res_cust_cat.status_code}"
    print("[OK] Customer POST /api/categories/ rejected with 403 Forbidden.")

    # 3. Test Admin POST Category (Expect 201 Created)
    res_admin_cat = client_admin.post('/api/categories/', cat_payload, format='json')
    assert res_admin_cat.status_code == 201, f"Admin POST category failed: {res_admin_cat.data}"
    category_id = res_admin_cat.data['id']
    print(f"[OK] Admin POST /api/categories/ created Category ID={category_id}.")

    # 4. Test Customer POST Product (Expect 403 Forbidden)
    prod_payload = {
        "category": category_id,
        "name": "Full Meal 4 Compartment Thali",
        "description": "Heavy gauge silver thali for wedding events",
        "size": "12 inch",
        "base_price": 1200.00,
        "variants": [
            {
                "variant_name": "Standard - 100 Pcs/Bori",
                "unit_packing": "100 pcs/bori",
                "price": 1250.00,
                "stock": 40
            }
        ]
    }
    res_cust_prod = client_customer.post('/api/products/', prod_payload, format='json')
    assert res_cust_prod.status_code == 403, f"Expected 403 for Customer POST product, got {res_cust_prod.status_code}"
    print("[OK] Customer POST /api/products/ rejected with 403 Forbidden.")

    # 5. Test Admin POST Product (Expect 201 Created)
    res_admin_prod = client_admin.post('/api/products/', prod_payload, format='json')
    assert res_admin_prod.status_code == 201, f"Admin POST product failed: {res_admin_prod.data}"
    product_id = res_admin_prod.data['id']
    assert len(res_admin_prod.data['variants']) == 1, "Product variant creation failed"
    print(f"[OK] Admin POST /api/products/ created Product ID={product_id} with 1 variant.")

    # 6. Test Admin PUT Product Update (Expect 200 OK)
    update_payload = prod_payload.copy()
    update_payload['name'] = "Full Meal 4 Compartment Thali (Premium)"
    update_payload['base_price'] = 1300.00
    res_update = client_admin.put(f'/api/products/{product_id}/', update_payload, format='json')
    assert res_update.status_code == 200, f"Admin PUT product failed: {res_update.data}"
    assert res_update.data['name'] == "Full Meal 4 Compartment Thali (Premium)", "Product update failed"
    print(f"[OK] Admin PUT /api/products/{product_id}/ updated product successfully.")

    # 7. Test Admin Toggle Active (Expect 200 OK)
    res_toggle = client_admin.post(f'/api/products/{product_id}/toggle-active/')
    assert res_toggle.status_code == 200, f"Toggle active failed: {res_toggle.data}"
    assert res_toggle.data['is_active'] is False, "Product active status toggle failed"
    print(f"[OK] Admin toggle-active set product is_active=False.")

    # 8. Test Admin DELETE Product (Deactivates safely)
    res_del = client_admin.delete(f'/api/products/{product_id}/')
    assert res_del.status_code == 200, f"DELETE product failed: {res_del.data}"
    print(f"[OK] Admin DELETE /api/products/{product_id}/ deactivated product safely.")

    print("\n=== ALL STEP 4 PRODUCT & PERMISSION TESTS PASSED PERFECTLY ===")

if __name__ == '__main__':
    test_product_apis()
