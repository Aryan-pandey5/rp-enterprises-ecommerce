import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rp_enterprises.settings')
django.setup()

from django.contrib.auth.models import User
from rest_framework.test import APIClient

def test_admin_login_redirect_flow():
    print("\n--- Running Test Suite: Admin Login Authentication & Role Output ---")
    client = APIClient()

    # 1. Ensure Admin Account 'Rajaryan8299' exists
    admin_user, _ = User.objects.get_or_create(username='Rajaryan8299')
    admin_user.set_password('76829300')
    admin_user.is_staff = True
    admin_user.is_superuser = True
    admin_user.first_name = 'Rajaryan (Admin)'
    admin_user.save()

    # 2. Test Admin Login API: POST /api/auth/admin/login/
    res = client.post('/api/auth/admin/login/', {'username': 'Rajaryan8299', 'password': '76829300'}, format='json')
    assert res.status_code == 200, f"Admin login failed: {res.data}"
    assert 'tokens' in res.data, "Response missing 'tokens'"
    assert 'access' in res.data['tokens'], "Tokens missing 'access'"
    assert 'user' in res.data, "Response missing 'user'"
    assert res.data['user']['is_staff'] is True, "User is_staff should be True"
    assert res.data['user']['role'] == 'admin', "User role should be 'admin'"
    print("  [OK] Admin Login API returned valid JWT tokens and role='admin'.")

    # 3. Test Invalid Admin Credentials
    res_bad = client.post('/api/auth/admin/login/', {'username': 'Rajaryan8299', 'password': 'wrong_password'}, format='json')
    assert res_bad.status_code == 401, f"Invalid password should return 401 Unauthorized, got {res_bad.status_code}"
    print("  [OK] Invalid admin password correctly rejected with 401 Unauthorized.")

    # 4. Test Customer Login API with Admin Credentials
    res_cust = client.post('/api/auth/login/', {'mobile_number': 'Rajaryan8299', 'password': '76829300'}, format='json')
    assert res_cust.status_code == 200, f"Customer endpoint login with admin username failed: {res_cust.data}"
    assert res_cust.data['user']['role'] == 'admin', "User role returned from customer login should be 'admin'"
    print("  [OK] General login endpoint identifies Admin role correctly.")

    # 5. Test Non-Staff Customer Account on Admin Login API
    cust_user, _ = User.objects.get_or_create(username='normal_cust_test', defaults={'is_staff': False})
    cust_user.set_password('custpass123')
    cust_user.is_staff = False
    cust_user.save()

    res_denied = client.post('/api/auth/admin/login/', {'username': 'normal_cust_test', 'password': 'custpass123'}, format='json')
    assert res_denied.status_code == 403, f"Normal customer on admin login API should return 403 Forbidden, got {res_denied.status_code}"
    print("  [OK] Non-staff customer attempting Admin Login correctly rejected with 403 Forbidden.")

    print("\n--- All Admin Login Authentication & Role Tests Passed 100%! ---")

if __name__ == '__main__':
    test_admin_login_redirect_flow()
