export interface User {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    role: 'ADMIN' | 'OWNER' | 'VIEWER';
    date_joined?: string;
}

export interface DocumentItem {
    id: number;
    title: string;
    description?: string;
    file_name: string;
    file_size: number;
    file_type: string;
    uploaded_by: string;
    owner_id: number;
    created_at: string;
    updated_at: string;
    shared_with_count?: number;
}

export interface DocumentGrant {
    id: number;
    document: number;
    document_title?: string;
    user: number;
    username?: string;
    can_view: boolean;
    can_download: boolean;
    granted_by: string;
    granted_at: string;
}

export interface ActivityLogItem {
    id: number;
    actor: string;
    action: string;
    outcome: 'success' | 'denied' | 'failure';
    target_model: string;
    target_id: number | null;
    target_label: string;
    ip_address?: string;
    details: Record<string, unknown>;
    created_at: string;
}

export interface PaginatedActivityLog {
    count: number;
    next: string | null;
    previous: string | null;
    results: ActivityLogItem[];
}
