import os
from pathlib import Path
from pathlib import PurePosixPath

from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.files.storage import FileSystemStorage
from django.db import models


def _contains_path_traversal(filename):
    raw = str(filename or '')
    if not raw or '\x00' in raw:
        return True
    normalized = raw.replace('\\', '/')
    if normalized in {'.', '..'}:
        return True
    if normalized.startswith('/') or normalized.startswith('..'):
        return True
    if '/' in normalized or '\\' in raw:
        return True
    if any(part == '..' for part in PurePosixPath(normalized).parts):
        return True
    return False


class PrivateDocumentStorage(FileSystemStorage):
    def get_valid_name(self, name):
        raw = str(name or '')
        if _contains_path_traversal(raw):
            raise ValidationError('Path traversal is not allowed in file names.')
        clean = super().get_valid_name(raw)
        if not clean or clean in {'.', '..'}:
            raise ValidationError('Invalid file name.')
        return clean

    def get_available_name(self, name, max_length=None):
        normalized = str(name or '').replace('\\', '/')
        if any(part == '..' for part in PurePosixPath(normalized).parts) or normalized.startswith('/'):
            raise ValidationError('Path traversal is not allowed in file names.')
        return super().get_available_name(normalized, max_length=max_length)


def document_upload_path(instance, filename):
    raw = str(filename or '')
    if _contains_path_traversal(raw):
        raise ValidationError('Path traversal is not allowed in file names.')
    safe_name = os.path.basename(raw.replace('\\', '/'))
    if not safe_name or safe_name in {'.', '..'}:
        raise ValidationError('Invalid file name.')
    return f'private_documents/{instance.uploaded_by_id}/{safe_name}'


class Document(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, default='')
    file = models.FileField(
        upload_to=document_upload_path,
        storage=PrivateDocumentStorage(location=str(Path(settings.MEDIA_ROOT).resolve())),
        max_length=500,
    )
    original_filename = models.CharField(max_length=255)
    file_size = models.PositiveBigIntegerField()
    file_type = models.CharField(max_length=100, default='unknown')
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='uploaded_documents',
        on_delete=models.CASCADE,
    )
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='owned_documents',
        on_delete=models.CASCADE,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title

    def can_user_access(self, user, require_download=False, require_edit=False):
        if not user or not user.is_authenticated:
            return False
        if user.is_staff or user.role == 'ADMIN':
            return True
        if self.owner_id == user.pk or self.uploaded_by_id == user.pk:
            return True

        grant = self.document_access.filter(user=user).first()
        if grant is None:
            return False
        if require_edit:
            return grant.can_edit or grant.can_download
        if require_download:
            return grant.can_download or grant.can_edit
        return grant.can_view or grant.can_edit

    @property
    def shared_with_count(self):
        return self.document_access.count()


class DocumentAccess(models.Model):
    document = models.ForeignKey(
        Document,
        related_name='document_access',
        on_delete=models.CASCADE,
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='document_access_grants',
        on_delete=models.CASCADE,
    )
    can_view = models.BooleanField(default=True)
    can_download = models.BooleanField(default=True)
    can_edit = models.BooleanField(default=False)
    granted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='granted_document_access',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    granted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('document', 'user')
        ordering = ['-granted_at']

    def __str__(self):
        return f'{self.document.title} -> {self.user.username}'


class AuditLog(models.Model):
    OUTCOME_CHOICES = [
        ('success', 'Success'),
        ('denied', 'Denied'),
        ('failure', 'Failure'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='audit_logs',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    action = models.CharField(max_length=100)
    outcome = models.CharField(max_length=12, choices=OUTCOME_CHOICES, default='success')
    target_model = models.CharField(max_length=50, blank=True, default='')
    target_id = models.PositiveBigIntegerField(null=True, blank=True)
    target_label = models.CharField(max_length=255, blank=True, default='')
    details = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['-created_at']),
            models.Index(fields=['outcome', '-created_at']),
            models.Index(fields=['action', '-created_at']),
        ]

    def __str__(self):
        return f'{self.action} by {self.user or "system"}'
