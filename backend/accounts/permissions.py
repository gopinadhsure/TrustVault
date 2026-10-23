from rest_framework.permissions import BasePermission

class IsAdminRole(BasePermission):
    """Allows access only to ADMIN users."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'ADMIN')

class IsOwnerOrAdmin(BasePermission):
    """Allows access to OWNER or ADMIN users."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role in ['OWNER', 'ADMIN'])

class IsViewerOrAbove(BasePermission):
    """Allows access to any authenticated user."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)
