from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import IsAdminUser, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from rest_framework import status

from .models import Product, ProductVariant, GlobalGSMPrice
from .serializers import (
    ProductSerializer,
    GlobalGSMPriceSerializer
)


@api_view(['GET', 'PUT'])
@permission_classes([AllowAny])
def global_gsm_price_list_update_api(request):
    """
    Central Global GSM Price Management API.
    - GET: Returns list of all 5 GSM choices (80, 90, 100, 120, 140) with their current global prices.
    - PUT: Admin only. Updates global prices for GSMs.
    """
    GSM_CHOICES_VALS = [80, 90, 100, 120, 140]

    if request.method == 'GET':
        for gsm_val in GSM_CHOICES_VALS:
            GlobalGSMPrice.objects.get_or_create(gsm=gsm_val, defaults={'price': '0.00'})

        gsm_prices = GlobalGSMPrice.objects.filter(gsm__in=GSM_CHOICES_VALS).order_by('gsm')
        serializer = GlobalGSMPriceSerializer(gsm_prices, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    elif request.method == 'PUT':
        if not request.user or not request.user.is_authenticated or not request.user.is_staff:
            return Response({"error": "Administrator credentials required to update global GSM prices."}, status=status.HTTP_403_FORBIDDEN)

        prices_data = request.data
        if not isinstance(prices_data, list):
            return Response({"error": "Payload must be a list of GSM price objects."}, status=status.HTTP_400_BAD_REQUEST)

        for item in prices_data:
            gsm_val = item.get('gsm')
            price_val = item.get('price', '0.00')

            if gsm_val in GSM_CHOICES_VALS:
                try:
                    price_num = float(price_val)
                    if price_num < 0:
                        return Response({"error": f"Price for {gsm_val} GSM cannot be negative."}, status=status.HTTP_400_BAD_REQUEST)
                except (ValueError, TypeError):
                    return Response({"error": f"Invalid price format for {gsm_val} GSM."}, status=status.HTTP_400_BAD_REQUEST)

                gsm_obj, _ = GlobalGSMPrice.objects.get_or_create(gsm=gsm_val)
                gsm_obj.price = price_val or '0.00'
                gsm_obj.save()

        all_prices = GlobalGSMPrice.objects.filter(gsm__in=GSM_CHOICES_VALS).order_by('gsm')
        serializer = GlobalGSMPriceSerializer(all_prices, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def product_list_api(request):
    """
    Product Listing & Creation API.
    - GET: Public. Returns list of active products. Supports category filter (?category=<id>), section filter (?section=DISPOSABLE|RAW_MATERIAL), search (?search=) and include_inactive (?include_inactive=true for admin).
    - POST: Admin staff only. Creates product with variants. Supports image uploads (multipart/form-data).
    """
    if request.method == 'GET':
        category_id = request.GET.get('category')
        section_filter = request.GET.get('section', '').strip().upper()
        search_query = request.GET.get('search', '').strip()
        include_inactive = request.GET.get('include_inactive', 'false').lower() == 'true'

        products = Product.objects.all()

        if not include_inactive:
            products = products.filter(is_active=True)

        if category_id:
            products = products.filter(category_id=category_id)

        if section_filter in ['DISPOSABLE', 'RAW_MATERIAL']:
            products = products.filter(category__category_type=section_filter)

        if search_query:
            products = products.filter(name__icontains=search_query)

        serializer = ProductSerializer(products, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    elif request.method == 'POST':
        if not request.user or not request.user.is_authenticated or not request.user.is_staff:
            return Response({"error": "Administrator credentials required to create products."}, status=status.HTTP_403_FORBIDDEN)

        serializer = ProductSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            product = serializer.save()
            return Response(ProductSerializer(product, context={'request': request}).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([AllowAny])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def product_detail_api(request, pk):
    """
    Product Detail, Update & Permanent Delete API.
    - GET: Public. Returns product details.
    - PUT/PATCH: Admin staff only. Updates product details, variants, or image.
    - DELETE: Admin staff only. Permanently deletes product & variants from database while preserving historical orders.
    """
    try:
        product = Product.objects.get(pk=pk)
    except Product.DoesNotExist:
        return Response({"error": "Product not found."}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = ProductSerializer(product, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    if not request.user or not request.user.is_authenticated or not request.user.is_staff:
        return Response({"error": "Administrator credentials required to modify products."}, status=status.HTTP_403_FORBIDDEN)

    if request.method in ['PUT', 'PATCH']:
        serializer = ProductSerializer(product, data=request.data, partial=(request.method == 'PATCH'), context={'request': request})
        if serializer.is_valid():
            updated_product = serializer.save()
            return Response(ProductSerializer(updated_product, context={'request': request}).data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        prod_name = product.name
        product.delete()
        return Response({
            "message": f"Product '{prod_name}' and its variants permanently deleted from catalog. Historical order invoices preserved.",
            "deleted_id": pk
        }, status=status.HTTP_200_OK)


@api_view(['POST', 'PATCH'])
@permission_classes([IsAdminUser])
def product_toggle_active_api(request, pk):
    """
    PATCH: Toggles product availability state (Available / Not Available).
    """
    try:
        product = Product.objects.get(pk=pk)
    except Product.DoesNotExist:
        return Response({"error": "Product not found."}, status=status.HTTP_404_NOT_FOUND)

    product.is_active = not product.is_active
    product.save()

    status_str = "Available" if product.is_active else "Not Available"
    return Response({
        "message": f"Product '{product.name}' availability updated to {status_str}.",
        "id": product.id,
        "is_active": product.is_active,
        "status_text": status_str
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_products_bulk_delete_api(request):
    """
    POST: Admin Bulk Product Delete API.
    Enforces IsAdminUser staff permission.
    Permanently deletes selected products and their variants from catalog while preserving order history.
    """
    ids = request.data.get('ids', [])
    if not isinstance(ids, list) or not ids:
        return Response({"error": "No product IDs provided for bulk deletion."}, status=status.HTTP_400_BAD_REQUEST)

    deleted_count = 0
    failed_count = 0
    failed_items = []

    for pid in ids:
        try:
            product = Product.objects.get(pk=pid)
            product.delete()
            deleted_count += 1
        except Product.DoesNotExist:
            failed_count += 1
            failed_items.append({"id": pid, "name": "Unknown", "reason": "Product not found."})

    msg = f"{deleted_count} product(s) permanently deleted from catalog."
    if failed_count > 0:
        msg += f" {failed_count} product(s) could not be deleted."

    return Response({
        "message": msg,
        "deleted_count": deleted_count,
        "failed_count": failed_count,
        "failed_items": failed_items
    }, status=status.HTTP_200_OK)
