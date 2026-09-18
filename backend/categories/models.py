from django.db import models


class Category(models.Model):
    """
    Supports category classification for Disposable Products and Raw Materials.
    """
    SECTION_CHOICES = (
        ('DISPOSABLE', 'Disposable Products'),
        ('RAW_MATERIAL', 'Raw Materials'),
    )

    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    category_type = models.CharField(
        max_length=20, 
        choices=SECTION_CHOICES, 
        default='DISPOSABLE',
        help_text="Distinguishes finished disposable products from industrial raw materials"
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'store_category'
        verbose_name_plural = "Categories"
        ordering = ['category_type', 'name']

    def __str__(self):
        return f"{self.name} ({self.get_category_type_display()})"
