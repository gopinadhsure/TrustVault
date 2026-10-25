from django.core.exceptions import ValidationError
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import CustomUser
from documents.models import AuditLog, Document, DocumentAccess, PrivateDocumentStorage, document_upload_path
from documents.serializers import DocumentUploadSerializer


class DocumentAPITests(APITestCase):
    def setUp(self):
        self.owner = CustomUser.objects.create_user(
            username='owner',
            email='owner@example.com',
            password='StrongPass123!',
            role='OWNER',
        )
        self.viewer = CustomUser.objects.create_user(
            username='viewer',
            email='viewer@example.com',
            password='StrongPass123!',
            role='VIEWER',
        )
        self.admin = CustomUser.objects.create_user(
            username='admin',
            email='admin@example.com',
            password='StrongPass123!',
            role='ADMIN',
        )
        self.client.force_authenticate(user=self.owner)

    def _upload(self, *, filename='sample.txt', content='hello world', content_type='text/plain', title='Test Document'):
        uploaded = SimpleUploadedFile(filename, content.encode('utf-8'), content_type=content_type)
        return self.client.post(
            reverse('document-list-create'),
            {'title': title, 'description': 'Example file', 'file': uploaded},
            format='multipart',
        )

    def test_upload_valid_file(self):
        response = self._upload()
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Document.objects.count(), 1)
        self.assertEqual(response.data['file_name'], 'sample.txt')
        event = AuditLog.objects.get(action='document_uploaded')
        self.assertEqual(event.outcome, 'success')
        self.assertEqual(event.target_id, response.data['id'])
        self.assertNotIn('hello world', str(event.details))

    def test_upload_invalid_extension_is_rejected(self):
        response = self._upload(filename='sample.exe', content='evil')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Unsupported file type', str(response.data))
        self.assertTrue(AuditLog.objects.filter(action='document_upload', outcome='failure').exists())

    def test_upload_path_traversal_is_rejected(self):
        def upload_with_original_name(filename):
            uploaded = SimpleUploadedFile('safe.txt', b'content', 'text/plain')
            # Preserve the raw name to exercise validation before Django sanitizes it.
            uploaded._name = filename
            return uploaded

        # 1. API endpoint rejects path traversal / invalid filenames like '..'
        uploaded_dotdot = upload_with_original_name('..')
        response = self.client.post(
            reverse('document-list-create'),
            {'title': 'bad', 'file': uploaded_dotdot},
            format='multipart',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # 2. Serializer validation rejects path traversal filenames directly
        for bad_name in ['../../etc/passwd.txt', r'..\..\windows\win.ini', '/etc/passwd.txt', 'sub/dir.txt']:
            bad_upload = upload_with_original_name(bad_name)
            serializer = DocumentUploadSerializer(data={'title': 'bad', 'file': bad_upload})
            self.assertFalse(serializer.is_valid(), f"Expected {bad_name} to be invalid in serializer")
            self.assertIn('file', serializer.errors)

        # 3. Model upload path and storage validate against path traversal
        with self.assertRaises(ValidationError):
            document_upload_path(Document(uploaded_by=self.owner), '../../etc/passwd.txt')
        with self.assertRaises(ValidationError):
            document_upload_path(Document(uploaded_by=self.owner), r'..\..\win.ini')
        with self.assertRaises(ValidationError):
            document_upload_path(Document(uploaded_by=self.owner), '/absolute/path.txt')

        storage = PrivateDocumentStorage()
        with self.assertRaises(ValidationError):
            storage.get_valid_name('../../etc/passwd.txt')
        with self.assertRaises(ValidationError):
            storage.get_valid_name(r'..\..\windows\win.ini')
        with self.assertRaises(ValidationError):
            storage.get_available_name('private_documents/../etc/passwd.txt')
        with self.assertRaises(ValidationError):
            storage.get_available_name('/absolute/path.txt')

    def test_upload_duplicate_filenames(self):
        resp1 = self._upload(filename='report.pdf', title='Report 1', content_type='application/pdf')
        resp2 = self._upload(filename='report.pdf', title='Report 2', content_type='application/pdf')
        self.assertEqual(resp1.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp2.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Document.objects.count(), 2)
        doc1 = Document.objects.get(pk=resp1.data['id'])
        doc2 = Document.objects.get(pk=resp2.data['id'])
        self.assertNotEqual(doc1.file.name, doc2.file.name)
        self.assertEqual(doc1.original_filename, 'report.pdf')
        self.assertEqual(doc2.original_filename, 'report.pdf')

    def test_shared_user_can_list_document(self):
        upload_response = self._upload(title='Shared Doc')
        document_id = upload_response.data['id']
        self.client.force_authenticate(user=self.viewer)
        response = self.client.get(reverse('document-list-create'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)

        self.client.force_authenticate(user=self.owner)
        self.client.post(
            reverse('document-grants-list-create'),
            {'document': document_id, 'user': self.viewer.pk, 'can_view': True, 'can_download': True},
            format='json',
        )

        self.client.force_authenticate(user=self.viewer)
        response = self.client.get(reverse('document-list-create'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)

    def test_private_download_requires_permission(self):
        upload_response = self._upload(title='Secure Doc')
        document_id = upload_response.data['id']
        self.client.force_authenticate(user=self.viewer)
        response = self.client.get(reverse('document-download', kwargs={'pk': document_id}))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(user=self.owner)
        self.client.post(
            reverse('document-grants-list-create'),
            {'document': document_id, 'user': self.viewer.pk, 'can_view': True, 'can_download': True},
            format='json',
        )

        self.client.force_authenticate(user=self.viewer)
        response = self.client.get(reverse('document-download', kwargs={'pk': document_id}))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        response_bytes = b''.join(response.streaming_content)
        self.assertIn(b'hello world', response_bytes)
        self.assertTrue(AuditLog.objects.filter(action='document_download', outcome='denied').exists())
        self.assertTrue(AuditLog.objects.filter(action='document_downloaded', outcome='success').exists())

    def test_document_view_is_audited(self):
        upload_response = self._upload(title='Viewed Doc')
        response = self.client.get(reverse('document-detail', kwargs={'pk': upload_response.data['id']}))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(AuditLog.objects.filter(
            action='document_viewed',
            outcome='success',
            target_id=upload_response.data['id'],
        ).exists())

    def test_permission_changes_and_revocations_are_audited(self):
        upload_response = self._upload(title='Grant Changes')
        grant_response = self.client.post(
            reverse('document-grants-list-create'),
            {'document': upload_response.data['id'], 'user': self.viewer.pk, 'can_view': True, 'can_download': False},
            format='json',
        )
        self.assertEqual(grant_response.status_code, status.HTTP_201_CREATED)
        grant_id = grant_response.data['id']

        update_response = self.client.patch(
            reverse('document-grant-detail', kwargs={'pk': grant_id}),
            {'can_download': True, 'can_edit': True},
            format='json',
        )
        self.assertEqual(update_response.status_code, status.HTTP_200_OK)
        grant = DocumentAccess.objects.get(pk=grant_id)
        self.assertTrue(grant.can_edit)
        self.assertTrue(grant.can_view)
        self.assertTrue(AuditLog.objects.filter(action='document_permission_changed', outcome='success').exists())

        revoke_response = self.client.delete(reverse('document-grant-detail', kwargs={'pk': grant_id}))
        self.assertEqual(revoke_response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertTrue(AuditLog.objects.filter(action='document_permission_revoked', outcome='success').exists())

    def test_audit_logs_are_admin_only_paginated_and_filterable(self):
        response = self.client.get(reverse('audit-log-list'))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(AuditLog.objects.filter(action='audit_log_access', outcome='denied').exists())

        for _ in range(30):
            AuditLog.objects.create(
                user=self.owner,
                action='pagination_probe',
                outcome='denied',
                target_model='document',
                target_id=71,
                target_label='Test target',
            )

        self.client.force_authenticate(user=self.admin)
        page = self.client.get(reverse('audit-log-list'), {'action': 'pagination_probe', 'page_size': 10})
        self.assertEqual(page.status_code, status.HTTP_200_OK)
        self.assertEqual(page.data['count'], 30)
        self.assertEqual(len(page.data['results']), 10)
        self.assertIsNotNone(page.data['next'])

        filtered = self.client.get(reverse('audit-log-list'), {
            'action': 'pagination_probe',
            'outcome': 'denied',
            'actor': 'owner',
            'target_id': '71',
        })
        self.assertEqual(filtered.status_code, status.HTTP_200_OK)
        self.assertEqual(filtered.data['count'], 30)

    def test_audit_api_is_read_only(self):
        self.client.force_authenticate(user=self.admin)
        post_response = self.client.post(reverse('audit-log-list'), {'action': 'forged'}, format='json')
        self.assertEqual(post_response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_owner_can_delete_document(self):
        response = self._upload(title='Delete Me')
        self.client.delete(reverse('document-detail', kwargs={'pk': response.data['id']}))
        self.assertEqual(Document.objects.filter(is_deleted=False).count(), 0)
