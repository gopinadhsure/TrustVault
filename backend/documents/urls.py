from django.urls import path

from .views import (
    AuditLogListView,
    DocumentAccessDetailView,
    DocumentAccessListCreateView,
    DocumentDetailView,
    DocumentDownloadView,
    DocumentListCreateView,
    DocumentSearchView,
)

urlpatterns = [
    path('documents/', DocumentListCreateView.as_view(), name='document-list-create'),
    path('documents/search/', DocumentSearchView.as_view(), name='document-search'),
    path('documents/<int:pk>/', DocumentDetailView.as_view(), name='document-detail'),
    path('documents/<int:pk>/download/', DocumentDownloadView.as_view(), name='document-download'),
    path('grants/', DocumentAccessListCreateView.as_view(), name='document-grants-list-create'),
    path('grants/<int:pk>/', DocumentAccessDetailView.as_view(), name='document-grant-detail'),
    path('audit-logs/', AuditLogListView.as_view(), name='audit-log-list'),
]
