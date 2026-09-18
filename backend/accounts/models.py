from django.db import models
from django.contrib.auth.models import User


class CustomerProfile(models.Model):
    """
    Extends Django's built-in User model to store additional customer details such as
    mobile number and shipping/billing address.
    Password and authentication are securely managed by Django's auth User system.
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    mobile_number = models.CharField(max_length=15, blank=True)
    address = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'store_customerprofile'

    def __str__(self):
        return f"{self.user.get_full_name() or self.user.username} ({self.mobile_number or 'No Mobile'})"
