from django.contrib import admin
from .models import Product, ProductVariant, GlobalGSMPrice, ProductGSM


class ProductVariantInline(admin.TabularInline):
    model = ProductVariant
    extra = 1


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'base_price', 'is_active', 'created_at')
    list_filter = ('category', 'is_active')
    search_fields = ('name', 'description')
    inlines = [ProductVariantInline]


@admin.register(GlobalGSMPrice)
class GlobalGSMPriceAdmin(admin.ModelAdmin):
    list_display = ('gsm', 'price', 'updated_at')
    ordering = ('gsm',)


@admin.register(ProductVariant)
class ProductVariantAdmin(admin.ModelAdmin):
    list_display = ('product', 'variant_name', 'price', 'stock', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('variant_name', 'product__name')
