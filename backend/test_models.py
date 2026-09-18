import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from categories.models import Category
from products.models import Product, ProductVariant
from accounts.models import CustomerProfile

def run_test():
    print("--- TESTING STEP 2 DATABASE MODELS ---")

    # 1. Create Test Categories
    cat_disposable = Category.objects.filter(name="Disposable Dona & Plates").first()
    if not cat_disposable:
        cat_disposable = Category.objects.create(
            name="Disposable Dona & Plates",
            category_type="DISPOSABLE",
            description="Test Category for finished disposable dona and plates"
        )
    print(f"[OK] Category Created/Retrieved: {cat_disposable.name} ({cat_disposable.get_category_type_display()})")

    cat_raw = Category.objects.filter(name="Paper Rolls & Reels").first()
    if not cat_raw:
        cat_raw = Category.objects.create(
            name="Paper Rolls & Reels",
            category_type="RAW_MATERIAL",
            description="Test Category for raw paper material used in manufacturing"
        )
    print(f"[OK] Category Created/Retrieved: {cat_raw.name} ({cat_raw.get_category_type_display()})")

    # 2. Create Test Finished Product & Variants
    product_dona, created = Product.objects.get_or_create(
        name="Paper Dona 8 Inch",
        category=cat_disposable,
        defaults={
            "description": "High quality silver leaf printed paper dona for events and catering",
            "size": "8 inch",
            "base_price": 400.00
        }
    )
    print(f"[OK] Product Created/Retrieved: {product_dona.name} [{product_dona.category.name}]")

    var1, created = ProductVariant.objects.get_or_create(
        product=product_dona,
        variant_name="Silver Standard - 100 Pcs/Bori",
        defaults={
            "unit_packing": "100 pcs/bori",
            "price": 450.00,
            "stock": 50
        }
    )
    print(f"[OK] Product Variant 1 Created/Retrieved: {var1.variant_name} - Rs.{var1.price}")

    var2, created = ProductVariant.objects.get_or_create(
        product=product_dona,
        variant_name="Silver Heavy Premium - 200 Pcs/Bori",
        defaults={
            "unit_packing": "200 pcs/bori",
            "price": 850.00,
            "stock": 30
        }
    )
    print(f"[OK] Product Variant 2 Created/Retrieved: {var2.variant_name} - Rs.{var2.price}")

    # 3. Create Test Raw Material Product & Variant
    product_reel, created = Product.objects.get_or_create(
        name="PE Coated Paper Reel",
        category=cat_raw,
        defaults={
            "description": "Food-grade PE coated paper reel for dona making machines",
            "size": "100mm width",
            "base_price": 3000.00
        }
    )
    print(f"[OK] Raw Material Product Created/Retrieved: {product_reel.name} [{product_reel.category.name}]")

    var_raw, created = ProductVariant.objects.get_or_create(
        product=product_reel,
        variant_name="50 kg Roll - 120 GSM",
        defaults={
            "unit_packing": "50 kg reel",
            "price": 3200.00,
            "stock": 15
        }
    )
    print(f"[OK] Raw Material Variant Created/Retrieved: {var_raw.variant_name} - Rs.{var_raw.price}")

    # 4. Create Test User & Customer Profile
    test_user, user_created = User.objects.get_or_create(
        username="test_customer",
        defaults={
            "first_name": "Ramesh",
            "last_name": "Patel",
            "email": "test@rpenterprises.com"
        }
    )
    if user_created:
        test_user.set_password("SecureTestPass123!")
        test_user.save()

    profile, profile_created = CustomerProfile.objects.get_or_create(
        user=test_user,
        defaults={
            "mobile_number": "+91 9876543210",
            "address": "123 Industrial Area, Block B, City"
        }
    )
    print(f"[OK] Customer Profile Created/Retrieved for user: {test_user.username}")

    print("--- ALL MODEL VERIFICATION CHECKS PASSED ---")

if __name__ == '__main__':
    run_test()
