from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    """
    Serializes in-app system notifications for customers and factory admins.
    Includes type display, formatted creation timestamp, and optional order reference number.
    """
    type_display = serializers.CharField(source='get_notification_type_display', read_only=True)
    order_number = serializers.CharField(source='order.order_number', read_only=True, default=None)

    class Meta:
        model = Notification
        fields = [
            'id', 'is_admin_notification', 'notification_type', 'type_display', 
            'title', 'message', 'order', 'order_number', 'is_read', 'created_at'
        ]
