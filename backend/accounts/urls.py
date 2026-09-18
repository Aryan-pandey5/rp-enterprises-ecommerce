from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    # Auth endpoints
    path('auth/register/', views.register_api, name='auth-register'),
    path('auth/login/', views.login_api, name='auth-login'),
    path('auth/admin/login/', views.admin_login_api, name='auth-admin-login'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('auth/profile/', views.profile_api, name='auth-profile'),
    path('auth/me/', views.me_api, name='auth-me'),

    # Admin customer management endpoints
    path('admin/customers/', views.admin_customers_api, name='admin-customers'),
    path('admin/customers/bulk-delete/', views.admin_customers_bulk_delete_api, name='admin-customers-bulk-delete'),
    path('admin/customers/<int:pk>/', views.admin_customer_detail_api, name='admin-customer-detail'),
    path('admin/customers/<int:pk>/delete/', views.admin_customer_delete_api, name='admin-customer-delete'),
]
