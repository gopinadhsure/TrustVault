"""
URL configuration for trustvault project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import include, path

from accounts.views import AdminOnlyView, LoginView, LogoutView, MeView
from documents.views import (
    AuditLogListView,
    DocumentAccessDetailView,
    DocumentAccessListCreateView,
    DocumentDetailView,
    DocumentDownloadView,
    DocumentListCreateView,
    DocumentSearchView,
)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/login/', LoginView.as_view(), name='api-login'),
    path('api/logout/', LogoutView.as_view(), name='api-logout'),
    path('api/me/', MeView.as_view(), name='api-me'),
    path('api/admin-only/', AdminOnlyView.as_view(), name='api-admin-only'),
    path('api/auth/login/', LoginView.as_view(), name='api-auth-login'),
    path('api/auth/logout/', LogoutView.as_view(), name='api-auth-logout'),
    path('api/auth/me/', MeView.as_view(), name='api-auth-me'),
    path('api/auth/admin-only/', AdminOnlyView.as_view(), name='api-auth-admin-only'),
    path('api/documents/', DocumentListCreateView.as_view(), name='document-list-create'),
    path('api/documents/search/', DocumentSearchView.as_view(), name='document-search'),
    path('api/documents/<int:pk>/', DocumentDetailView.as_view(), name='document-detail'),
    path('api/documents/<int:pk>/download/', DocumentDownloadView.as_view(), name='document-download'),
    path('api/grants/', DocumentAccessListCreateView.as_view(), name='document-grants-list-create'),
    path('api/grants/<int:pk>/', DocumentAccessDetailView.as_view(), name='document-grant-detail'),
    path('api/audit-logs/', AuditLogListView.as_view(), name='audit-log-list'),
]
