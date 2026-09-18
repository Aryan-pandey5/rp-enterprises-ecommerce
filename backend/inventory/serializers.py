from rest_framework import serializers
from .models import StockHistory


class StockHistorySerializer(serializers.ModelSerializer):
    """
    Serializes stock change history logs for admin audit tracking.
    """
    product_name = serializers.CharField(source='variant.product.name', read_only=True)
    variant_name = serializers.CharField(source='variant.variant_name', read_only=True)
    reason_display = serializers.CharField(source='get_reason_display', read_only=True)
    user_name = serializers.SerializerMethodField()

    class Meta:
        model = StockHistory
        fields = [
            'id', 'variant_id', 'product_name', 'variant_name', 
            'previous_stock', 'change_amount', 'new_stock', 
            'reason', 'reason_display', 'user_name', 'created_at'
        ]

    def get_user_name(self, obj):
        if obj.user:
            return obj.user.first_name or obj.user.username
        return 'System'
