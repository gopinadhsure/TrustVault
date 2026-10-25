import mimetypes

from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Q
from django.http import FileResponse, Http404
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, pagination, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from rest_framework.views import APIView

from .models import AuditLog, Document, DocumentAccess
from .permissions import IsDocumentOwnerOrAdmin, IsDocumentPermissionManager
from .audit import record_audit_event
from accounts.permissions import IsAdminRole
from .serializers import (
    AuditLogSerializer,
    DocumentAccessSerializer,
    DocumentSerializer,
    DocumentUpdateSerializer,
    DocumentUploadSerializer,
)

User = get_user_model()


class AuditLogPagination(pagination.PageNumberPagination):
    page_size = 25
    page_size_query_param = 'page_size'
    max_page_size = 100


class DocumentListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = DocumentSerializer

    def get_queryset(self):
        user = self.request.user
        queryset = Document.objects.filter(is_deleted=False)
        if user.role == 'ADMIN':
            return queryset

        return queryset.filter(
            Q(owner=user) | Q(uploaded_by=user) | Q(document_access__user=user)
        ).distinct()

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return DocumentUploadSerializer
        return DocumentSerializer

    def perform_create(self, serializer):
        with transaction.atomic():
            document = serializer.save(uploaded_by=self.request.user, owner=self.request.user)
            record_audit_event(
                request=self.request,
                action='document_uploaded',
                target_model='document',
                target_id=document.pk,
                target_label=document.title,
                details={'title': document.title, 'file_name': document.original_filename},
            )

    def create(self, request, *args, **kwargs):
        try:
            response = super().create(request, *args, **kwargs)
            if response.status_code >= 400:
                record_audit_event(
                    request=request,
                    action='document_upload',
                    outcome='failure',
                    target_model='document',
                    details={'reason': 'upload_rejected'},
                )
            return response
        except Exception:
            record_audit_event(
                request=request,
                action='document_upload',
                outcome='failure',
                target_model='document',
                details={'reason': 'upload_failed'},
            )
            raise


class DocumentDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated, IsDocumentOwnerOrAdmin]
    serializer_class = DocumentSerializer

    def get_object(self):
        try:
            obj = super().get_object()
        except (Http404, PermissionDenied):
            action = {
                'GET': 'document_view',
                'PUT': 'document_metadata_edit',
                'PATCH': 'document_metadata_edit',
                'DELETE': 'document_deleted',
            }.get(self.request.method, 'document_access')
            record_audit_event(
                request=self.request,
                action=action,
                outcome='denied',
                target_model='document',
                target_id=self.kwargs.get('pk'),
                details={'reason': 'not_found_or_not_authorized'},
            )
            raise
        if self.request.method in {'PUT', 'PATCH'}:
            if not obj.can_user_access(self.request.user, require_edit=True):
                record_audit_event(
                    request=self.request,
                    action='document_metadata_edit',
                    outcome='denied',
                    target_model='document',
                    target_id=obj.pk,
                    target_label=obj.title,
                    details={'reason': 'missing_edit_permission'},
                )
                self.permission_denied(
                    self.request,
                    message='You do not have permission to edit this document.',
                    code='permission_denied',
                )
        return obj

    def retrieve(self, request, *args, **kwargs):
        document = self.get_object()
        response = Response(self.get_serializer(document).data)
        record_audit_event(
            request=request,
            action='document_viewed',
            target_model='document',
            target_id=document.pk,
            target_label=document.title,
        )
        return response

    def get_queryset(self):
        user = self.request.user
        queryset = Document.objects.filter(is_deleted=False)
        if user.role == 'ADMIN':
            return queryset
        return queryset.filter(
            Q(owner=user) | Q(uploaded_by=user) | Q(document_access__user=user)
        ).distinct()

    def get_serializer_class(self):
        if self.request.method in {'PUT', 'PATCH'}:
            return DocumentUpdateSerializer
        return DocumentSerializer

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        changed_fields = list(serializer.validated_data.keys())
        replacing_file = 'file' in serializer.validated_data
        with transaction.atomic():
            document = serializer.save()
            if replacing_file:
                record_audit_event(
                    request=request,
                    action='document_file_replaced',
                    target_model='document',
                    target_id=document.pk,
                    target_label=document.title,
                    details={'file_name': document.original_filename, 'file_type': document.file_type},
                )
            metadata_fields = [field for field in changed_fields if field != 'file']
            if metadata_fields:
                record_audit_event(
                    request=request,
                    action='document_metadata_updated',
                    target_model='document',
                    target_id=document.pk,
                    target_label=document.title,
                    details={'title': document.title, 'changed_fields': metadata_fields},
                )
        return Response(DocumentSerializer(document).data)

    def destroy(self, request, *args, **kwargs):
        document = self.get_object()
        if request.user.role != 'ADMIN' and document.owner_id != request.user.pk:
            record_audit_event(
                request=request,
                action='document_deleted',
                outcome='denied',
                target_model='document',
                target_id=document.pk,
                target_label=document.title,
                details={'reason': 'missing_owner_permission'},
            )
            return Response({'detail': 'Only the document owner or an admin can delete this document.'}, status=status.HTTP_403_FORBIDDEN)
        with transaction.atomic():
            document.is_deleted = True
            document.deleted_at = timezone.now()
            if document.file:
                document.file.delete(save=False)
            document.save(update_fields=['is_deleted', 'deleted_at'])
            record_audit_event(
                request=request,
                action='document_deleted',
                target_model='document',
                target_id=document.pk,
                target_label=document.title,
            )
        return Response({'detail': 'Document deleted successfully.'}, status=status.HTTP_204_NO_CONTENT)


