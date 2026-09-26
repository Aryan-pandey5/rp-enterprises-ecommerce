from django.db import transaction
from django.db.models import Sum, Count, Q, Value, DecimalField
from django.db.models.functions import Coalesce
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.core.mail import send_mail
from django.conf import settings

from .models import CustomerProfile
from .serializers import (
    RegisterSerializer,
    CustomerProfileSerializer,
    AdminCustomerSerializer,
    AdminCreateCustomerSerializer,
    AdminLoginSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer,
    ChangePasswordSerializer
)
from orders.models import Order
from orders.serializers import OrderSerializer
from notifications.models import Notification
from notifications.whatsapp import send_whatsapp_customer_signup_notification


@api_view(['POST'])
@permission_classes([AllowAny])
def register_api(request):
    """
    Customer Registration API.
    Creates Django User and linked CustomerProfile in an atomic transaction.
    """
    serializer = RegisterSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    with transaction.atomic():
        user = serializer.save()
        refresh = RefreshToken.for_user(user)

        Notification.objects.create(
            user=user,
            is_admin_notification=False,
            notification_type=Notification.TYPE_SYSTEM,
            title="Welcome to R.P. Enterprises!",
            message=f"Welcome {user.first_name}! Your account has been created successfully."
        )

        Notification.objects.create(
            user=None,
            is_admin_notification=True,
            notification_type=Notification.TYPE_SYSTEM,
            title="New Customer Registered",
            message=f"New customer registered: {user.first_name} ({user.username})."
        )

        try:
            profile = user.profile
            send_whatsapp_customer_signup_notification(user, profile)
        except Exception:
            pass

    return Response({
        "message": "Registration successful! Welcome to R.P. Enterprises.",
        "tokens": {
            "refresh": str(refresh),
            "access": str(refresh.access_token),
        },
        "user": {
            "id": user.id,
            "username": user.username,
            "name": user.first_name,
            "email": user.email,
            "mobile_number": user.profile.mobile_number,
            "address": user.profile.address,
            "is_staff": user.is_staff
        }
    }, status=status.HTTP_201_CREATED)



@api_view(['POST'])
@permission_classes([AllowAny])
def login_api(request):
    """
    Customer Login API.
    Authenticates customer using mobile number (username) and password.
    """
    mobile_number = request.data.get('mobile_number', '').strip()
    password = request.data.get('password', '')

    if not mobile_number or not password:
        return Response(
            {"error": "Please provide both mobile number and password."},
            status=status.HTTP_400_BAD_REQUEST
        )

    user = authenticate(username=mobile_number, password=password)

    if not user:
        if not User.objects.filter(username=mobile_number).exists():
            return Response(
                {"error": "Mobile number is not registered. Please register first."},
                status=status.HTTP_401_UNAUTHORIZED
            )
        return Response(
            {"error": "Incorrect password. Please try again."},
            status=status.HTTP_401_UNAUTHORIZED
        )

    refresh = RefreshToken.for_user(user)
    try:
        profile = user.profile
        mobile = profile.mobile_number
        address = profile.address
    except CustomerProfile.DoesNotExist:
        mobile = user.username
        address = ""

    return Response({
        "message": "Login successful.",
        "tokens": {
            "refresh": str(refresh),
            "access": str(refresh.access_token),
        },
        "user": {
            "id": user.id,
            "username": user.username,
            "name": user.first_name or user.username,
            "email": user.email,
            "mobile_number": mobile,
            "address": address,
            "is_staff": user.is_staff
        }
    }, status=status.HTTP_200_OK)



@api_view(['POST'])
@permission_classes([AllowAny])
def admin_login_api(request):
    """
    Factory Administrator Login API.
    Authenticates administrative staff/superuser using username and password.
    Verifies staff status (is_staff=True). Non-staff users are rejected.
    """
    serializer = AdminLoginSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    username = serializer.validated_data['username']
    password = serializer.validated_data['password']

    user = authenticate(username=username, password=password)

    if not user:
        if not User.objects.filter(username=username).exists():
            return Response(
                {"error": "Invalid administrator username."},
                status=status.HTTP_401_UNAUTHORIZED
            )
        return Response(
            {"error": "Incorrect administrator password."},
            status=status.HTTP_401_UNAUTHORIZED
        )

    if not user.is_staff:
        return Response(
            {"error": "Access Denied: You do not have administrator access permissions."},
            status=status.HTTP_403_FORBIDDEN
        )

    refresh = RefreshToken.for_user(user)

    return Response({
        "message": "Administrator login successful.",
        "tokens": {
            "refresh": str(refresh),
            "access": str(refresh.access_token),
        },
        "user": {
            "id": user.id,
            "username": user.username,
            "name": user.first_name or user.username,
            "is_staff": user.is_staff,
            "is_superuser": user.is_superuser,
            "role": "admin"
        }
    }, status=status.HTTP_200_OK)


