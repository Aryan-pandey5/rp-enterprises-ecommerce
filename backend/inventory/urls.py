from django.urls import path
from . import views

urlpatterns = [
    path('admin/stock/', views.admin_stock_api, name='admin-stock'),
    path('admin/stock/bulk-delete/', views.admin_stock_bulk_delete_api, name='admin-stock-bulk-delete'),
    path('admin/stock/update/', views.admin_stock_update_api, name='admin-stock-update'),
]
