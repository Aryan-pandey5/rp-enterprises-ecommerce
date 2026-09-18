import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from rest_framework.test import APIClient
from django.contrib.auth.models import User
from categories.models import Category
from products.models import Product, ProductVariant
from inventory.models import StockHistory

def test_admin_stock_search():
    print("--- TESTING ADMIN STOCK & INVENTORY SEARCH APIs ---")

    client = APIClient()

    # Cleanup test users and test products
    User.objects.filter(username__in=["stock_search_admin", "stock_search_cust"]).delete()
    Category.objects.filter(name__in=["Paper Dona SearchTest", "Paper Reels SearchTest"]).delete()

    admin_user = User.objects.create_user(username="stock_search_admin", password="Password123!", is_staff=True, is_superuser=True)
    cust_user = User.objects.create_user(username="stock_search_cust", password="Password123!", is_staff=False)

    # 1. Setup Test Categories & Products with Variants
    cat_dispo = Category.objects.create(name="Paper Dona SearchTest", category_type="DISPOSABLE")
    cat_raw = Category.objects.create(name="Paper Reels SearchTest", category_type="RAW_MATERIAL")

    prod1 = Product.objects.create(name="Dona 8 Inch SearchTest", category=cat_dispo, size="8 inch", base_price=300.00)
    var1_1 = ProductVariant.objects.create(product=prod1, variant_name="Silver Standard 100 Pcs", unit_packing="100 pcs/bori", price=450.00, stock=5) # Low Stock

    prod2 = Product.objects.create(name="PE Coated Kraft Paper Reel SearchTest", category=cat_raw, size="50kg Roll", base_price=3000.00)
    var2_1 = ProductVariant.objects.create(product=prod2, variant_name="120 GSM Roll", unit_packing="50 kg reel", price=3500.00, stock=25) # In Stock

    prod3 = Product.objects.create(name="Paper Bowl 400ml SearchTest", category=cat_dispo, size="400ml", base_price=200.00)
    var3_1 = ProductVariant.objects.create(product=prod3, variant_name="White Premium 500 Pcs", unit_packing="500 pcs/bori", price=600.00, stock=0) # Out of Stock

    # 2. Security Test: Customer access rejected -> 403 Forbidden
    client.force_authenticate(user=cust_user)
    res_unauth = client.get('/api/admin/stock/?search=SearchTest')
    assert res_unauth.status_code == 403, f"Expected 403 Forbidden for customer stock access, got {res_unauth.status_code}"
    print("[OK] Admin Stock Search API properly protected with 403 Forbidden for non-staff users.")

    # 3. Test Admin Search by Product Name (Case-insensitive: 'dona', 'Dona', 'DONA')
    client.force_authenticate(user=admin_user)
    res_search1 = client.get('/api/admin/stock/?search=dona')
    assert res_search1.status_code == 200, f"Stock search failed: {res_search1.data}"
    variants1 = res_search1.data['variants']
    search1_names = [v['product_name'] for v in variants1]
    assert "Dona 8 Inch SearchTest" in search1_names
    assert "PE Coated Kraft Paper Reel SearchTest" not in search1_names
    print("[OK] Case-insensitive search by product name ('dona') verified.")

    res_search_upper = client.get('/api/admin/stock/?search=DONA')
    assert res_search_upper.status_code == 200
    assert len(res_search_upper.data['variants']) == len(variants1)
    print("[OK] Uppercase search ('DONA') returned matching results.")

    # 4. Test Search by GSM / Raw Material specification ('120 GSM')
    res_gsm_search = client.get('/api/admin/stock/?search=120+GSM')
    assert res_gsm_search.status_code == 200
    gsm_names = [v['product_name'] for v in res_gsm_search.data['variants']]
    assert "PE Coated Kraft Paper Reel SearchTest" in gsm_names
    print("[OK] Search by GSM specification ('120 GSM') verified.")

    # 5. Test Section / Product Type Filter (?section=RAW_MATERIAL)
    res_raw_section = client.get('/api/admin/stock/?search=SearchTest&section=RAW_MATERIAL')
    assert res_raw_section.status_code == 200
    raw_variants = res_raw_section.data['variants']
    assert len(raw_variants) == 1 and raw_variants[0]['id'] == var2_1.id
    print("[OK] Section filter (?section=RAW_MATERIAL) verified.")

    # 6. Test Stock Status Filter (?status=LOW_STOCK)
    res_low_stock = client.get('/api/admin/stock/?search=SearchTest&status=LOW_STOCK')
    assert res_low_stock.status_code == 200
    low_variants = res_low_stock.data['variants']
    assert len(low_variants) == 1 and low_variants[0]['id'] == var1_1.id
    print("[OK] Stock status filter (?status=LOW_STOCK) verified.")

    # 7. Test Combined Search + Status Filter (?search=Dona&status=LOW_STOCK)
    res_combined = client.get('/api/admin/stock/?search=Dona+SearchTest&status=LOW_STOCK')
    assert res_combined.status_code == 200
    comb_variants = res_combined.data['variants']
    assert len(comb_variants) == 1 and comb_variants[0]['id'] == var1_1.id
    print("[OK] Combined Search + Stock Status filter verified.")

    # 8. Test No Results Empty State (?search=xyz123)
    res_no_results = client.get('/api/admin/stock/?search=xyz123')
    assert res_no_results.status_code == 200
    assert len(res_no_results.data['variants']) == 0
    print("[OK] No results query returned empty list (total_count = 0).")

    # 9. Test Stock Update Compatibility from search results
    update_payload = {
        "variant_id": var1_1.id,
        "new_stock": 50,
        "reason": StockHistory.REASON_NEW_STOCK
    }
    res_update = client.post('/api/admin/stock/update/', update_payload, format='json')
    assert res_update.status_code == 200, f"Stock update failed: {res_update.data}"
    var1_1.refresh_from_db()
    assert var1_1.stock == 50, f"Expected stock 50, got {var1_1.stock}"
    print("[OK] Stock update functionality remains 100% operational from search results.")

    print("\n=== ALL ADMIN STOCK & INVENTORY SEARCH TESTS PASSED PERFECTLY ===")

if __name__ == '__main__':
    test_admin_stock_search()
