import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from rest_framework.test import APIClient
from django.contrib.auth.models import User
from categories.models import Category
from products.models import Product, ProductVariant

def test_admin_category_edit_and_delete():
    print("--- TESTING ADMIN CATEGORY EDIT & DELETE APIs ---")

    client = APIClient()

    # 1. Setup Admin and Customer users
    User.objects.filter(username="cat_test_admin").delete()
    User.objects.filter(username="cat_test_cust").delete()

    admin_user = User.objects.create_user(username="cat_test_admin", password="Password123!", is_staff=True, is_superuser=True)
    cust_user = User.objects.create_user(username="cat_test_cust", password="Password123!", is_staff=False)

    # 2. Create test category
    cat_empty = Category.objects.create(name="Temporary Category", category_type="DISPOSABLE", description="To be edited or deleted")
    cat_with_prod = Category.objects.create(name="Protected Category", category_type="DISPOSABLE", description="Has products attached")
    prod = Product.objects.create(name="Attached Dona Item", category=cat_with_prod)

    # 3. Test Customer Edit & Delete -> 403 Forbidden
    client.force_authenticate(user=cust_user)
    
    res_cust_edit = client.put(f'/api/categories/{cat_empty.id}/', {"name": "Hacked Name"}, format='json')
    assert res_cust_edit.status_code == 403, f"Expected 403 Forbidden for customer edit, got {res_cust_edit.status_code}"
    
    res_cust_del = client.delete(f'/api/categories/{cat_empty.id}/')
    assert res_cust_del.status_code == 403, f"Expected 403 Forbidden for customer delete, got {res_cust_del.status_code}"
    print("[OK] Customer Category Edit and Delete requests properly rejected with 403 Forbidden.")

    # 4. Test Admin Category Edit (PUT /api/categories/<id>/) -> 200 OK
    client.force_authenticate(user=admin_user)
    
    edit_payload = {
        "name": "Updated Dona Category",
        "category_type": "DISPOSABLE",
        "description": "Updated via Admin Edit Modal",
        "is_active": True
    }
    res_admin_edit = client.put(f'/api/categories/{cat_empty.id}/', edit_payload, format='json')
    assert res_admin_edit.status_code == 200, f"Admin category edit failed: {res_admin_edit.data}"
    assert res_admin_edit.data['category']['name'] == "Updated Dona Category", "Category name was not updated"
    print("[OK] Admin Category Edit (PUT) successful: Name updated to 'Updated Dona Category'.")

    # 5. Test Product Relationship Protection (DELETE category with products -> 400 Bad Request)
    res_del_protected = client.delete(f'/api/categories/{cat_with_prod.id}/')
    assert res_del_protected.status_code == 400, f"Expected 400 Bad Request for category with products, got {res_del_protected.status_code}"
    assert "associated with it" in res_del_protected.data.get('error', '').lower(), f"Unexpected protection error message: {res_del_protected.data}"
    assert Category.objects.filter(id=cat_with_prod.id).exists(), "Protected category should NOT have been deleted"
    assert Product.objects.filter(id=prod.id).exists(), "Associated product should NOT have been deleted"
    print("[OK] Product Relationship Protection verified: Deletion blocked (400 Bad Request), products & category preserved intact.")

    # 6. Test Admin Category Delete (DELETE empty category -> 200 OK)
    res_del_empty = client.delete(f'/api/categories/{cat_empty.id}/')
    assert res_del_empty.status_code == 200, f"Empty category deletion failed: {res_del_empty.data}"
    assert not Category.objects.filter(id=cat_empty.id).exists(), "Empty category was not removed from DB"
    print(f"[OK] Admin Category Delete successful: Category #{cat_empty.id} deleted safely.")

    print("\n=== ALL ADMIN CATEGORY EDIT & DELETE TESTS PASSED PERFECTLY ===")

if __name__ == '__main__':
    test_admin_category_edit_and_delete()
