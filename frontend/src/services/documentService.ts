import { apiFetch } from '../api';
import type { DocumentItem } from '../types';

export const documentService = {
    async listDocuments(): Promise<DocumentItem[]> {
        const res = await apiFetch('/documents/');
        if (!res.ok) {
            if (res.status === 404) return [];
            throw new Error('Failed to fetch documents.');
        }
        return res.json();
    },

    async getDocument(id: number): Promise<DocumentItem> {
        const res = await apiFetch(`/documents/${id}/`);
        if (!res.ok) {
            throw new Error('Failed to fetch document details.');
        }
        return res.json();
    },

    async uploadDocument(formData: FormData): Promise<DocumentItem> {
        const res = await apiFetch('/documents/', {
            method: 'POST',
            body: formData,
            headers: {},
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.detail || 'Failed to upload document.');
        }
        return res.json();
    },

    async deleteDocument(id: number): Promise<void> {
        const res = await apiFetch(`/documents/${id}/`, {
            method: 'DELETE',
        });
        if (!res.ok) {
            throw new Error('Failed to delete document.');
        }
    }
};
