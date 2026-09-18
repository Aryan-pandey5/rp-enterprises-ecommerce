from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser, AllowAny
from rest_framework.response import Response
from rest_framework import status

from .models import Category
from .serializers import CategorySerializer


@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def category_list_api(request):
    """
    Category List & Create API.
    - GET: Public. Returns list of all categories. Supports section filter (?section=DISPOSABLE|RAW_MATERIAL).
    - POST: Admin staff only. Creates a new category.
    """
    if request.method == 'GET':
        section_filter = request.GET.get('section', '').strip().upper()
        if section_filter in ['DISPOSABLE', 'RAW_MATERIAL']:
            categories = Category.objects.filter(category_type=section_filter, is_active=True)
        else:
            categories = Category.objects.all()

        serializer = CategorySerializer(categories, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    elif request.method == 'POST':
        if not request.user or not request.user.is_authenticated or not request.user.is_staff:
            return Response({"error": "Administrator credentials required to create categories."}, status=status.HTTP_403_FORBIDDEN)

        serializer = CategorySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([AllowAny])
def category_detail_api(request, pk):
    """
    Category Detail, Edit & Delete API.
    - GET: Public. Returns details of a specific category.
    - PUT/PATCH: Admin staff only. Updates category details.
    - DELETE: Admin staff only. Deletes category safely if no active products are linked to it.
    """
    try:
        category = Category.objects.get(pk=pk)
    except Category.DoesNotExist:
        return Response({"error": "Category not found."}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = CategorySerializer(category)
        return Response(serializer.data, status=status.HTTP_200_OK)

    if not request.user or not request.user.is_authenticated or not request.user.is_staff:
        return Response({"error": "Administrator credentials required to modify categories."}, status=status.HTTP_403_FORBIDDEN)

    if request.method in ['PUT', 'PATCH']:
        serializer = CategorySerializer(category, data=request.data, partial=(request.method == 'PATCH'))
        if serializer.is_valid():
            updated_cat = serializer.save()
            return Response({
                "message": f"Category '{updated_cat.name}' updated successfully.",
                "category": CategorySerializer(updated_cat).data
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        linked_products_count = category.products.count()
        if linked_products_count > 0:
            return Response(
                {"error": f"Cannot delete category '{category.name}' because it has {linked_products_count} active product(s) associated with it. Please reassign or delete the products first."},
                status=status.HTTP_400_BAD_REQUEST
            )

        cat_name = category.name
        category.delete()
        return Response({
            "message": f"Category '{cat_name}' deleted successfully.",
            "deleted_id": pk
        }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_categories_bulk_delete_api(request):
    """
    POST: Admin Bulk Categories Delete API.
    Enforces IsAdminUser staff permission.
    Protects categories that have linked products from being deleted.
    """
    ids = request.data.get('ids', [])
    if not isinstance(ids, list) or not ids:
        return Response({"error": "No category IDs provided for bulk deletion."}, status=status.HTTP_400_BAD_REQUEST)

    deleted_count = 0
    failed_count = 0
    failed_items = []

    for cat_id in ids:
        try:
            category = Category.objects.get(pk=cat_id)
            linked_products_count = category.products.count()
            if linked_products_count > 0:
                failed_count += 1
                failed_items.append({"id": cat_id, "name": category.name, "reason": f"Contains {linked_products_count} linked product(s)."})
            else:
                category.delete()
                deleted_count += 1
        except Category.DoesNotExist:
            failed_count += 1
            failed_items.append({"id": cat_id, "name": "Unknown", "reason": "Category not found."})

    msg = f"{deleted_count} category/categories deleted successfully."
    if failed_count > 0:
        msg += f" {failed_count} category/categories could not be deleted."

    return Response({
        "message": msg,
        "deleted_count": deleted_count,
        "failed_count": failed_count,
        "failed_items": failed_items
    }, status=status.HTTP_200_OK)
