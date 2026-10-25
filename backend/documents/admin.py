from django.contrib import admin

from .models import AuditLog, Document, DocumentAccess

admin.site.register(Document)
admin.site.register(DocumentAccess)


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
	list_display = ('created_at', 'user', 'action', 'outcome', 'target_model', 'target_id')
	list_filter = ('outcome', 'action', 'target_model')
	search_fields = ('user__username', 'target_label')
	readonly_fields = (
		'user', 'action', 'outcome', 'target_model', 'target_id', 'target_label',
		'details', 'ip_address', 'created_at',
	)
	ordering = ('-created_at',)

	def has_add_permission(self, request):
		return False

	def has_change_permission(self, request, obj=None):
		return False

	def has_delete_permission(self, request, obj=None):
		return False
