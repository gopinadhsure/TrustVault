import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { PageShell } from '../components/PageShell';
import { RoleBadge } from '../components/RoleBadge';
import { userService } from '../services/userService';
import type { User } from '../types';

export const AdminDashboardPage: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        userService.listUsers()
            .then(setUsers)
            .catch((err: any) => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    const handleRoleChange = async (userId: number, newRole: 'ADMIN' | 'OWNER' | 'VIEWER') => {
        try {
            const updated = await userService.updateUserRole(userId, newRole);
            setUsers(users.map(u => u.id === userId ? updated : u));
        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <Layout>
            <PageShell
                title="Administrator Dashboard"
                subtitle="System-wide user accounts and role management."
                loading={loading}
                error={error}
                isEmpty={users.length === 0}
                emptyMessage="No users found in system."
            >
                <div className="tv-card">
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid #334155', color: '#94a3b8', fontSize: '0.85rem' }}>
                                <th style={{ padding: '0.75rem' }}>User ID</th>
                                <th style={{ padding: '0.75rem' }}>Username</th>
                                <th style={{ padding: '0.75rem' }}>Email</th>
                                <th style={{ padding: '0.75rem' }}>Current Role</th>
                                <th style={{ padding: '0.75rem', textAlign: 'right' }}>Change Role</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>#{u.id}</td>
                                    <td style={{ padding: '0.75rem', color: '#38bdf8', fontWeight: 600 }}>{u.username}</td>
                                    <td style={{ padding: '0.75rem', color: '#cbd5e1' }}>{u.email || '—'}</td>
                                    <td style={{ padding: '0.75rem' }}><RoleBadge role={u.role} /></td>
                                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                                        <select
                                            value={u.role}
                                            onChange={(e) => handleRoleChange(u.id, e.target.value as any)}
                                            style={{
                                                background: '#0f172a',
                                                color: '#f8fafc',
                                                border: '1px solid #334155',
                                                borderRadius: '0.4rem',
                                                padding: '0.35rem 0.5rem',
                                                fontSize: '0.85rem',
                                                outline: 'none',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <option value="ADMIN">ADMIN</option>
                                            <option value="OWNER">OWNER</option>
                                            <option value="VIEWER">VIEWER</option>
                                        </select>
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
