from django.urls import path
from . import views

urlpatterns = [
    path('products/', views.product_list_api, name='product-list'),
    path('products/bulk-delete/', views.admin_products_bulk_delete_api, name='admin-products-bulk-delete'),
    path('products/<int:pk>/', views.product_detail_api, name='product-detail'),
    path('products/<int:pk>/toggle-active/', views.product_toggle_active_api, name='product-toggle-active'),
    path('gsm-prices/', views.global_gsm_price_list_update_api, name='global-gsm-prices'),
]
