import React, { FormEvent, useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { PageShell } from '../components/PageShell';
import { activityService } from '../services/activityService';
import type { ActivityFilters } from '../services/activityService';
import type { PaginatedActivityLog } from '../types';

export const ActivityLogPage: React.FC = () => {
    const [activity, setActivity] = useState<PaginatedActivityLog>({
        count: 0,
        next: null,
        previous: null,
        results: [],
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [filters, setFilters] = useState<ActivityFilters>({});
    const [filterDraft, setFilterDraft] = useState<ActivityFilters>({});

    useEffect(() => {
        let active = true;
        setLoading(true);
        setError(null);
        activityService.listActivities(page, filters)
            .then((result) => {
                if (active) setActivity(result);
            })
            .catch((err: unknown) => {
                if (active) setError(err instanceof Error ? err.message : 'Failed to fetch activity logs.');
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => { active = false; };
    }, [page, filters]);

    const applyFilters = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setPage(1);
        setFilters({ ...filterDraft });
    };

    const clearFilters = () => {
        setFilterDraft({});
        setPage(1);
        setFilters({});
    };

    const retry = () => {
        setError(null);
        setLoading(true);
        activityService.listActivities(page, filters)
            .then(setActivity)
            .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to fetch activity logs.'))
            .finally(() => setLoading(false));
    };

    return (
        <Layout>
            <PageShell
                title="Audit Activity"
                subtitle="Administrative record of document, permission, and authentication events."
                loading={loading}
                error={error}
                isEmpty={!loading && activity.results.length === 0}
                emptyMessage="No events match these filters."
            >
                {error && (
                    <div className="audit-retry-row">
                        <button className="tv-btn tv-btn-secondary" onClick={retry} type="button">Retry</button>
                    </div>
                )}
                <form className="audit-filters" onSubmit={applyFilters}>
                    <label>
                        <span>Action</span>
                        <select value={filterDraft.action || ''} onChange={(event) => setFilterDraft({ ...filterDraft, action: event.target.value })}>
                            <option value="">All actions</option>
                            <option value="document_uploaded">Upload</option>
                            <option value="document_viewed">Document view</option>
                            <option value="document_downloaded">Download</option>
                            <option value="document_metadata_updated">Metadata edit</option>
                            <option value="document_file_replaced">File replacement</option>
                            <option value="document_deleted">Deletion</option>
                            <option value="document_permission_granted">Permission grant</option>
                            <option value="document_permission_changed">Permission change</option>
                            <option value="document_permission_revoked">Permission revocation</option>
                            <option value="authentication_login">Login</option>
                            <option value="authentication_logout">Logout</option>
                        </select>
                    </label>
                    <label>
                        <span>Outcome</span>
                        <select value={filterDraft.outcome || ''} onChange={(event) => setFilterDraft({ ...filterDraft, outcome: event.target.value })}>
                            <option value="">All outcomes</option>
                            <option value="success">Success</option>
                            <option value="denied">Denied</option>
                            <option value="failure">Failure</option>
                        </select>
                    </label>
                    <label>
                        <span>Actor</span>
                        <input value={filterDraft.actor || ''} onChange={(event) => setFilterDraft({ ...filterDraft, actor: event.target.value })} placeholder="Username" />
                    </label>
                    <label>
                        <span>Target ID</span>
                        <input inputMode="numeric" value={filterDraft.target_id || ''} onChange={(event) => setFilterDraft({ ...filterDraft, target_id: event.target.value })} placeholder="Document or user ID" />
                    </label>
                    <div className="audit-filter-actions">
                        <button className="tv-btn tv-btn-primary" type="submit">Apply</button>
                        <button className="tv-btn tv-btn-secondary" type="button" onClick={clearFilters}>Clear</button>
                    </div>
                </form>
                <div className="tv-card audit-table-wrap">
                    <table className="audit-table">
                        <thead>
                            <tr>
                                <th>Actor</th>
                                <th>Action</th>
                                <th>Target</th>
                                <th>Date and time</th>
                                <th>Outcome</th>
                            </tr>
                        </thead>
                        <tbody>
                            {activity.results.map((event) => (
                                <tr key={event.id}>
                                    <td>{event.actor}</td>
                                    <td>{event.action.replaceAll('_', ' ')}</td>
                                    <td>
                                        <span>{event.target_label || event.target_model || '—'}</span>
                                        {event.target_id !== null && <small>{event.target_model} #{event.target_id}</small>}
                                    </td>
                                    <td>{new Date(event.created_at).toLocaleString()}</td>
                                    <td><span className={`audit-outcome audit-outcome-${event.outcome}`}>{event.outcome}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="audit-pagination" aria-label="Audit event pagination">
                    <span>{activity.count} event{activity.count === 1 ? '' : 's'}</span>
                    <div>
                        <button className="tv-btn tv-btn-secondary" type="button" disabled={!activity.previous || loading} onClick={() => setPage((current) => Math.max(1, current - 1))}>Previous</button>
                        <span>Page {page}</span>
                        <button className="tv-btn tv-btn-secondary" type="button" disabled={!activity.next || loading} onClick={() => setPage((current) => current + 1)}>Next</button>
                    </div>
                </div>
            </PageShell>
        </Layout>
    );
};
