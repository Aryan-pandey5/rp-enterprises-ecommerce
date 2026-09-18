from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework import status

from .models import Notification
from .serializers import NotificationSerializer
from .whatsapp import get_whatsapp_status, send_admin_whatsapp


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def notification_list_api(request):
    """
    In-App Notification Listing API.
    - GET: Retrieves notifications. For customers, returns personal notifications. For admins (?admin=true), returns admin alerts.
    """
    is_admin_query = request.GET.get('admin', 'false').lower() == 'true'
    unread_only = request.GET.get('unread', 'false').lower() == 'true'

    if is_admin_query:
        if not request.user.is_staff:
            return Response({"error": "Administrator credentials required to view factory admin alerts."}, status=status.HTTP_403_FORBIDDEN)
        queryset = Notification.objects.filter(is_admin_notification=True)
    else:
        queryset = Notification.objects.filter(user=request.user, is_admin_notification=False)

    if unread_only:
        queryset = queryset.filter(is_read=False)

    notifications = queryset.order_by('-created_at')
    serializer = NotificationSerializer(notifications, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def notification_unread_count_api(request):
    """
    Returns unread notification badge count.
    Supports ?admin=true parameter for admin staff.
    """
    is_admin_query = request.GET.get('admin', 'false').lower() == 'true'

    if is_admin_query:
        if not request.user.is_staff:
            return Response({"error": "Administrator credentials required."}, status=status.HTTP_403_FORBIDDEN)
        count = Notification.objects.filter(is_admin_notification=True, is_read=False).count()
    else:
        count = Notification.objects.filter(user=request.user, is_admin_notification=False, is_read=False).count()

    return Response({"unread_count": count}, status=status.HTTP_200_OK)


@api_view(['PATCH', 'PUT'])
@permission_classes([IsAuthenticated])
def notification_mark_read_api(request, pk):
    """
    Marks a single notification as read (is_read=True).
    """
    try:
        if request.user.is_staff:
            notification = Notification.objects.get(pk=pk)
        else:
            notification = Notification.objects.get(pk=pk, user=request.user)
    except Notification.DoesNotExist:
        return Response({"error": "Notification not found."}, status=status.HTTP_404_NOT_FOUND)

    notification.is_read = True
    notification.save()

    serializer = NotificationSerializer(notification)
    return Response({
        "message": "Notification marked as read.",
        "notification": serializer.data
    }, status=status.HTTP_200_OK)


@api_view(['POST', 'PATCH', 'PUT'])
@permission_classes([IsAuthenticated])
def notification_mark_all_read_api(request):
    """
    Marks all notifications for the requesting user (or admin alerts if ?admin=true) as read.
    """
    is_admin_query = request.GET.get('admin', 'false').lower() == 'true'

    if is_admin_query:
        if not request.user.is_staff:
            return Response({"error": "Administrator credentials required."}, status=status.HTTP_403_FORBIDDEN)
        updated_count = Notification.objects.filter(is_admin_notification=True, is_read=False).update(is_read=True)
    else:
        updated_count = Notification.objects.filter(user=request.user, is_admin_notification=False, is_read=False).update(is_read=True)

    return Response({
        "message": f"All {updated_count} notification(s) marked as read.",
        "updated_count": updated_count
    }, status=status.HTTP_200_OK)


@api_view(['GET', 'POST'])
@permission_classes([IsAdminUser])
def admin_whatsapp_test_api(request):
    """
    Admin Meta WhatsApp Cloud API Diagnostic & Test Utility Endpoint.
    - GET: Returns status summary of WhatsApp API environment credentials.
    - POST: Dispatches a live test WhatsApp notification to the factory admin recipient.
    """
    if request.method == 'GET':
        return Response(get_whatsapp_status(), status=status.HTTP_200_OK)

    elif request.method == 'POST':
        test_msg = request.data.get('message') or "🧪 *Test Notification — R.P. Enterprises*\n\nWhatsApp Business Cloud API connection test successful!"
        success = send_admin_whatsapp(test_msg)

        if success:
            return Response({
                "success": True,
                "message": "Test WhatsApp notification dispatched successfully to admin recipient (919305616979)."
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                "success": False,
                "message": "WhatsApp notification skipped or failed safely. Verify WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID environment variables.",
                "whatsapp_status": get_whatsapp_status()
            }, status=status.HTTP_200_OK)
