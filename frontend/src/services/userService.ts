import { apiFetch } from '../api';
import type { User } from '../types';

export const userService = {
    async listUsers(): Promise<User[]> {
        const res = await apiFetch('/users/');
        if (!res.ok) {
            if (res.status === 404) return [];
            throw new Error('Failed to fetch users.');
        }
        return res.json();
    },

    async updateUserRole(userId: number, role: 'ADMIN' | 'OWNER' | 'VIEWER'): Promise<User> {
        const res = await apiFetch(`/users/${userId}/`, {
            method: 'PATCH',
            body: JSON.stringify({ role }),
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.detail || 'Failed to update user role.');
        }
        return res.json();
    }
};
