import re
from rest_framework import serializers
from django.contrib.auth.models import User
from .models import CustomerProfile
from orders.models import Order


class RegisterSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=150, required=True)
    mobile_number = serializers.CharField(max_length=15, required=True)
    address = serializers.CharField(max_length=500, required=True)
    password = serializers.CharField(write_only=True, required=True, min_length=6)
    confirm_password = serializers.CharField(write_only=True, required=True)

    def validate_name(self, value):
        if not value.strip():
            raise serializers.ValidationError("Name cannot be empty.")
        return value.strip()

    def validate_mobile_number(self, value):
        cleaned_mobile = re.sub(r'[\s\-]', '', value.strip())
        if not re.match(r'^\+?[0-9]{10,15}$', cleaned_mobile):
            raise serializers.ValidationError("Enter a valid mobile number (10 to 15 digits).")
        
        if User.objects.filter(username=cleaned_mobile).exists() or CustomerProfile.objects.filter(mobile_number=cleaned_mobile).exists():
            raise serializers.ValidationError("This mobile number is already registered. Please login instead.")
        
        return cleaned_mobile

    def validate_address(self, value):
        if not value.strip():
            raise serializers.ValidationError("Address cannot be empty.")
        return value.strip()

    def validate(self, data):
        if data.get('password') != data.get('confirm_password'):
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        return data

    def create(self, validated_data):
        name = validated_data['name']
        mobile_number = validated_data['mobile_number']
        address = validated_data['address']
        password = validated_data['password']

        user = User.objects.create_user(
            username=mobile_number,
            first_name=name,
            password=password
        )

        profile = CustomerProfile.objects.create(
            user=user,
            mobile_number=mobile_number,
            address=address
        )

        return user


class CustomerProfileSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='user.first_name', required=True)
    username = serializers.CharField(source='user.username', read_only=True)
    is_staff = serializers.BooleanField(source='user.is_staff', read_only=True)

    class Meta:
        model = CustomerProfile
        fields = ['id', 'username', 'name', 'mobile_number', 'address', 'is_staff', 'created_at', 'updated_at']

    def validate_mobile_number(self, value):
        cleaned = re.sub(r'\D', '', value)
        if len(cleaned) < 10 or len(cleaned) > 15:
            raise serializers.ValidationError("Mobile number must contain between 10 and 15 digits.")
        return cleaned

    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', {})
        if 'first_name' in user_data:
            instance.user.first_name = user_data['first_name'].strip()
            instance.user.save()

        if 'mobile_number' in validated_data:
            new_mobile = re.sub(r'[\s\-]', '', validated_data['mobile_number'].strip())
            if new_mobile != instance.mobile_number:
                if CustomerProfile.objects.filter(mobile_number=new_mobile).exclude(id=instance.id).exists():
                    raise serializers.ValidationError({"mobile_number": "This mobile number is already taken."})
                instance.mobile_number = new_mobile
                instance.user.username = new_mobile
                instance.user.save()

        if 'address' in validated_data:
            instance.address = validated_data['address'].strip()

        instance.save()
        return instance


class AdminCustomerSerializer(serializers.ModelSerializer):
    """
    Serializes customer profile data for the Admin Directory.
    Excludes sensitive authentication hashes while including total purchase & order count.
    Supports ORM annotated fields (annotated_orders & annotated_purchase) to avoid N+1 queries.
    """
    name = serializers.CharField(source='first_name')
    mobile_number = serializers.SerializerMethodField()
    address = serializers.SerializerMethodField()
    date_joined = serializers.DateTimeField(format="%Y-%m-%d")
    total_orders = serializers.SerializerMethodField()
    total_spent = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'name', 'mobile_number', 'address', 'date_joined', 'total_orders', 'total_spent']

    def get_mobile_number(self, obj):
        try:
            return obj.profile.mobile_number or obj.username
        except CustomerProfile.DoesNotExist:
            return obj.username

    def get_address(self, obj):
        try:
            return obj.profile.address or ""
        except CustomerProfile.DoesNotExist:
            return ""

    def get_total_orders(self, obj):
        if hasattr(obj, 'annotated_orders'):
            return obj.annotated_orders
        return obj.orders.exclude(status=Order.STATUS_CANCELLED).count()

    def get_total_spent(self, obj):
        if hasattr(obj, 'annotated_purchase'):
            return round(float(obj.annotated_purchase or 0.0), 2)
        valid_orders = obj.orders.exclude(status=Order.STATUS_CANCELLED)
        total = sum(float(order.total_amount) for order in valid_orders)
        return round(total, 2)


class AdminCreateCustomerSerializer(serializers.Serializer):
    """
    Validates admin manual customer creation payloads.
    Ensures customer name, mobile number, address, and password meet security standards.
    """
    name = serializers.CharField(max_length=150, required=True)
    mobile_number = serializers.CharField(max_length=20, required=True)
    address = serializers.CharField(max_length=500, required=True)
    password = serializers.CharField(write_only=True, min_length=6, required=True)

    def validate_name(self, value):
        if not value.strip():
            raise serializers.ValidationError("Customer name cannot be empty.")
        return value.strip()

    def validate_mobile_number(self, value):
        cleaned = re.sub(r'\D', '', value)
        if len(cleaned) < 10 or len(cleaned) > 15:
            raise serializers.ValidationError("Mobile number must contain between 10 and 15 digits.")
        return cleaned

    def validate_password(self, value):
        if len(value) < 6:
            raise serializers.ValidationError("Password must be at least 6 characters long.")
        return value


class AdminLoginSerializer(serializers.Serializer):
    """
    Validates administrator login credentials (username and password).
    """
    username = serializers.CharField(required=True, trim_whitespace=True)
    password = serializers.CharField(required=True, write_only=True)
