from django.db import models
from django.contrib.auth.models import User
from products.models import ProductVariant


class StockHistory(models.Model):
    """
    Audit log tracking all stock changes for product variants.
    Records manual inventory additions, adjustments, order deductions, and cancellation restorations.
    """
    REASON_MANUAL = 'MANUAL_ADJUSTMENT'
    REASON_NEW_STOCK = 'NEW_STOCK'
    REASON_ORDER = 'ORDER_DEDUCTION'
    REASON_RESTORE = 'ORDER_CANCELLATION'

    REASON_CHOICES = [
        (REASON_MANUAL, 'Manual Adjustment'),
        (REASON_NEW_STOCK, 'New Factory Stock Added'),
        (REASON_ORDER, 'Order Deduction'),
        (REASON_RESTORE, 'Order Cancellation Restoration'),
    ]

    variant = models.ForeignKey(ProductVariant, on_delete=models.CASCADE, related_name='stock_history')
    previous_stock = models.IntegerField(default=0)
    change_amount = models.IntegerField(help_text="Stock quantity added (+) or subtracted (-)")
    new_stock = models.IntegerField(default=0)
    reason = models.CharField(max_length=30, choices=REASON_CHOICES, default=REASON_MANUAL)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, help_text="User executing stock update")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'store_stockhistory'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.variant.variant_name}: {self.previous_stock} -> {self.new_stock} ({self.get_reason_display()})"
