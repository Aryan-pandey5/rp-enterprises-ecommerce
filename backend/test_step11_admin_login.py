import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from rest_framework.test import APIClient
from django.contrib.auth.models import User
from setup_admin import setup_admin_account

def test_step11_admin_login():
    print("--- TESTING STEP 11 ADMIN LOGIN & PERMISSION ENFORCEMENT ---")

    # 1. Run admin account setup to ensure superuser Rajaryan8299 exists
    setup_admin_account()

    client = APIClient()

    # Create a normal customer user
    User.objects.filter(username="norm_cust_99").delete()
    norm_user = User.objects.create_user(username="norm_cust_99", password="Password123!")

    # 2. Test Normal Customer attempting Admin Login -> 403 Forbidden
    cust_payload = {
        "username": "norm_cust_99",
        "password": "Password123!"
    }
    res_cust = client.post('/api/auth/admin/login/', cust_payload, format='json')
    assert res_cust.status_code == 403, f"Expected 403 Forbidden for normal customer admin login, got {res_cust.status_code}"
    assert "administrator access" in res_cust.data.get('error', '').lower(), f"Unexpected error message: {res_cust.data}"
    print("[OK] Normal customer admin login rejected with 403 Forbidden ('You do not have administrator access.').")

    # 3. Test Admin Username with Invalid Password -> 401 Unauthorized
    invalid_pass_payload = {
        "username": "Rajaryan8299",
        "password": "WrongPassword123"
    }
    res_inv = client.post('/api/auth/admin/login/', invalid_pass_payload, format='json')
    assert res_inv.status_code == 401, f"Expected 401 Unauthorized, got {res_inv.status_code}"
    print("[OK] Invalid admin password rejected with 401 Unauthorized.")

    # 4. Test Valid Admin Credentials -> 200 OK
    valid_admin_payload = {
        "username": "Rajaryan8299",
        "password": "76829300"
    }
    res_admin = client.post('/api/auth/admin/login/', valid_admin_payload, format='json')
    assert res_admin.status_code == 200, f"Valid admin login failed: {res_admin.data}"
    admin_data = res_admin.data
    assert "tokens" in admin_data, "JWT tokens missing in admin login response"
    assert admin_data['user']['is_staff'] is True, "is_staff must be True for admin"
    print(f"[OK] Admin login successful for '{admin_data['user']['username']}': JWT access & refresh tokens returned.")

    print("\n=== ALL STEP 11 ADMIN LOGIN TESTS PASSED PERFECTLY ===")

if __name__ == '__main__':
    test_step11_admin_login()
