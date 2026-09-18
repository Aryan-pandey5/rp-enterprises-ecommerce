from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator
from products.models import Product, ProductVariant, GSM_CHOICES


class Cart(models.Model):
    """
    Shopping cart belonging strictly to an authenticated customer.
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='cart')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'store_cart'

    def __str__(self):
        return f"Cart for {self.user.username}"


class CartItem(models.Model):
    """
    Items added to a customer's cart.
    Links product, quality variant, or raw material GSM selection with quantity.
    """
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    variant = models.ForeignKey(ProductVariant, on_delete=models.SET_NULL, null=True, blank=True)
    gsm = models.IntegerField(choices=GSM_CHOICES, null=True, blank=True, help_text="Selected GSM for Raw Material products")
    quantity = models.IntegerField(default=1, validators=[MinValueValidator(1)])
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'store_cartitem'
        ordering = ['-created_at']

    def __str__(self):
        var_text = f" ({self.variant.variant_name})" if self.variant else (f" ({self.gsm} GSM)" if self.gsm else "")
        return f"{self.product.name}{var_text} x {self.quantity}"


class Order(models.Model):
    """
    Represents a customer purchase order.
    Stores customer snapshot data (name, mobile, address) to preserve historical order information
    even if customer profile or product details are modified later.
    """
    STATUS_PENDING = 'PENDING'
    STATUS_CONFIRMED = 'CONFIRMED'
    STATUS_PROCESSING = 'PROCESSING'
    STATUS_SHIPPED = 'SHIPPED'
    STATUS_DELIVERED = 'RECEIVED'
    STATUS_RECEIVED = 'RECEIVED'
    STATUS_CANCELLED = 'CANCELLED'

    STATUS_CHOICES = [
        (STATUS_PENDING, 'Pending'),
        (STATUS_CONFIRMED, 'Confirmed'),
        (STATUS_PROCESSING, 'Processing'),
        (STATUS_SHIPPED, 'Out for Delivery'),
        (STATUS_RECEIVED, 'Received'),
        (STATUS_CANCELLED, 'Cancelled'),
    ]

    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='orders')
    order_number = models.CharField(max_length=50, unique=True, help_text="Unique order reference")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0)])
    customer_name = models.CharField(max_length=150, help_text="Snapshot customer name at purchase")
    customer_mobile = models.CharField(max_length=20, help_text="Snapshot mobile number at purchase")
    customer_address = models.TextField(help_text="Snapshot delivery address at purchase")
    is_removed_by_admin = models.BooleanField(default=False, help_text="Hides order from active Admin order management list")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'store_order'
        ordering = ['-created_at']

    def __str__(self):
        user_str = self.user.username if self.user else "Deleted User"
        return f"Order #{self.order_number} - {user_str} ({self.get_status_display()})"


class OrderItem(models.Model):
    """
    Represents individual products/variants within a customer order.
    Stores product, variant, and GSM snapshot data (name, size, variant name, GSM, price at time of purchase)
    so future catalog or price changes do not alter past customer invoices.
    """
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, blank=True)
    variant = models.ForeignKey(ProductVariant, on_delete=models.SET_NULL, null=True, blank=True)
    gsm = models.IntegerField(choices=GSM_CHOICES, null=True, blank=True, help_text="Snapshot GSM for Raw Material products")

    product_name = models.CharField(max_length=255, help_text="Snapshot product name")
    size = models.CharField(max_length=100, blank=True, help_text="Snapshot product size")
    weight = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, help_text="Snapshot weight in kg for Raw Material products")
    gsm_price_per_kg = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, help_text="Snapshot GSM price per kg at order time")
    variant_name = models.CharField(max_length=150, blank=True, help_text="Snapshot variant/quality/GSM name")
    unit_packing = models.CharField(max_length=100, blank=True, help_text="Snapshot packing unit")
    price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)], help_text="Unit price at purchase")
    quantity = models.IntegerField(default=1, validators=[MinValueValidator(1)])
    item_total = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0)])

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'store_orderitem'

    def __str__(self):
        return f"{self.product_name} x {self.quantity} (Order #{self.order.order_number})"
