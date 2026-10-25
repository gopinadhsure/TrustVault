import os
from pathlib import Path
from pathlib import PurePosixPath

from django.conf import settings
from rest_framework import serializers

from .models import AuditLog, Document, DocumentAccess

ALLOWED_EXTENSIONS = {
    'pdf', 'txt', 'doc', 'docx', 'csv', 'xls', 'xlsx', 'png', 'jpg', 'jpeg', 'gif',
    'ppt', 'pptx', 'zip', 'rar', 'mp3', 'mp4', 'webm', 'mov'
}


def validate_document_file(value):
    if value is None:
        raise serializers.ValidationError('A file is required.')

    normalized_name = value.name.replace('\\', '/')
    if normalized_name.startswith('/') or normalized_name.startswith('..') or '/' in normalized_name:
        raise serializers.ValidationError('Path separators are not allowed in file names.')
    if any(part == '..' for part in PurePosixPath(normalized_name).parts):
        raise serializers.ValidationError('Path traversal is not allowed in file names.')

    name = os.path.basename(normalized_name)
    if not name or name in {'.', '..'}:
        raise serializers.ValidationError('Invalid file name.')
    if '\\' in value.name or name != normalized_name:
        raise serializers.ValidationError('Path separators are not allowed in file names.')

    extension = Path(name).suffix.lower().lstrip('.')
    if extension not in ALLOWED_EXTENSIONS:
        raise serializers.ValidationError(
            'Unsupported file type. Allowed types: ' + ', '.join(sorted(ALLOWED_EXTENSIONS))
        )

    max_size = int(getattr(settings, 'MAX_DOCUMENT_UPLOAD_SIZE', 10 * 1024 * 1024))
    if value.size > max_size:
        raise serializers.ValidationError(
            f'File exceeds the {max_size / (1024 * 1024):.0f} MB size limit.'
        )

    allowed_content_types = {
        'pdf': {'application/pdf'},
        'txt': {'text/plain'},
        'csv': {'text/csv', 'application/csv'},
        'png': {'image/png'},
        'jpg': {'image/jpeg'},
        'jpeg': {'image/jpeg'},
        'gif': {'image/gif'},
        'zip': {'application/zip'},
        'mp4': {'video/mp4'},
        'mp3': {'audio/mpeg'},
    }
    if extension in allowed_content_types and value.content_type and value.content_type not in allowed_content_types[extension]:
        raise serializers.ValidationError('File content type does not match the uploaded file extension.')

    return value


class DocumentSerializer(serializers.ModelSerializer):
    uploaded_by = serializers.CharField(source='uploaded_by.username', read_only=True)
    owner_id = serializers.IntegerField(read_only=True)
    file_name = serializers.CharField(source='original_filename', read_only=True)
    shared_with_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Document
        fields = [
            'id', 'title', 'description', 'file_name', 'file_size', 'file_type',
            'uploaded_by', 'owner_id', 'created_at', 'updated_at', 'shared_with_count'
        ]
        read_only_fields = fields


class DocumentUploadSerializer(serializers.ModelSerializer):
    file = serializers.FileField(write_only=True)

    class Meta:
        model = Document
        fields = ('id', 'title', 'description', 'file')
        read_only_fields = ('id',)

    def to_representation(self, instance):
        return DocumentSerializer(instance, context=self.context).data

    def validate_title(self, value):
        cleaned = value.strip()
        if not cleaned:
            raise serializers.ValidationError('Document title is required.')
        if len(cleaned) > 200:
            raise serializers.ValidationError('Title must be 200 characters or fewer.')
        return cleaned

    def validate_file(self, value):
        return validate_document_file(value)

    def create(self, validated_data):
        request = self.context['request']
        file_obj = validated_data.pop('file')
        document = Document.objects.create(
            title=validated_data['title'],
            description=validated_data.get('description', ''),
            file=file_obj,
            original_filename=os.path.basename(file_obj.name.replace('\\', '/')),
            file_size=file_obj.size,
            file_type=Path(file_obj.name).suffix.lower().lstrip('.') or 'unknown',
            uploaded_by=request.user,
            owner=request.user,
        )
        return document


class DocumentUpdateSerializer(serializers.ModelSerializer):
    file = serializers.FileField(required=False, write_only=True)

    class Meta:
        model = Document
        fields = ('title', 'description', 'file')

    def validate_title(self, value):
        cleaned = value.strip()
        if not cleaned:
            raise serializers.ValidationError('Document title is required.')
        return cleaned

    def validate_file(self, value):
        return validate_document_file(value)

    def update(self, instance, validated_data):
        new_file = validated_data.pop('file', None)
        old_file = instance.file if new_file is not None else None
        for attribute, value in validated_data.items():
            setattr(instance, attribute, value)
        if new_file is not None:
            instance.original_filename = os.path.basename(new_file.name)
            instance.file_size = new_file.size
            instance.file_type = Path(new_file.name).suffix.lower().lstrip('.') or 'unknown'
            instance.file = new_file
        instance.save()
        if old_file is not None:
            old_file.delete(save=False)
        return instance


class DocumentAccessSerializer(serializers.ModelSerializer):
    document_title = serializers.SerializerMethodField()
    username = serializers.SerializerMethodField()
    can_edit = serializers.BooleanField(required=False, default=False)

    class Meta:
        model = DocumentAccess
        fields = (
            'id', 'document', 'document_title', 'user', 'username',
            'can_view', 'can_download', 'can_edit', 'granted_by', 'granted_at'
        )
        read_only_fields = ('id', 'granted_by', 'granted_at', 'document_title', 'username')

    def get_document_title(self, obj):
        return obj.document.title

    def get_username(self, obj):
        return obj.user.username

    def validate(self, data):
        request = self.context.get('request')
        user = data.get('user')
        document = data.get('document')
        if request and user and document and user == document.owner:
            raise serializers.ValidationError('The document owner already has implicit access.')
        return data


class AuditLogSerializer(serializers.ModelSerializer):
    actor = serializers.SerializerMethodField()

    class Meta:
        model = AuditLog
        fields = (
            'id', 'actor', 'action', 'outcome', 'target_model', 'target_id',
            'target_label', 'details', 'ip_address', 'created_at',
        )
        read_only_fields = fields

    def get_actor(self, obj):
        return obj.user.username if obj.user else 'Anonymous'
