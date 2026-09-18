from django.urls import path
from . import views

urlpatterns = [
    path('categories/', views.category_list_api, name='category-list'),
    path('categories/bulk-delete/', views.admin_categories_bulk_delete_api, name='admin-categories-bulk-delete'),
    path('categories/<int:pk>/', views.category_detail_api, name='category-detail'),
]
