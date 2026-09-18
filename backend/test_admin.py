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
from orders.models import Order
from inventory.models import StockHistory

def test_admin_system():
    print("--- TESTING STEP 8 ADMIN DASHBOARD & MANAGEMENT APIs ---")

    # Clean up test users
    User.objects.filter(username="adm_cust_norm").delete()
    User.objects.filter(username="adm_staff_user").delete()

    cust_norm = User.objects.create_user(username="adm_cust_norm", first_name="Normal Cust", password="PassCust123!")
    staff_user = User.objects.create_user(username="adm_staff_user", first_name="Admin Staff", password="PassAdmin123!", is_staff=True)

    token_norm = str(RefreshToken.for_user(cust_norm).access_token)
    token_staff = str(RefreshToken.for_user(staff_user).access_token)

    client_norm = APIClient()
    client_norm.credentials(HTTP_AUTHORIZATION=f'Bearer {token_norm}')
    
    client_admin = APIClient()
    client_admin.credentials(HTTP_AUTHORIZATION=f'Bearer {token_staff}')

    # 1. Normal Customer Access -> 403 Forbidden
    res_norm_dash = client_norm.get('/api/admin/dashboard/')
    assert res_norm_dash.status_code == 403, f"Expected 403 for normal customer admin dashboard access, got {res_norm_dash.status_code}"
    print("[OK] Normal customer access to /api/admin/dashboard/ rejected with 403 Forbidden.")

    # 2. Admin Dashboard Access -> 200 OK
    res_admin_dash = client_admin.get('/api/admin/dashboard/')
    assert res_admin_dash.status_code == 200, f"Admin dashboard failed: {res_admin_dash.data}"
    dash_data = res_admin_dash.data
    assert "summary" in dash_data, "Summary key missing in dashboard data"
    assert "sales_chart" in dash_data, "Sales chart key missing"
    assert "low_stock_products" in dash_data, "Low stock products key missing"
    print(f"[OK] Admin dashboard loaded: Total Customers={dash_data['summary']['total_customers']}, Total Orders={dash_data['summary']['total_orders']}, Total Sales=Rs.{dash_data['summary']['total_sales']}.")

    # 3. Setup Variant for Stock Adjustment
    category, _ = Category.objects.get_or_create(name="Stock Test Category", category_type="DISPOSABLE")
    product = Product.objects.create(name=f"Stock Test Dona {datetime.datetime.now().timestamp()}", category=category, base_price=200.00)
    variant = ProductVariant.objects.create(product=product, variant_name="100 Pcs", price=250.00, stock=5)

    # 4. Admin Stock Update -> POST /api/admin/stock/update/
    stock_payload = {
        "variant_id": variant.id,
        "new_stock": 50,
        "reason": "NEW_STOCK"
    }
    res_stock_upd = client_admin.post('/api/admin/stock/update/', stock_payload, format='json')
    assert res_stock_upd.status_code == 200, f"Stock update failed: {res_stock_upd.data}"
    variant.refresh_from_db()
    assert variant.stock == 50, f"Expected stock 50, got {variant.stock}"
    
    # Check StockHistory audit log creation
    history_log = StockHistory.objects.filter(variant=variant).latest('created_at')
    assert history_log is not None, "StockHistory log not created"
    assert history_log.previous_stock == 5, f"Expected prev stock 5, got {history_log.previous_stock}"
    assert history_log.new_stock == 50, f"Expected new stock 50, got {history_log.new_stock}"
    print(f"[OK] Admin stock update verified: Stock updated 5 -> 50, Audit log created ({history_log.get_reason_display()}).")

    # 5. Admin Customer Directory Access -> GET /api/admin/customers/
    res_cust = client_admin.get('/api/admin/customers/')
    assert res_cust.status_code == 200, f"Admin customer list failed: {res_cust.data}"
    assert len(res_cust.data) >= 1, "Customer list empty"
    # Ensure password field is NOT present
    assert "password" not in res_cust.data[0], "SECURITY VIOLATION: Password hash exposed in customer API!"
    print("[OK] Customer directory loaded safely (passwords excluded).")

    print("\n=== ALL STEP 8 ADMIN DASHBOARD & MANAGEMENT TESTS PASSED PERFECTLY ===")

if __name__ == '__main__':
    test_admin_system()
