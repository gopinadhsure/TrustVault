from .models import AuditLog


SAFE_DETAIL_KEYS = {
    'title', 'file_name', 'file_type', 'reason', 'method', 'changed_fields',
    'target_username', 'target_label', 'grant_id', 'can_view', 'can_download',
    'can_edit', 'endpoint',
}


def record_audit_event(
    *,
    action,
    outcome='success',
    request=None,
    actor=None,
    target_model='',
    target_id=None,
    target_label='',
    details=None,
):
    if actor is None and request is not None:
        request_user = getattr(request, 'user', None)
        if request_user is not None and request_user.is_authenticated:
            actor = request_user

    safe_details = {
        key: value
        for key, value in (details or {}).items()
        if key in SAFE_DETAIL_KEYS
    }
    return AuditLog.objects.create(
        user=actor,
        action=action,
        outcome=outcome,
        target_model=target_model,
        target_id=target_id,
        target_label=str(target_label)[:255],
        details=safe_details,
        ip_address=request.META.get('REMOTE_ADDR') if request is not None else None,
    )