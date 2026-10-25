from django.contrib.auth import get_user_model, login, logout
from rest_framework import status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from documents.audit import record_audit_event
from .serializers import LoginSerializer, UserSerializer, UserUpdateSerializer
from .permissions import IsAdminRole

User = get_user_model()

class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            user = serializer.validated_data['user']
            login(request, user)
            record_audit_event(
                request=request,
                actor=user,
                action='authentication_login',
                target_model='user',
                target_id=user.pk,
                target_label=user.username,
            )
            return Response(UserSerializer(user).data, status=status.HTTP_200_OK)
        username = request.data.get('username')
        known_user = User.objects.filter(username__iexact=username).first() if isinstance(username, str) else None
        record_audit_event(
            request=request,
            actor=known_user,
            action='authentication_login',
            outcome='failure',
            target_model='user',
            target_id=known_user.pk if known_user else None,
            target_label=known_user.username if known_user else '',
            details={'reason': 'invalid_credentials'},
        )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        record_audit_event(
            request=request,
            action='authentication_logout',
            target_model='user',
            target_id=request.user.pk,
            target_label=request.user.username,
        )
        logout(request)
        return Response({'detail': 'Successfully logged out.'}, status=status.HTTP_200_OK)

class MeView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return UserUpdateSerializer
        return UserSerializer

class AdminOnlyView(APIView):
    permission_classes = [IsAdminRole]

    def get(self, request):
        return Response({'message': 'Welcome Admin! Administrative data accessed successfully.'})
