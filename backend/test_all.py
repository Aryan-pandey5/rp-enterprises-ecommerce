import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

import test_auth
import test_models
import test_products
import test_cart
import test_orders
import test_admin
import test_notifications
import test_step11_admin_login
import test_whatsapp
import test_admin_categories
import test_product_delete_and_availability
import test_raw_material_gsm
import test_admin_customer_management
import test_admin_stock_search
import test_admin_order_remove_and_received_status
import test_admin_dashboard_realtime_and_alerts
import test_admin_bulk_operations

def run_all_tests():
    print("==========================================================")
    print("  R.P. ENTERPRISES — COMPREHENSIVE MASTER TEST RUNNER   ")
    print("==========================================================\n")

    test_modules = [
        ("Step 3: Auth & User System", test_auth.test_authentication),
        ("Step 2: Database & Models", test_models.run_test),
        ("Step 4 & 5: Products & Categories", test_products.test_product_apis),
        ("Step 6: Cart System", test_cart.test_cart_system),
        ("Step 7: Checkout & Order System", test_orders.test_order_system),
        ("Step 8: Admin Dashboard & Management", test_admin.test_admin_system),
        ("Step 9: Notifications & WhatsApp Fail-safe", test_notifications.test_notification_system),
        ("Step 11: Admin Login & Permission Enforcement", test_step11_admin_login.test_step11_admin_login),
        ("WhatsApp Business Cloud API Integration", test_whatsapp.test_whatsapp_integration),
        ("Admin Category Edit & Delete", test_admin_categories.test_admin_category_edit_and_delete),
        ("Product Availability & Permanent Delete", test_product_delete_and_availability.test_product_delete_and_availability),
        ("Raw Material GSM Based Pricing", test_raw_material_gsm.test_raw_material_gsm_pricing),
        ("Admin Customer Management & Sorting", test_admin_customer_management.test_admin_customer_management),
        ("Admin Stock & Inventory Search", test_admin_stock_search.test_admin_stock_search),
        ("Admin Order Remove & Automatic Received Status", test_admin_order_remove_and_received_status.test_admin_order_remove_and_received_status),
        ("Admin Dashboard Real-Time Counts & Unread Alerts", test_admin_dashboard_realtime_and_alerts.test_admin_dashboard_realtime_and_alerts),
        ("Admin Bulk Select & Bulk Delete Operations", test_admin_bulk_operations.test_admin_bulk_operations),
    ]

    passed_count = 0
    total_count = len(test_modules)

    for name, test_func in test_modules:
        print(f"\n>>> Running Test Suite: {name}")
        try:
            test_func()
            passed_count += 1
            print(f"[SUCCESS] PASSED: {name}")
        except Exception as err:
            print(f"[FAILED]: {name} - Error: {str(err)}")
            sys.exit(1)

    print("\n==========================================================")
    print(f" ALL {passed_count}/{total_count} TEST SUITES PASSED 100% PERFECTLY!")
    print("==========================================================")

if __name__ == '__main__':
    run_all_tests()
