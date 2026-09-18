from django.db import models
from django.contrib.auth.models import User
from orders.models import Order


class Notification(models.Model):
    """
    Stores system notifications for customers and factory admins.
    Tracks order status updates, new order alerts, and low stock warnings.
    """
    TYPE_ORDER_STATUS = 'ORDER_STATUS'
    TYPE_NEW_ORDER = 'NEW_ORDER'
    TYPE_LOW_STOCK = 'LOW_STOCK'
    TYPE_OUT_OF_STOCK = 'OUT_OF_STOCK'
    TYPE_SYSTEM = 'SYSTEM'

    TYPE_CHOICES = [
        (TYPE_ORDER_STATUS, 'Order Status Change'),
        (TYPE_NEW_ORDER, 'New Order Received'),
        (TYPE_LOW_STOCK, 'Low Stock Warning'),
        (TYPE_OUT_OF_STOCK, 'Out of Stock Alert'),
        (TYPE_SYSTEM, 'System Notification'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications', null=True, blank=True)
    is_admin_notification = models.BooleanField(default=False, help_text="True if notification is intended for admin dashboard")
    notification_type = models.CharField(max_length=30, choices=TYPE_CHOICES, default=TYPE_SYSTEM)
    title = models.CharField(max_length=200)
    message = models.TextField()
    order = models.ForeignKey(Order, on_delete=models.CASCADE, null=True, blank=True, related_name='notifications')
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'store_notification'
        ordering = ['-created_at']

    def __str__(self):
        target = "Admin" if self.is_admin_notification else (self.user.username if self.user else "Global")
        return f"[{self.get_notification_type_display()}] for {target}: {self.title}"
