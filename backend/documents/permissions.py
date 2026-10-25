from rest_framework import permissions


class IsDocumentOwnerOrAdmin(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.role == 'ADMIN':
            return True
        if obj.owner_id == request.user.pk or obj.uploaded_by_id == request.user.pk:
            return True
        grant = obj.document_access.filter(user=request.user).first()
        return bool(grant and (grant.can_view or grant.can_edit or grant.can_download))


class CanEditDocument(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.role == 'ADMIN':
            return True
        if obj.owner_id == request.user.pk or obj.uploaded_by_id == request.user.pk:
            return True
        grant = obj.document_access.filter(user=request.user).first()
        return bool(grant and (grant.can_edit or grant.can_download))


class IsDocumentPermissionManager(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.role == 'ADMIN':
            return True
        return obj.document.owner_id == request.user.pk or obj.document.uploaded_by_id == request.user.pk
