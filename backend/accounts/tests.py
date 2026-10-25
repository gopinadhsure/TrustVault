from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from accounts.models import CustomUser
from documents.models import AuditLog

class AuthenticationAndRolesTests(APITestCase):

    def setUp(self):
        # Create users with different roles
        self.admin_user = CustomUser.objects.create_user(
            username='adminuser',
            email='admin@trustvault.local',
            password='SecurePassword123!',
            role='ADMIN'
        )
        self.owner_user = CustomUser.objects.create_user(
            username='owneruser',
            email='owner@trustvault.local',
            password='SecurePassword123!',
            role='OWNER'
        )
        self.viewer_user = CustomUser.objects.create_user(
            username='vieweruser',
            email='viewer@trustvault.local',
            password='SecurePassword123!',
            role='VIEWER'
        )
        self.login_url = reverse('api-login')
        self.logout_url = reverse('api-logout')
        self.me_url = reverse('api-me')
        self.admin_only_url = reverse('api-admin-only')

    def test_login_success(self):
        """Test successful login with correct credentials."""
        response = self.client.post(self.login_url, {
            'username': 'adminuser',
            'password': 'SecurePassword123!'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'adminuser')
        self.assertEqual(response.data['role'], 'ADMIN')
        event = AuditLog.objects.get(action='authentication_login', outcome='success')
        self.assertEqual(event.user, self.admin_user)

    def test_login_wrong_password(self):
        """Test login failure with incorrect password."""
        response = self.client.post(self.login_url, {
            'username': 'adminuser',
            'password': 'WrongPassword123!'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        event = AuditLog.objects.get(action='authentication_login', outcome='failure')
        self.assertEqual(event.user, self.admin_user)
        self.assertNotIn('WrongPassword123!', str(event.details))

    def test_login_missing_fields(self):
        """Test login failure with missing username/password."""
        response = self.client.post(self.login_url, {
            'username': 'adminuser'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_me_unauthenticated(self):
        """Test accessing /me/ without being logged in returns 401."""
        response = self.client.get(self.me_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN) # DRF IsAuthenticated defaults to 403 or 401 depending on auth class

    def test_me_authenticated(self):
        """Test accessing /me/ after logging in returns user profile with role."""
        self.client.login(username='owneruser', password='SecurePassword123!')
        response = self.client.get(self.me_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'owneruser')
        self.assertEqual(response.data['role'], 'OWNER')

    def test_logout(self):
        """Test successful logout clears session."""
        self.client.login(username='vieweruser', password='SecurePassword123!')
        response = self.client.post(self.logout_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(AuditLog.objects.filter(action='authentication_logout', outcome='success').exists())
        
        # Verify /me/ is no longer accessible
        response_me = self.client.get(self.me_url)
        self.assertNotEqual(response_me.status_code, status.HTTP_200_OK)

    def test_admin_role_restriction_success(self):
        """Test ADMIN user can access admin-only endpoint."""
        self.client.login(username='adminuser', password='SecurePassword123!')
        response = self.client.get(self.admin_only_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_admin_role_restriction_forbidden_for_viewer(self):
        """Test VIEWER user receives 403 Forbidden when accessing admin-only endpoint."""
        self.client.login(username='vieweruser', password='SecurePassword123!')
        response = self.client.get(self.admin_only_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_privilege_escalation_prevention(self):
        """Test user cannot change their own role to ADMIN via PATCH/PUT to /me/."""
        self.client.login(username='vieweruser', password='SecurePassword123!')
        response = self.client.patch(self.me_url, {
            'role': 'ADMIN'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify role remains VIEWER
        self.viewer_user.refresh_from_db()
        self.assertEqual(self.viewer_user.role, 'VIEWER')
