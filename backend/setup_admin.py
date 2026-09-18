import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User

# ==========================================
# ADMIN SUPERUSER SETUP SCRIPT (STEP 11)
# ==========================================

def setup_admin_account():
    """
    Configures the administrator superuser account (Rajaryan8299) securely using Django ORM.
    Hashes the password securely via User.set_password().
    """
    admin_username = os.environ.get('ADMIN_USERNAME', 'Rajaryan8299').strip()
    admin_password = os.environ.get('ADMIN_PASSWORD', '76829300').strip()

    user, created = User.objects.get_or_create(username=admin_username)
    user.first_name = "Rajaryan (Admin)"
    user.is_staff = True
    user.is_superuser = True
    user.set_password(admin_password)
    user.save()

    action = "Created new" if created else "Updated existing"
    print(f"[SUCCESS] {action} administrator superuser account '{admin_username}' with staff & superuser privileges.")

if __name__ == '__main__':
    setup_admin_account()
