import { apiFetch } from '../api';
import type { DocumentGrant } from '../types';

export const permissionService = {
    async listPermissions(documentId?: number): Promise<DocumentGrant[]> {
        const query = documentId ? `?document=${documentId}` : '';
        const res = await apiFetch(`/grants/${query}`);
        if (!res.ok) {
            if (res.status === 404) return [];
            throw new Error('Failed to fetch permissions.');
        }
        return res.json();
    },

    async grantPermission(data: { document: number; user: number; can_view: boolean; can_download: boolean }): Promise<DocumentGrant> {
        const res = await apiFetch('/grants/', {
            method: 'POST',
            body: JSON.stringify(data),
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.detail || 'Failed to grant permission.');
        }
        return res.json();
    },

    async revokePermission(grantId: number): Promise<void> {
        const res = await apiFetch(`/grants/${grantId}/`, {
            method: 'DELETE',
        });
        if (!res.ok) {
            throw new Error('Failed to revoke permission.');
        }
    }
};