class DocumentDownloadView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            document = get_object_or_404(Document, pk=pk, is_deleted=False)
        except Http404:
            record_audit_event(
                request=request,
                action='document_download',
                outcome='denied',
                target_model='document',
                target_id=pk,
                details={'reason': 'not_found_or_not_authorized'},
            )
            raise
        if not document.can_user_access(request.user, require_download=True):
            record_audit_event(
                request=request,
                action='document_download',
                outcome='denied',
                target_model='document',
                target_id=document.pk,
                target_label=document.title,
                details={'reason': 'missing_download_permission'},
            )
            return Response({'detail': 'You do not have permission to download this document.'}, status=status.HTTP_403_FORBIDDEN)

        try:
            file_handle = document.file.open('rb')
        except FileNotFoundError:
            record_audit_event(
                request=request,
                action='document_download',
                outcome='failure',
                target_model='document',
                target_id=document.pk,
                target_label=document.title,
                details={'reason': 'stored_file_missing'},
            )
            return Response({'detail': 'Stored file not found.'}, status=status.HTTP_404_NOT_FOUND)

        response = FileResponse(file_handle, as_attachment=True, filename=document.original_filename)
        response['Content-Type'] = mimetypes.guess_type(document.original_filename)[0] or 'application/octet-stream'
        record_audit_event(
            request=request,
            action='document_downloaded',
            target_model='document',
            target_id=document.pk,
            target_label=document.title,
            details={'file_name': document.original_filename},
        )
        return response


class DocumentAccessListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = DocumentAccessSerializer

    def get_queryset(self):
        user = self.request.user
        queryset = DocumentAccess.objects.select_related('document', 'user', 'granted_by')
        document_id = self.request.query_params.get('document')
        if document_id:
            queryset = queryset.filter(document_id=document_id)
        if user.role == 'ADMIN':
            return queryset
        return queryset.filter(document__owner=user)

    def perform_create(self, serializer):
        document = serializer.validated_data['document']
        target_user = serializer.validated_data['user']
        if self.request.user.role != 'ADMIN' and document.owner_id != self.request.user.pk:
            record_audit_event(
                request=self.request,
                action='document_permission_granted',
                outcome='denied',
                target_model='document',
                target_id=document.pk,
                target_label=document.title,
                details={'reason': 'missing_permission_management_rights'},
            )
            raise PermissionError('Only document owners or admins can share a document.')
        if target_user == document.owner:
            record_audit_event(
                request=self.request,
                action='document_permission_granted',
                outcome='denied',
                target_model='document',
                target_id=document.pk,
                target_label=document.title,
                details={'reason': 'owner_already_has_access'},
            )
            raise ValueError('The document owner already has access.')
        with transaction.atomic():
            grant = serializer.save(granted_by=self.request.user)
            if getattr(grant, 'can_edit', False) and not grant.can_view:
                grant.can_view = True
                grant.save(update_fields=['can_view'])
            record_audit_event(
                request=self.request,
                action='document_permission_granted',
                target_model='document',
                target_id=document.pk,
                target_label=document.title,
                details={
                    'target_username': target_user.username,
                    'grant_id': grant.pk,
                    'can_view': grant.can_view,
                    'can_download': grant.can_download,
                    'can_edit': grant.can_edit,
                },
            )

    def create(self, request, *args, **kwargs):
        try:
            return super().create(request, *args, **kwargs)
        except ValueError as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except PermissionError as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_403_FORBIDDEN)


class DocumentAccessDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated, IsDocumentPermissionManager]
    queryset = DocumentAccess.objects.select_related('document', 'user')
    serializer_class = DocumentAccessSerializer

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        grant = self.get_object()
        serializer = self.get_serializer(grant, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        if 'document' in serializer.validated_data or 'user' in serializer.validated_data:
            return Response(
                {'detail': 'A permission grant cannot be moved to another document or user.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        with transaction.atomic():
            grant = serializer.save()
            if grant.can_edit and not grant.can_view:
                grant.can_view = True
                grant.save(update_fields=['can_view'])
            record_audit_event(
                request=request,
                action='document_permission_changed',
                target_model='document',
                target_id=grant.document_id,
                target_label=grant.document.title,
                details={
                    'target_username': grant.user.username,
                    'grant_id': grant.pk,
                    'can_view': grant.can_view,
                    'can_download': grant.can_download,
                    'can_edit': grant.can_edit,
                },
            )
        return Response(self.get_serializer(grant).data)

    def destroy(self, request, *args, **kwargs):
        grant = self.get_object()
        with transaction.atomic():
            response = super().destroy(request, *args, **kwargs)
            record_audit_event(
                request=request,
                action='document_permission_revoked',
                target_model='document',
                target_id=grant.document_id,
                target_label=grant.document.title,
                details={'target_username': grant.user.username, 'grant_id': grant.pk},
            )
        return response

    def permission_denied(self, request, message=None, code=None):
        record_audit_event(
            request=request,
            action='document_permission_management',
            outcome='denied',
            target_model='document_access',
            target_id=self.kwargs.get('pk'),
            details={'reason': 'permission_management_denied', 'method': request.method},
        )
        super().permission_denied(request, message=message, code=code)


class AuditLogListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated, IsAdminRole]
    serializer_class = AuditLogSerializer
    pagination_class = AuditLogPagination

    def permission_denied(self, request, message=None, code=None):
        record_audit_event(
            request=request,
            action='audit_log_access',
            outcome='denied',
            target_model='audit_log',
            details={'reason': 'administrator_access_required', 'method': request.method},
        )
        super().permission_denied(request, message=message, code=code)

    def get_queryset(self):
        queryset = AuditLog.objects.select_related('user')
        for parameter, field in (
            ('action', 'action'),
            ('outcome', 'outcome'),
            ('target_model', 'target_model'),
            ('target_id', 'target_id'),
        ):
            value = self.request.query_params.get(parameter)
            if value:
                queryset = queryset.filter(**{field: value})
        actor = self.request.query_params.get('actor')
        if actor:
            queryset = queryset.filter(user__username__icontains=actor)
        return queryset


class DocumentSearchView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        query = request.query_params.get('search', '').strip()
        file_type = request.query_params.get('file_type')
        owner_id = request.query_params.get('owner')
        queryset = Document.objects.filter(is_deleted=False)
        user = request.user
        if user.role != 'ADMIN':
            queryset = queryset.filter(Q(owner=user) | Q(uploaded_by=user) | Q(document_access__user=user)).distinct()

        if query:
            queryset = queryset.filter(Q(title__icontains=query) | Q(original_filename__icontains=query) | Q(description__icontains=query))
        if file_type:
            queryset = queryset.filter(file_type__iexact=file_type)
        if owner_id:
            queryset = queryset.filter(owner_id=owner_id)

        queryset = queryset.filter(pk__in=[doc.pk for doc in queryset if doc.can_user_access(user)])
        serializer = DocumentSerializer(queryset, many=True)
        return Response(serializer.data)
