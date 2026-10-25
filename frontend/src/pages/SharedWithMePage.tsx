import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { PageShell } from '../components/PageShell';
import { permissionService } from '../services/permissionService';
import type { DocumentGrant } from '../types';

export const SharedWithMePage: React.FC = () => {
    const [grants, setGrants] = useState<DocumentGrant[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        permissionService.listPermissions()
            .then(setGrants)
            .catch((err: any) => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    return (
        <Layout>
            <PageShell
                title="Shared With Me"
                subtitle="Documents that other users have granted you permission to view or download."
                loading={loading}
                error={error}
                isEmpty={grants.length === 0}
                emptyMessage="No documents have been shared with you yet."
            >
                <div className="tv-card">
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid #334155', color: '#94a3b8', fontSize: '0.85rem' }}>
                                <th style={{ padding: '0.75rem' }}>Document ID</th>
                                <th style={{ padding: '0.75rem' }}>Can View</th>
                                <th style={{ padding: '0.75rem' }}>Can Download</th>
                                <th style={{ padding: '0.75rem' }}>Granted By</th>
                                <th style={{ padding: '0.75rem' }}>Granted At</th>
                            </tr>
                        </thead>
                        <tbody>
                            {grants.map(grant => (
                                <tr key={grant.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding: '0.75rem', color: '#38bdf8', fontWeight: 600 }}>#{grant.document}</td>
                                    <td style={{ padding: '0.75rem', color: grant.can_view ? '#22c55e' : '#ef4444' }}>{grant.can_view ? 'Yes' : 'No'}</td>
                                    <td style={{ padding: '0.75rem', color: grant.can_download ? '#22c55e' : '#ef4444' }}>{grant.can_download ? 'Yes' : 'No'}</td>
                                    <td style={{ padding: '0.75rem', color: '#cbd5e1' }}>{grant.granted_by || 'Admin'}</td>
                                    <td style={{ padding: '0.75rem', color: '#94a3b8', fontSize: '0.85rem' }}>{new Date(grant.granted_at).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </PageShell>
        </Layout>
    );
};
