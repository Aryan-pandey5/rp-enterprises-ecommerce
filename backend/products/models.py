from decimal import Decimal
from django.db import models
from django.core.validators import MinValueValidator
from categories.models import Category

# Fixed GSM Choices for Raw Material Products
GSM_CHOICES = [
    (80, '80 GSM'),
    (90, '90 GSM'),
    (100, '100 GSM'),
    (120, '120 GSM'),
    (140, '140 GSM'),
]


class Product(models.Model):
    """
    Base model for products. Flexible enough for both finished disposable goods
    (Dona, Thali, Bowls) and raw materials (Paper Reels, Silver Foil Rolls).
    """
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='products')
    name = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    size = models.CharField(
        max_length=100, 
        blank=True, 
        help_text="Size dimension e.g. '36 × 48 inch', '8 inch'"
    )
    weight = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        null=True, 
        blank=True, 
        validators=[MinValueValidator(Decimal('0.01'), message="Weight must be greater than 0 kg.")],
        help_text="Weight in kg for Raw Material products"
    )
    gsm = models.IntegerField(
        choices=GSM_CHOICES, 
        null=True, 
        blank=True, 
        help_text="Selected GSM specification for Raw Material product"
    )
    image = models.ImageField(upload_to='products/', blank=True, null=True)
    base_price = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=0.00, 
        validators=[MinValueValidator(0)]
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'store_product'
        ordering = ['name']

    def __str__(self):
        return f"{self.name} [{self.category.name}]"

    @property
    def calculated_price(self):
        """
        Dynamically calculates the Raw Material price: Current GSM Price per kg * Weight (kg).
        Returns Decimal or None if GSM price is unconfigured / 0.
        For Disposable products, returns base_price.
        """
        if self.category and self.category.category_type == 'RAW_MATERIAL':
            if self.gsm and self.weight and self.weight > 0:
                global_obj = GlobalGSMPrice.objects.filter(gsm=self.gsm).first()
                if global_obj and global_obj.price > 0:
                    return (global_obj.price * Decimal(str(self.weight))).quantize(Decimal('0.01'))
            return None
        return self.base_price


class GlobalGSMPrice(models.Model):
    """
    Central Global GSM Price Management model.
    Stores the single authoritative global price for each GSM specification (80, 90, 100, 120, 140 GSM).
    Updating a price here automatically propagates to all Raw Material products using that GSM.
    """
    gsm = models.IntegerField(choices=GSM_CHOICES, unique=True, help_text="GSM paper weight specification")
    price = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=Decimal('0.00'), 
        validators=[MinValueValidator(0)],
        help_text="Central global price for this GSM specification"
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'store_globalgsmprice'
        ordering = ['gsm']

    def __str__(self):
        return f"{self.gsm} GSM - ₹{self.price}"


class ProductGSM(models.Model):
    """
    Associates a Raw Material product with supported GSM choices.
    Stores ONLY product-GSM association (NO product-specific prices).
    Prices are resolved dynamically from the central GlobalGSMPrice table.
    """
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='product_gsms')
    gsm = models.IntegerField(choices=GSM_CHOICES, help_text="Supported GSM paper weight choice")

    class Meta:
        db_table = 'store_productgsm'
        ordering = ['product', 'gsm']
        unique_together = ('product', 'gsm')

    def __str__(self):
        return f"{self.product.name} -> {self.gsm} GSM"


class ProductVariant(models.Model):
    """
    Product Variant / Quality / Packing model.
    Allows disposable products to have different bori/bag packing & quality options.
    """
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='variants')
    variant_name = models.CharField(
        max_length=100, 
        help_text="e.g. 'Silver Premium - 100 Pcs/Bori' or '50kg Kraft Reel'"
    )
    unit_packing = models.CharField(
        max_length=50, 
        blank=True, 
        help_text="e.g. '100 pcs/bori', '200 pcs/bag', '50 kg reel'"
    )
    price = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        validators=[MinValueValidator(0)]
    )
    stock = models.IntegerField(
        default=0, 
        validators=[MinValueValidator(0)],
        help_text="Available stock quantity in bori/bags/reels"
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'store_productvariant'
        ordering = ['product', 'price']

    def __str__(self):
        return f"{self.product.name} - {self.variant_name} (₹{self.price})"