@api_view(['GET', 'PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def profile_api(request):
    """
    Customer Profile API.
    - GET: Retrieves profile details of the authenticated customer.
    - PUT/PATCH: Updates name, mobile number, and delivery address.
    """
    try:
        profile = request.user.profile
    except CustomerProfile.DoesNotExist:
        profile = CustomerProfile.objects.create(
            user=request.user,
            mobile_number=request.user.username,
            address=""
        )

    if request.method == 'GET':
        serializer = CustomerProfileSerializer(profile)
        return Response(serializer.data, status=status.HTTP_200_OK)

    elif request.method in ['PUT', 'PATCH']:
        serializer = CustomerProfileSerializer(profile, data=request.data, partial=(request.method == 'PATCH'))
        if serializer.is_valid():
            serializer.save()
            return Response({
                "message": "Profile updated successfully.",
                "profile": serializer.data
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me_api(request):
    """
    Current Session / Auth Verification API.
    Returns authenticated user information.
    """
    user = request.user
    try:
        profile = user.profile
        mobile = profile.mobile_number
        address = profile.address
    except CustomerProfile.DoesNotExist:
        mobile = user.username
        address = ""

    return Response({
        "authenticated": True,
        "user": {
            "id": user.id,
            "username": user.username,
            "name": user.first_name or user.username,
            "email": user.email,
            "mobile_number": mobile,
            "address": address,
            "is_staff": user.is_staff,
            "is_superuser": user.is_superuser,
            "role": "admin" if user.is_staff else "customer"
        }
    })



@api_view(['GET', 'POST'])
@permission_classes([IsAdminUser])
def admin_customers_api(request):
    """
    Admin Customer Management API.
    - GET: Retrieves all registered customer accounts with ORM aggregation for Total Orders and Total Purchase.
    - POST: Admin manual customer creation with secure password hashing.
    """
    if request.method == 'GET':
        search_query = request.GET.get('search', '').strip()
        sort_by = request.GET.get('sort', 'date_joined').strip()
        order_dir = request.GET.get('order', 'desc').strip().lower()

        queryset = User.objects.filter(is_staff=False).annotate(
            annotated_orders=Count('orders', filter=~Q(orders__status=Order.STATUS_CANCELLED), distinct=True),
            annotated_purchase=Coalesce(
                Sum('orders__total_amount', filter=~Q(orders__status=Order.STATUS_CANCELLED)),
                Value(0.00),
                output_field=DecimalField()
            )
        )

        if search_query:
            queryset = queryset.filter(
                Q(first_name__icontains=search_query) |
                Q(username__icontains=search_query) |
                Q(profile__mobile_number__icontains=search_query)
            )

        if sort_by == 'total_orders':
            ordering = '-annotated_orders' if order_dir == 'desc' else 'annotated_orders'
        elif sort_by == 'total_purchase':
            ordering = '-annotated_purchase' if order_dir == 'desc' else 'annotated_purchase'
        elif sort_by == 'name':
            ordering = 'first_name' if order_dir == 'asc' else '-first_name'
        else:
            ordering = '-date_joined' if order_dir == 'desc' else 'date_joined'

        customers = queryset.order_by(ordering)
        serializer = AdminCustomerSerializer(customers, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    elif request.method == 'POST':
        serializer = AdminCreateCustomerSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        name = serializer.validated_data['name']
        mobile_number = serializer.validated_data['mobile_number']
        address = serializer.validated_data['address']
        password = serializer.validated_data['password']

        if User.objects.filter(username=mobile_number).exists() or CustomerProfile.objects.filter(mobile_number=mobile_number).exists():
            return Response({"error": "A customer with this mobile number already exists."}, status=status.HTTP_400_BAD_REQUEST)

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

        try:
            send_whatsapp_customer_signup_notification(user, profile)
        except Exception:
            pass

        customer_serializer = AdminCustomerSerializer(user)
        return Response({
            "message": f"Customer '{name}' ({mobile_number}) created successfully.",
            "customer": customer_serializer.data
        }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_customer_detail_api(request, pk):
    """
    Retrieves detailed customer profile, order metrics, and historical order list for Admin.
    """
    try:
        customer = User.objects.get(pk=pk, is_staff=False)
    except User.DoesNotExist:
        return Response({"error": "Customer not found."}, status=status.HTTP_404_NOT_FOUND)

    customer_serializer = AdminCustomerSerializer(customer)
    orders_qs = Order.objects.filter(user=customer).order_by('-created_at')
    orders_serializer = OrderSerializer(orders_qs, many=True, context={'request': request})

    valid_orders = orders_qs.exclude(status=Order.STATUS_CANCELLED)
    total_orders_count = valid_orders.count()
    total_purchase_sum = sum(float(o.total_amount) for o in valid_orders)
    avg_order_value = round(total_purchase_sum / total_orders_count, 2) if total_orders_count > 0 else 0.0

    return Response({
        "customer": customer_serializer.data,
        "statistics": {
            "total_orders": total_orders_count,
            "total_purchase": round(total_purchase_sum, 2),
            "average_order_value": avg_order_value
        },
        "orders": orders_serializer.data
    })


@api_view(['DELETE'])
@permission_classes([IsAdminUser])
def admin_customer_delete_api(request, pk):
    """
    Deletes customer account while preserving historical order records.
    """
    try:
        customer = User.objects.get(pk=pk, is_staff=False)
    except User.DoesNotExist:
        return Response({"error": "Customer not found."}, status=status.HTTP_404_NOT_FOUND)

    orders_count = Order.objects.filter(user=customer).count()
    customer_name = customer.first_name or customer.username

    customer.delete()

    return Response({
        "message": f"Customer '{customer_name}' account deleted successfully. {orders_count} historical order records preserved in system database.",
        "deleted_customer_id": pk,
        "orders_preserved": orders_count
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_customers_bulk_delete_api(request):
    """
    POST: Admin Bulk Customer Account Deletion API.
    """
    ids = request.data.get('ids', [])
    if not isinstance(ids, list) or not ids:
        return Response({"error": "No customer IDs provided for bulk deletion."}, status=status.HTTP_400_BAD_REQUEST)

    deleted_count = 0
    failed_count = 0
    failed_items = []

    for uid in ids:
        try:
            customer = User.objects.get(pk=uid, is_staff=False)
            customer.delete()
            deleted_count += 1
        except User.DoesNotExist:
            failed_count += 1
            failed_items.append({"id": uid, "reason": "Customer account not found or is a staff account."})

    msg = f"{deleted_count} customer account(s) deleted successfully."
    if failed_count > 0:
        msg += f" {failed_count} customer account(s) could not be deleted."

    return Response({
        "message": msg,
        "deleted_count": deleted_count,
        "failed_count": failed_count,
        "failed_items": failed_items
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def password_reset_request_api(request):
    """
    Password Reset Link Request API.
    Sends a secure one-time password reset link to the registered email address.
    Generates generic response to prevent user email enumeration.
    """
    serializer = PasswordResetRequestSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    email = serializer.validated_data['email'].strip().lower()
    
    # Generic success message response (prevents account enumeration)
    generic_success_msg = "If an account exists with this email address, a password reset link has been sent to your email."

    try:
        user = User.objects.get(email__iexact=email)
    except User.DoesNotExist:
        return Response({"message": generic_success_msg}, status=status.HTTP_200_OK)

    if not user.is_active:
        return Response({"message": generic_success_msg}, status=status.HTTP_200_OK)

    # Generate one-time reset token & encoded user ID
    token = default_token_generator.make_token(user)
    uidb64 = urlsafe_base64_encode(force_bytes(user.pk))
    
    frontend_domain = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173').rstrip('/')
    reset_url = f"{frontend_domain}/reset-password/{uidb64}/{token}"

    subject = "Password Reset Request — R.P. Enterprises"
    message = f"""Hello {user.first_name or 'Customer'},

We received a request to reset your password for your R.P. Enterprises account.

Click the link below to set a new password:
{reset_url}

If you did not request a password reset, please ignore this email. Your password will remain unchanged.

Best regards,
R.P. Enterprises Team
"""
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'R.P. Enterprises <noreply@rp-enterprises.com>'),
            recipient_list=[email],
            fail_silently=False,
        )
    except Exception as e:
        # Log error internally, return generic response to client
        print(f"Error sending password reset email to {email}: {e}")

    return Response({"message": generic_success_msg}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def password_reset_confirm_api(request):
    """
    Password Reset Confirmation API.
    Consumes secure uidb64 and token to set a new password.
    """
    serializer = PasswordResetConfirmSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    uidb64 = serializer.validated_data['uidb64']
    token = serializer.validated_data['token']
    password = serializer.validated_data['password']

    try:
        uid = force_str(urlsafe_base64_decode(uidb64))
        user = User.objects.get(pk=uid)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        return Response(
            {"error": "Invalid password reset link or user account not found."},
            status=status.HTTP_400_BAD_REQUEST
        )

    if not default_token_generator.check_token(user, token):
        return Response(
            {"error": "This password reset link is invalid or has expired. Please request a new link."},
            status=status.HTTP_400_BAD_REQUEST
        )

    user.set_password(password)
    user.save()

    return Response({
        "message": "Password has been successfully changed. You can now login with your new password."
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password_api(request):
    """
    Authenticated Customer Change Password API.
    Verifies old password before setting new password.
    """
    serializer = ChangePasswordSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    user = request.user
    old_password = serializer.validated_data['old_password']
    new_password = serializer.validated_data['new_password']

    if not user.check_password(old_password):
        return Response(
            {"error": "Incorrect old password. Please enter your current password correctly."},
            status=status.HTTP_400_BAD_REQUEST
        )

    user.set_password(new_password)
    user.save()

    return Response({
        "message": "Your password has been changed successfully."
    }, status=status.HTTP_200_OK)

