from django.contrib import admin
from .models import StockHistory


@admin.register(StockHistory)
class StockHistoryAdmin(admin.ModelAdmin):
    list_display = (
        'variant', 'previous_stock', 'change_amount',
        'new_stock', 'reason', 'user', 'created_at'
    )
    list_filter = ('reason',)
    search_fields = ('variant__variant_name', 'variant__product__name')
