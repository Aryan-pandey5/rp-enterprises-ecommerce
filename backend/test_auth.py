import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from rest_framework.test import APIClient
from django.contrib.auth.models import User
from accounts.models import CustomerProfile

def test_authentication():
    print("--- TESTING STEP 3 AUTHENTICATION APIs ---")
    client = APIClient()

    # Clean up test accounts
    User.objects.filter(username="9876543210").delete()
    User.objects.filter(username="9999999999").delete()

    # 1. Test Customer Signup (POST /api/auth/register/)
    signup_payload = {
        "name": "Rajesh Kumar",
        "mobile_number": "9876543210",
        "address": "45 Factory Road, Industrial Area, Sector 5",
        "password": "SecurePassword123",
        "confirm_password": "SecurePassword123"
    }
    res_signup = client.post('/api/auth/register/', signup_payload, format='json')
    assert res_signup.status_code == 201, f"Signup failed: {res_signup.data}"
    print("[OK] Signup successful! Returned user & JWT tokens.")
    access_token = res_signup.data['tokens']['access']

    # 2. Test Duplicate Mobile Signup Error
    res_dup = client.post('/api/auth/register/', signup_payload, format='json')
    assert res_dup.status_code == 400, f"Expected 400 for duplicate mobile, got {res_dup.status_code}"
    print("[OK] Duplicate mobile number validation working.")

    # 3. Test Password Mismatch Error
    mismatch_payload = signup_payload.copy()
    mismatch_payload['mobile_number'] = "9999999999"
    mismatch_payload['confirm_password'] = "DifferentPassword"
    res_mismatch = client.post('/api/auth/register/', mismatch_payload, format='json')
    assert res_mismatch.status_code == 400, f"Expected 400 for password mismatch, got {res_mismatch.status_code}"
    print("[OK] Password mismatch validation working.")

    # 4. Test Customer Login (POST /api/auth/login/)
    login_payload = {
        "mobile_number": "9876543210",
        "password": "SecurePassword123"
    }
    res_login = client.post('/api/auth/login/', login_payload, format='json')
    assert res_login.status_code == 200, f"Login failed: {res_login.data}"
    assert 'tokens' in res_login.data and 'access' in res_login.data['tokens'], "Tokens missing in login response"
    print("[OK] Customer login successful! JWT tokens returned.")

    # 5. Test Invalid Password Login Error
    bad_login_payload = {
        "mobile_number": "9876543210",
        "password": "WrongPassword123"
    }
    res_bad_login = client.post('/api/auth/login/', bad_login_payload, format='json')
    assert res_bad_login.status_code == 401, f"Expected 401 for wrong password, got {res_bad_login.status_code}"
    print("[OK] Invalid credentials validation working.")

    # 6. Test Unauthenticated Access to Protected API (GET /api/auth/me/) -> Expect 401
    client_unauth = APIClient()
    res_unauth = client_unauth.get('/api/auth/me/')
    assert res_unauth.status_code == 401, f"Expected 401 Unauthorized, got {res_unauth.status_code}"
    print("[OK] Unauthenticated access to /api/auth/me/ returned 401 Unauthorized as required.")

    # 7. Test Authenticated Access to Protected API (GET /api/auth/me/) with Bearer Token
    client_auth = APIClient()
    client_auth.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
    res_me = client_auth.get('/api/auth/me/')
    assert res_me.status_code == 200, f"Protected endpoint /api/auth/me/ failed: {res_me.data}"
    assert res_me.data['user']['mobile_number'] == "9876543210", "Profile mobile number mismatch"
    print("[OK] Authenticated request to /api/auth/me/ returned user details.")

    # 8. Test Customer Profile View & Update (GET & PUT /api/auth/profile/)
    res_prof = client_auth.get('/api/auth/profile/')
    assert res_prof.status_code == 200, f"Profile fetch failed: {res_prof.data}"
    print(f"[OK] Profile API fetch: Name='{res_prof.data['name']}', Mobile='{res_prof.data['mobile_number']}'")

    update_payload = {
        "name": "Rajesh Kumar (Updated)",
        "address": "Updated Address: 99 Logistics Park"
    }
    res_update = client_auth.put('/api/auth/profile/', update_payload, format='json')
    assert res_update.status_code == 200, f"Profile update failed: {res_update.data}"
    print("[OK] Profile updated successfully.")

    print("\n=== ALL STEP 3 AUTHENTICATION TESTS PASSED PERFECTLY ===")

if __name__ == '__main__':
    test_authentication()
