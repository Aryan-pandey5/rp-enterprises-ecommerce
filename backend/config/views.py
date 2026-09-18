from rest_framework.decorators import api_view
from rest_framework.response import Response

@api_view(['GET'])
def api_root(request):
    """
    Base API endpoint for R.P. Enterprises
    """
    return Response({
        "message": "R.P. Enterprises API is running"
    })
