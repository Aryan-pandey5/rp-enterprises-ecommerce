from django.contrib import admin
from .models import Cart, CartItem, Order, OrderItem


class CartItemInline(admin.TabularInline):
    model = CartItem
    extra = 0


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ('user', 'updated_at')
    inlines = [CartItemInline]


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = (
        'product', 'variant', 'gsm', 'product_name', 'size', 'weight',
        'gsm_price_per_kg', 'variant_name', 'unit_packing', 'price',
        'quantity', 'item_total'
    )


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = (
        'order_number', 'customer_name', 'customer_mobile',
        'status', 'total_amount', 'is_removed_by_admin', 'created_at'
    )
    list_filter = ('status', 'is_removed_by_admin')
    search_fields = ('order_number', 'customer_name', 'customer_mobile')
    inlines = [OrderItemInline]
