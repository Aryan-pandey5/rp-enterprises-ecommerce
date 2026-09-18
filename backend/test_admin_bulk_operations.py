import os
import django
import uuid

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from rest_framework.test import APIClient
from categories.models import Category
from products.models import Product, ProductVariant
from orders.models import Order, OrderItem
from accounts.models import CustomerProfile

def test_admin_bulk_operations():
    print("\n--- Running Test Suite: Admin Bulk Select & Bulk Delete Operations ---")
    client = APIClient()

    # 1. Setup Admin user and Non-Admin user
    admin_user, _ = User.objects.get_or_create(
        username='admin_bulk_tester',
        defaults={'email': 'admin_bulk@test.com', 'is_staff': True, 'is_superuser': True}
    )
    admin_user.set_password('adminpass123')
    admin_user.is_staff = True
    admin_user.save()

    customer_user, _ = User.objects.get_or_create(
        username='9999900002',
        defaults={'email': 'customer_bulk@test.com', 'is_staff': False}
    )
    customer_user.set_password('custpass123')
    customer_user.is_staff = False
    customer_user.save()
    CustomerProfile.objects.get_or_create(user=customer_user, defaults={'mobile_number': '9999900002'})

    # Get admin token
    res = client.post('/api/auth/admin/login/', {'username': 'admin_bulk_tester', 'password': 'adminpass123'}, format='json')
    assert res.status_code == 200, f"Admin token generation failed: {res.data if hasattr(res, 'data') else res.content}"
    admin_token = res.data['tokens']['access']

    # Get customer token
    res = client.post('/api/auth/login/', {'mobile_number': '9999900002', 'password': 'custpass123'}, format='json')
    assert res.status_code == 200, f"Customer token generation failed: {res.data if hasattr(res, 'data') else res.content}"
    customer_token = res.data['tokens']['access']

    # Test 1: Non-staff / 403 Forbidden checks on all 5 bulk endpoints
    endpoints = [
        '/api/products/bulk-delete/',
        '/api/categories/bulk-delete/',
        '/api/admin/customers/bulk-delete/',
        '/api/admin/stock/bulk-delete/',
        '/api/admin/orders/bulk-remove/',
    ]
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {customer_token}')
    for ep in endpoints:
        resp = client.post(ep, {'ids': [1, 2]}, format='json')
        assert resp.status_code == 403, f"Endpoint {ep} should return 403 Forbidden for non-staff, got {resp.status_code}"
    print("  [OK] Non-staff 403 Forbidden permission checks verified on all 5 endpoints.")

    # Switch to Admin client
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {admin_token}')

    # --- Test 2: Bulk Products Delete ---
    cat = Category.objects.create(name='Bulk Product Cat', category_type='DISPOSABLE')
    p1 = Product.objects.create(category=cat, name='Bulk Product 1', base_price=10.0)
    p2 = Product.objects.create(category=cat, name='Bulk Product 2', base_price=20.0)
    p3 = Product.objects.create(category=cat, name='Bulk Product 3', base_price=30.0)
    
    ProductVariant.objects.create(product=p1, variant_name='100 GSM', price=10.0, stock=50)
    ProductVariant.objects.create(product=p2, variant_name='120 GSM', price=20.0, stock=50)

    resp = client.post('/api/products/bulk-delete/', {'ids': [p1.id, p2.id]}, format='json')
    assert resp.status_code == 200, f"Bulk product delete failed: {resp.data}"
    assert resp.data['deleted_count'] == 2
    assert not Product.objects.filter(id__in=[p1.id, p2.id]).exists()
    assert Product.objects.filter(id=p3.id).exists()
    print("  [OK] Bulk Products Delete endpoint verified.")

    # --- Test 3: Bulk Categories Delete (Safe Deletion with Product Protection) ---
    c_empty1 = Category.objects.create(name='Empty Cat 1', category_type='DISPOSABLE')
    c_empty2 = Category.objects.create(name='Empty Cat 2', category_type='RAW_MATERIAL')
    c_protected = Category.objects.create(name='Protected Cat', category_type='DISPOSABLE')
    Product.objects.create(category=c_protected, name='Linked Product', base_price=50.0)

    resp = client.post('/api/categories/bulk-delete/', {'ids': [c_empty1.id, c_empty2.id, c_protected.id]}, format='json')
    assert resp.status_code == 200, f"Bulk category delete failed: {resp.data}"
    assert resp.data['deleted_count'] == 2
    assert resp.data['failed_count'] == 1
    assert not Category.objects.filter(id__in=[c_empty1.id, c_empty2.id]).exists()
    assert Category.objects.filter(id=c_protected.id).exists()
    print("  [OK] Bulk Categories Delete (with partial success product protection) verified.")

    # --- Test 4: Bulk Customers Delete ---
    User.objects.filter(username__in=['9876543210', '9876543211', '9876543212']).delete()
    u1 = User.objects.create_user(username='9876543210', first_name='Bulk Cust 1')
    u2 = User.objects.create_user(username='9876543211', first_name='Bulk Cust 2')
    u3 = User.objects.create_user(username='9876543212', first_name='Bulk Cust 3')

    # Create historical order for u1 to ensure historical order is preserved
    ord1 = Order.objects.create(
        user=u1, 
        order_number=f"RP-TST-{uuid.uuid4().hex[:6]}",
        total_amount=500.0, 
        status='DELIVERED', 
        customer_name='Bulk Cust 1'
    )
    OrderItem.objects.create(order=ord1, product_name='Hist Product', price=500.0, quantity=1, item_total=500.0)

    resp = client.post('/api/admin/customers/bulk-delete/', {'ids': [u1.id, u2.id]}, format='json')
    assert resp.status_code == 200, f"Bulk customer delete failed: {resp.data}"
    assert resp.data['deleted_count'] == 2
    assert not User.objects.filter(id__in=[u1.id, u2.id]).exists()
    assert User.objects.filter(id=u3.id).exists()
    # Ensure historical order still exists with snapshot values
    ord1_refreshed = Order.objects.get(id=ord1.id)
    assert ord1_refreshed.user is None
    assert ord1_refreshed.customer_name == 'Bulk Cust 1'
    print("  [OK] Bulk Customers Delete (with historical order preservation) verified.")

    # --- Test 5: Bulk Stock / Variant Delete ---
    cat_stock = Category.objects.create(name='Stock Cat', category_type='DISPOSABLE')
    p_stock = Product.objects.create(category=cat_stock, name='Stock Product', base_price=15.0)
    v1 = ProductVariant.objects.create(product=p_stock, variant_name='A Grade', price=15.0, stock=100)
    v2 = ProductVariant.objects.create(product=p_stock, variant_name='B Grade', price=12.0, stock=80)
    v3 = ProductVariant.objects.create(product=p_stock, variant_name='C Grade', price=10.0, stock=60)

    resp = client.post('/api/admin/stock/bulk-delete/', {'ids': [v1.id, v2.id]}, format='json')
    assert resp.status_code == 200, f"Bulk stock delete failed: {resp.data}"
    assert resp.data['deleted_count'] == 2
    assert not ProductVariant.objects.filter(id__in=[v1.id, v2.id]).exists()
    assert ProductVariant.objects.filter(id=v3.id).exists()
    print("  [OK] Bulk Stock & Variant Delete verified.")

    # --- Test 6: Bulk Orders Soft-Remove ---
    o1 = Order.objects.create(order_number=f"RP-ORD-{uuid.uuid4().hex[:6]}", total_amount=100.0, status='PENDING')
    o2 = Order.objects.create(order_number=f"RP-ORD-{uuid.uuid4().hex[:6]}", total_amount=200.0, status='PROCESSING')
    o3 = Order.objects.create(order_number=f"RP-ORD-{uuid.uuid4().hex[:6]}", total_amount=300.0, status='DELIVERED')

    resp = client.post('/api/admin/orders/bulk-remove/', {'ids': [o1.id, o2.id]}, format='json')
    assert resp.status_code == 200, f"Bulk order remove failed: {resp.data}"
    assert resp.data['deleted_count'] == 2
    
    o1.refresh_from_db()
    o2.refresh_from_db()
    o3.refresh_from_db()
    assert o1.is_removed_by_admin is True
    assert o2.is_removed_by_admin is True
    assert o3.is_removed_by_admin is False
    print("  [OK] Bulk Orders Soft-Removal verified.")

    print("\n--- All Admin Bulk Select & Bulk Delete Operations Tests Passed 100%! ---")

if __name__ == '__main__':
    test_admin_bulk_operations()
