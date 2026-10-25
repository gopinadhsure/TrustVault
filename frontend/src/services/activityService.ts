import { apiFetch } from '../api';
import type { PaginatedActivityLog } from '../types';

export interface ActivityFilters {
    action?: string;
    outcome?: string;
    actor?: string;
    target_id?: string;
}

export const activityService = {
    async listActivities(page: number, filters: ActivityFilters): Promise<PaginatedActivityLog> {
        const params = new URLSearchParams({ page: String(page) });
        Object.entries(filters).forEach(([key, value]) => {
            if (value) params.set(key, value);
        });
        const res = await apiFetch(`/audit-logs/?${params.toString()}`);
        if (!res.ok) {
            throw new Error('Failed to fetch activity logs.');
        }
        return res.json();
    }
};
