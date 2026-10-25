import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { PageShell } from '../components/PageShell';
import { permissionService } from '../services/permissionService';
import type { DocumentGrant } from '../types';

export const PermissionsPage: React.FC = () => {
    const [grants, setGrants] = useState<DocumentGrant[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        permissionService.listPermissions()
            .then(setGrants)
            .catch((err: any) => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    const handleRevoke = async (id: number) => {
        if (!window.confirm('Are you sure you want to revoke this permission?')) return;
        try {
            await permissionService.revokePermission(id);
            setGrants(grants.filter(g => g.id !== id));
        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <Layout>
            <PageShell
                title="Granular Permission Management"
                subtitle="Manage document access grants across users and roles."
                loading={loading}
                error={error}
                isEmpty={grants.length === 0}
                emptyMessage="No active permission grants found."
            >
                <div className="tv-card">
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid #334155', color: '#94a3b8', fontSize: '0.85rem' }}>
                                <th style={{ padding: '0.75rem' }}>Grant ID</th>
                                <th style={{ padding: '0.75rem' }}>Document ID</th>
                                <th style={{ padding: '0.75rem' }}>User ID</th>
                                <th style={{ padding: '0.75rem' }}>Can View</th>
                                <th style={{ padding: '0.75rem' }}>Can Download</th>
                                <th style={{ padding: '0.75rem', textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {grants.map(grant => (
                                <tr key={grant.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding: '0.75rem', color: '#f8fafc', fontWeight: 600 }}>#{grant.id}</td>
                                    <td style={{ padding: '0.75rem', color: '#38bdf8' }}>#{grant.document}</td>
                                    <td style={{ padding: '0.75rem', color: '#cbd5e1' }}>User #{grant.user}</td>
                                    <td style={{ padding: '0.75rem', color: grant.can_view ? '#22c55e' : '#ef4444' }}>{grant.can_view ? 'Yes' : 'No'}</td>
                                    <td style={{ padding: '0.75rem', color: grant.can_download ? '#22c55e' : '#ef4444' }}>{grant.can_download ? 'Yes' : 'No'}</td>
                                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                                        <button
                                            onClick={() => handleRevoke(grant.id)}
                                            className="tv-btn tv-btn-danger"
                                            style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                                        >
                                            Revoke
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </PageShell>
        </Layout>
    );
};
