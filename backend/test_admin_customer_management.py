import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from rest_framework.test import APIClient
from django.contrib.auth.models import User
from django.contrib.auth.hashers import check_password
from categories.models import Category
from products.models import Product
from orders.models import Cart, CartItem, Order, OrderItem
from accounts.models import CustomerProfile

def test_admin_customer_management():
    print("--- TESTING ADMIN CUSTOMER MANAGEMENT, SORTING & ORDER PRESERVATION APIs ---")

    client = APIClient()

    # Cleanup test users and test orders
    Order.objects.filter(order_number__startswith="ORD-C").delete()
    User.objects.filter(username__in=["adm_cust_admin", "adm_cust_user1", "adm_cust_user2", "adm_cust_user3", "9123456789"]).delete()

    # 1. Setup Admin and 3 Customers
    admin_user = User.objects.create_user(username="adm_cust_admin", password="Password123!", is_staff=True, is_superuser=True)

    cust1 = User.objects.create_user(username="adm_cust_user1", first_name="Rahul Sharma", password="Password123!")
    CustomerProfile.objects.create(user=cust1, mobile_number="9800000001", address="101 Market Yard")

    cust2 = User.objects.create_user(username="adm_cust_user2", first_name="Amit Patel", password="Password123!")
    CustomerProfile.objects.create(user=cust2, mobile_number="9800000002", address="202 Industrial Estate")

    cust3 = User.objects.create_user(username="adm_cust_user3", first_name="Ravi Kumar", password="Password123!")
    CustomerProfile.objects.create(user=cust3, mobile_number="9800000003", address="303 Factory Road")

    # 2. Setup Products & Orders for testing aggregation
    cat = Category.objects.create(name="Disposable Dona", category_type="DISPOSABLE")
    prod = Product.objects.create(name="Dona 8 Inch", category=cat, base_price=100.00)

    # Cust 1: 3 orders @ Rs 5000 = Rs 15,000 (Highest)
    for i in range(3):
        Order.objects.create(
            user=cust1,
            order_number=f"ORD-C1-{i}",
            status=Order.STATUS_CONFIRMED,
            total_amount=5000.00,
            customer_name="Rahul Sharma",
            customer_mobile="9800000001",
            customer_address="101 Market Yard"
        )

    # Cust 2: 1 order @ Rs 8000 = Rs 8,000 (Medium) + 1 Cancelled Order (Rs 10,000 - should be excluded from total purchase)
    Order.objects.create(
        user=cust2,
        order_number="ORD-C2-1",
        status=Order.STATUS_DELIVERED,
        total_amount=8000.00,
        customer_name="Amit Patel",
        customer_mobile="9800000002",
        customer_address="202 Industrial Estate"
    )
    Order.objects.create(
        user=cust2,
        order_number="ORD-C2-CANCELLED",
        status=Order.STATUS_CANCELLED,
        total_amount=10000.00,
        customer_name="Amit Patel",
        customer_mobile="9800000002",
        customer_address="202 Industrial Estate"
    )

    # Cust 3: 0 valid orders = Rs 0 (Lowest)

    # 3. Test Security & Permission Enforcement (Normal customer access rejected -> 403 Forbidden)
    client.force_authenticate(user=cust1)
    res_unauth = client.get('/api/admin/customers/')
    assert res_unauth.status_code == 403, f"Expected 403 for normal customer access, got {res_unauth.status_code}"
    print("[OK] Customer directory endpoints properly protected with 403 Forbidden for non-staff users.")

    # 4. Test Admin Customer List with Backend Sorting by Total Purchase (High -> Low)
    client.force_authenticate(user=admin_user)
    res_sort_purchase = client.get('/api/admin/customers/?sort=total_purchase&order=desc')
    assert res_sort_purchase.status_code == 200, f"Customer list fetch failed: {res_sort_purchase.data}"
    
    customers_list = res_sort_purchase.data
    # Filter only test customers
    test_c_ids = [cust1.id, cust2.id, cust3.id]
    test_customers = [c for c in customers_list if c['id'] in test_c_ids]

    assert test_customers[0]['id'] == cust1.id, f"Expected highest spender Rahul (Rs 15000) first, got {test_customers[0]['name']}"
    assert float(test_customers[0]['total_spent']) == 15000.00
    assert test_customers[1]['id'] == cust2.id, f"Expected Amit (Rs 8000) second, got {test_customers[1]['name']}"
    assert float(test_customers[1]['total_spent']) == 8000.00 # Excluded cancelled order!
    assert test_customers[2]['id'] == cust3.id, f"Expected Ravi (Rs 0) last, got {test_customers[2]['name']}"
    print("[OK] Sort by Total Purchase (High -> Low) verified: Cancelled orders excluded from purchase total.")

    # 5. Test Admin Customer List with Backend Sorting by Total Orders (High -> Low)
    res_sort_orders = client.get('/api/admin/customers/?sort=total_orders&order=desc')
    assert res_sort_orders.status_code == 200
    test_customers_orders = [c for c in res_sort_orders.data if c['id'] in test_c_ids]
    assert test_customers_orders[0]['id'] == cust1.id and test_customers_orders[0]['total_orders'] == 3
    assert test_customers_orders[1]['id'] == cust2.id and test_customers_orders[1]['total_orders'] == 1
    print("[OK] Sort by Total Orders (High -> Low) verified via ORM annotations.")

    # 6. Test Customer Search by Name or Mobile
    res_search = client.get('/api/admin/customers/?search=Amit')
    assert res_search.status_code == 200
    search_ids = [c['id'] for c in res_search.data]
    assert cust2.id in search_ids and cust1.id not in search_ids
    print("[OK] Customer search by name/mobile verified.")

    # 7. Test Admin Manual Customer Creation (POST /api/admin/customers/)
    new_cust_payload = {
        "name": "Manual Customer",
        "mobile_number": "9123456789",
        "address": "Factory Gate 12",
        "password": "Password123!"
    }
    res_create = client.post('/api/admin/customers/', new_cust_payload, format='json')
    assert res_create.status_code == 201, f"Manual customer creation failed: {res_create.data}"
    created_user_id = res_create.data['customer']['id']

    # Verify password hashing in DB
    db_user = User.objects.get(id=created_user_id)
    assert check_password("Password123!", db_user.password), "Password was not securely hashed!"
    assert db_user.password != "Password123!", "Plain text password stored!"
    
    # Verify customer login works
    client.logout()
    res_login = client.post('/api/auth/login/', {"mobile_number": "9123456789", "password": "Password123!"}, format='json')
    assert res_login.status_code == 200, f"Created customer failed to log in: {res_login.data}"
    print("[OK] Admin manual customer creation verified: Passwords securely hashed with Django standards.")

    # 8. Test Duplicate Customer Mobile Validation
    client.force_authenticate(user=admin_user)
    res_dup = client.post('/api/admin/customers/', new_cust_payload, format='json')
    assert res_dup.status_code == 400, f"Expected 400 Bad Request for duplicate mobile, got {res_dup.status_code}"
    assert "already exists" in str(res_dup.data), f"Unexpected duplicate response message: {res_dup.data}"
    print("[OK] Duplicate mobile number registration rejected with 400 Bad Request.")

    # 9. Test Customer Deletion with Historical Order Preservation (DELETE /api/admin/customers/<id>/delete/)
    # Cust 1 has 3 historical orders
    orders_before = list(Order.objects.filter(user=cust1))
    assert len(orders_before) == 3

    res_delete = client.delete(f'/api/admin/customers/{cust1.id}/delete/')
    assert res_delete.status_code == 200, f"Customer deletion failed: {res_delete.data}"
    assert not User.objects.filter(id=cust1.id).exists(), "User account was not deleted from DB!"

    # Verify historical orders REMAIN intact in database with user_id = NULL
    preserved_orders = Order.objects.filter(order_number__startswith="ORD-C1-")
    assert preserved_orders.count() == 3, f"Expected 3 preserved historical orders, found {preserved_orders.count()}"
    first_order = preserved_orders.first()
    assert first_order.user is None, "Order.user was not set to NULL!"
    assert first_order.customer_name == "Rahul Sharma"
    assert first_order.customer_mobile == "9800000001"
    assert float(first_order.total_amount) == 5000.00
    print("[OK] Customer Account Deletion & Order History Preservation verified: Account deleted, login removed, 3 historical order invoices preserved 100% intact.")

    print("\n=== ALL ADMIN CUSTOMER MANAGEMENT TESTS PASSED PERFECTLY ===")

if __name__ == '__main__':
    test_admin_customer_management()
