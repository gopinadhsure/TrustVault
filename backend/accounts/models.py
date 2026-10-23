from django.contrib.auth.models import AbstractUser
from django.db import models

class CustomUser(AbstractUser):
    ADMIN = 'ADMIN'
    OWNER = 'OWNER'
    VIEWER = 'VIEWER'

    ROLE_CHOICES = [
        (ADMIN, 'Admin'),
        (OWNER, 'Owner'),
        (VIEWER, 'Viewer'),
    ]

    role = models.CharField(
        max_length=10,
        choices=ROLE_CHOICES,
        default=VIEWER
    )

    def __str__(self):
        return f"{self.username} ({self.role})"
