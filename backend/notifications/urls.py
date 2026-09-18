from django.urls import path
from . import views

urlpatterns = [
    # Notification System endpoints
    path('notifications/', views.notification_list_api, name='notification-list'),
    path('notifications/unread-count/', views.notification_unread_count_api, name='notification-unread-count'),
    path('notifications/<int:pk>/read/', views.notification_mark_read_api, name='notification-mark-read'),
    path('notifications/read-all/', views.notification_mark_all_read_api, name='notification-mark-all-read'),
    path('admin/test-whatsapp/', views.admin_whatsapp_test_api, name='admin-test-whatsapp'),
]
