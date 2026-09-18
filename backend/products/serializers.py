import json
from decimal import Decimal
from rest_framework import serializers
from .models import Product, ProductVariant, GlobalGSMPrice, ProductGSM, GSM_CHOICES
from categories.models import Category


class ProductVariantSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductVariant
        fields = ['id', 'variant_name', 'unit_packing', 'price', 'stock', 'is_active']

    def validate_variant_name(self, value):
        if not value.strip():
            raise serializers.ValidationError("Variant name cannot be empty.")
        return value.strip()

    def validate_price(self, value):
        if value < 0:
            raise serializers.ValidationError("Variant price cannot be negative.")
        return value

    def validate_stock(self, value):
        if value < 0:
            raise serializers.ValidationError("Variant stock cannot be negative.")
        return value


class GlobalGSMPriceSerializer(serializers.ModelSerializer):
    """
    Serializes central global GSM prices.
    Supported choices: 80 GSM, 90 GSM, 100 GSM, 120 GSM, 140 GSM.
    """
    gsm_display = serializers.CharField(source='get_gsm_display', read_only=True)

    class Meta:
        model = GlobalGSMPrice
        fields = ['id', 'gsm', 'gsm_display', 'price', 'updated_at']

    def validate_price(self, value):
        if value < 0:
            raise serializers.ValidationError("GSM global price cannot be negative.")
        return value


class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_type = serializers.CharField(source='category.category_type', read_only=True)
    category_type_display = serializers.CharField(source='category.get_category_type_display', read_only=True)
    weight = serializers.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        required=False, 
        allow_null=True,
        error_messages={
            'min_value': 'Weight must be greater than 0 kg.',
            'invalid': 'Weight must be greater than 0 kg.'
        }
    )
    variants = ProductVariantSerializer(many=True, required=False)
    image_url = serializers.SerializerMethodField()

    # Raw Material specific calculated fields
    gsm_display = serializers.SerializerMethodField()
    weight_display = serializers.SerializerMethodField()
    gsm_price_per_kg = serializers.SerializerMethodField()
    calculated_price = serializers.SerializerMethodField()
    price = serializers.SerializerMethodField()
    price_available = serializers.SerializerMethodField()
    gsms = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'category', 'category_name', 'category_type', 'category_type_display',
            'name', 'description', 'size', 'weight', 'weight_display', 'gsm', 'gsm_display',
            'gsm_price_per_kg', 'calculated_price', 'price', 'price_available',
            'image', 'image_url', 'base_price', 'is_active', 'variants', 'gsms',
            'created_at', 'updated_at'
        ]

    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None

    def get_gsm_display(self, obj):
        if obj.gsm:
            return f"{obj.gsm} GSM"
        return None

    def get_weight_display(self, obj):
        if obj.weight is not None:
            w_str = f"{obj.weight:g}" if hasattr(obj.weight, '__format__') else str(obj.weight)
            return f"{w_str} kg"
        return None

    def get_gsm_price_per_kg(self, obj):
        if obj.category and obj.category.category_type == 'RAW_MATERIAL' and obj.gsm:
            global_obj = GlobalGSMPrice.objects.filter(gsm=obj.gsm).first()
            if global_obj:
                return str(global_obj.price)
        return None

    def get_calculated_price(self, obj):
        calc = obj.calculated_price
        if calc is not None:
            return str(calc)
        return None

    def get_price_available(self, obj):
        if obj.category and obj.category.category_type == 'RAW_MATERIAL':
            return obj.calculated_price is not None
        return True

    def get_price(self, obj):
        if obj.category and obj.category.category_type == 'RAW_MATERIAL':
            calc = obj.calculated_price
            return str(calc) if calc is not None else None
        return str(obj.base_price)

    def get_gsms(self, obj):
        if not obj.category or obj.category.category_type != 'RAW_MATERIAL' or not obj.gsm:
            return []

        global_obj = GlobalGSMPrice.objects.filter(gsm=obj.gsm).first()
        price_str = str(global_obj.price) if global_obj else '0.00'
        return [{
            'gsm': obj.gsm,
            'gsm_display': f"{obj.gsm} GSM",
            'price': price_str
        }]

    def validate_name(self, value):
        if not value.strip():
            raise serializers.ValidationError("Product name cannot be empty.")
        return value.strip()

    def validate_base_price(self, value):
        if value < 0:
            raise serializers.ValidationError("Product price cannot be negative.")
        return value

    def validate_weight(self, value):
        if value is not None and value <= Decimal('0'):
            raise serializers.ValidationError("Weight must be greater than 0 kg.")
        return value

    def validate(self, data):
        category = data.get('category') or getattr(self.instance, 'category', None)
        if category and category.category_type == 'RAW_MATERIAL':
            weight_val = data.get('weight') if 'weight' in data else getattr(self.instance, 'weight', None)
            if weight_val is None:
                raise serializers.ValidationError({"weight": "Weight must be greater than 0 kg."})
            try:
                dec_w = Decimal(str(weight_val))
                if dec_w <= Decimal('0'):
                    raise serializers.ValidationError({"weight": "Weight must be greater than 0 kg."})
            except Exception:
                raise serializers.ValidationError({"weight": "Weight must be greater than 0 kg."})

            gsm_val = data.get('gsm') if 'gsm' in data else getattr(self.instance, 'gsm', None)
            if not gsm_val:
                raise serializers.ValidationError({"gsm": "Please select a GSM option for this raw material product."})
        return data

    def create(self, validated_data):
        variants_data = validated_data.pop('variants', [])
        validated_data.pop('gsms', [])

        request = self.context.get('request')
        if request:
            if 'variants_json' in request.data:
                try:
                    parsed_variants = json.loads(request.data['variants_json'])
                    if isinstance(parsed_variants, list):
                        variants_data = parsed_variants
                except Exception:
                    pass

        product = Product.objects.create(**validated_data)

        for var_data in variants_data:
            ProductVariant.objects.create(product=product, **var_data)

        if product.gsm:
            ProductGSM.objects.get_or_create(product=product, gsm=product.gsm)

        return product

    def update(self, instance, validated_data):
        variants_data = validated_data.pop('variants', None)
        validated_data.pop('gsms', None)

        request = self.context.get('request')
        if request:
            if 'variants_json' in request.data:
                try:
                    parsed_variants = json.loads(request.data['variants_json'])
                    if isinstance(parsed_variants, list):
                        variants_data = parsed_variants
                except Exception:
                    pass

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if variants_data is not None:
            instance.variants.all().delete()
            for var_data in variants_data:
                var_data.pop('id', None)
                ProductVariant.objects.create(product=instance, **var_data)

        if instance.gsm:
            instance.product_gsms.all().delete()
            ProductGSM.objects.get_or_create(product=instance, gsm=instance.gsm)

        return instance
