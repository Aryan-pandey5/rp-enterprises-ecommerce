from decimal import Decimal
from rest_framework import serializers
from .models import Cart, CartItem, Order, OrderItem
from products.models import GlobalGSMPrice


class CartItemSerializer(serializers.ModelSerializer):
    product_id = serializers.IntegerField(source='product.id', read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_image = serializers.SerializerMethodField()
    size = serializers.CharField(source='product.size', read_only=True)
    weight = serializers.DecimalField(source='product.weight', max_digits=10, decimal_places=2, read_only=True, allow_null=True)
    weight_display = serializers.SerializerMethodField()
    category_name = serializers.CharField(source='product.category.name', read_only=True)
    category_type = serializers.CharField(source='product.category.category_type', read_only=True)
    variant_id = serializers.IntegerField(source='variant.id', read_only=True, allow_null=True)
    variant_name = serializers.CharField(source='variant.variant_name', read_only=True, allow_null=True)
    unit_packing = serializers.CharField(source='variant.unit_packing', read_only=True, allow_null=True)
    gsm_display = serializers.SerializerMethodField()
    unit_price = serializers.SerializerMethodField()
    item_total = serializers.SerializerMethodField()

    class Meta:
        model = CartItem
        fields = [
            'id', 'product_id', 'product_name', 'product_image', 'size', 'weight', 'weight_display',
            'category_name', 'category_type', 'variant_id', 'variant_name', 
            'unit_packing', 'gsm', 'gsm_display', 'unit_price', 'quantity', 'item_total', 'created_at'
        ]

    def get_product_image(self, obj):
        if obj.product and obj.product.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.product.image.url)
            return obj.product.image.url
        return None

    def get_weight_display(self, obj):
        if obj.product and obj.product.weight is not None:
            w_str = f"{obj.product.weight:g}" if hasattr(obj.product.weight, '__format__') else str(obj.product.weight)
            return f"{w_str} kg"
        return None

    def get_gsm_display(self, obj):
        gsm_val = obj.gsm or (obj.product.gsm if obj.product else None)
        if gsm_val:
            return f"{gsm_val} GSM"
        return None

    def get_unit_price(self, obj):
        if obj.product and obj.product.category and obj.product.category.category_type == 'RAW_MATERIAL':
            gsm_val = obj.gsm or obj.product.gsm
            weight_val = obj.product.weight
            if gsm_val and weight_val:
                global_obj = GlobalGSMPrice.objects.filter(gsm=gsm_val).first()
                if global_obj and global_obj.price > 0:
                    return float((global_obj.price * Decimal(str(weight_val))).quantize(Decimal('0.01')))
            return 0.0

        if obj.variant:
            return float(obj.variant.price)

        return float(obj.product.base_price if obj.product else 0.0)

    def get_item_total(self, obj):
        price = self.get_unit_price(obj)
        return round(price * obj.quantity, 2)


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total_items = serializers.SerializerMethodField()
    subtotal = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = ['id', 'items', 'total_items', 'subtotal', 'updated_at']

    def get_total_items(self, obj):
        return sum(item.quantity for item in obj.items.all())

    def get_subtotal(self, obj):
        total = Decimal('0.00')
        for item in obj.items.all():
            prod = item.product
            if prod and prod.category and prod.category.category_type == 'RAW_MATERIAL':
                gsm_val = item.gsm or prod.gsm
                weight_val = prod.weight
                if gsm_val and weight_val:
                    global_obj = GlobalGSMPrice.objects.filter(gsm=gsm_val).first()
                    if global_obj and global_obj.price > 0:
                        item_price = global_obj.price * Decimal(str(weight_val))
                    else:
                        item_price = Decimal('0.00')
                else:
                    item_price = Decimal('0.00')
            elif item.variant:
                item_price = item.variant.price
            else:
                item_price = prod.base_price if prod else Decimal('0.00')
            total += item_price * Decimal(str(item.quantity))
        return round(float(total), 2)


class OrderItemSerializer(serializers.ModelSerializer):
    """
    Serializes individual order item snapshots.
    Preserves exact historical product name, size, weight, GSM, price per kg, price, and item total at purchase time.
    """
    product_image = serializers.SerializerMethodField()
    weight_display = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = [
            'id', 'product_id', 'variant_id', 'gsm', 'product_name', 'product_image',
            'size', 'weight', 'weight_display', 'gsm_price_per_kg', 'variant_name',
            'unit_packing', 'price', 'quantity', 'item_total'
        ]

    def get_product_image(self, obj):
        if obj.product and obj.product.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.product.image.url)
            return obj.product.image.url
        return None

    def get_weight_display(self, obj):
        if obj.weight is not None:
            w_str = f"{obj.weight:g}" if hasattr(obj.weight, '__format__') else str(obj.weight)
            return f"{w_str} kg"
        return None


class OrderSerializer(serializers.ModelSerializer):
    """
    Serializes complete customer purchase orders.
    Includes nested order items, human-readable status, and snapshot delivery details.
    """
    items = OrderItemSerializer(many=True, read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    total_items = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'status', 'status_display', 'total_amount', 
            'total_items', 'customer_name', 'customer_mobile', 'customer_address', 
            'items', 'created_at', 'updated_at'
        ]

    def get_total_items(self, obj):
        return sum(item.quantity for item in obj.items.all())
