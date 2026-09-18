from django.contrib import admin
from .models import Category


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'category_type', 'is_active', 'created_at')
    list_filter = ('category_type', 'is_active')
    search_fields = ('name', 'description')
