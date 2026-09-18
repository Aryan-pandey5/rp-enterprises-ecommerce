from rest_framework import serializers
from .models import Category


class CategorySerializer(serializers.ModelSerializer):
    category_type_display = serializers.CharField(source='get_category_type_display', read_only=True)
    products_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ['id', 'name', 'category_type', 'category_type_display', 'description', 'is_active', 'products_count', 'created_at', 'updated_at']

    def get_products_count(self, obj):
        return obj.products.count()

    def validate_name(self, value):
        if not value.strip():
            raise serializers.ValidationError("Category name cannot be empty.")
        return value.strip()
