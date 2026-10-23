from django.urls import path
from .views import LoginView, LogoutView, MeView, AdminOnlyView

urlpatterns = [
    path('login/', LoginView.as_view(), name='api-login'),
    path('logout/', LogoutView.as_view(), name='api-logout'),
    path('me/', MeView.as_view(), name='api-me'),
    path('admin-only/', AdminOnlyView.as_view(), name='api-admin-only'),
]
