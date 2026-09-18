from django.urls import path
from . import views

urlpatterns = [
    # Customer Cart endpoints
    path('cart/', views.cart_detail_api, name='cart-detail'),
    path('cart/items/', views.cart_item_add_api, name='cart-item-add'),
    path('cart/items/<int:pk>/', views.cart_item_update_api, name='cart-item-update'),
    path('cart/items/<int:pk>/delete/', views.cart_item_delete_api, name='cart-item-delete'),
    path('cart/clear/', views.cart_clear_api, name='cart-clear'),

    # Customer Order endpoints
    path('orders/', views.order_list_create_api, name='order-list-create'),
    path('orders/<int:pk>/', views.order_detail_api, name='order-detail'),
    path('orders/<int:pk>/cancel/', views.order_cancel_api, name='order-cancel'),

    # Admin Orders & Dashboard endpoints
    path('admin/dashboard/', views.admin_dashboard_api, name='admin-dashboard'),
    path('admin/orders/', views.admin_orders_api, name='admin-orders'),
    path('admin/orders/bulk-remove/', views.admin_orders_bulk_remove_api, name='admin-orders-bulk-remove'),
    path('admin/orders/<int:pk>/', views.admin_order_delete_api, name='admin-order-delete-direct'),
    path('admin/orders/<int:pk>/delete/', views.admin_order_delete_api, name='admin-order-delete'),
    path('admin/orders/<int:pk>/status/', views.admin_order_status_api, name='admin-order-status'),
]
