import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { PageShell } from '../components/PageShell';
import { documentService } from '../services/documentService';
import type { DocumentItem } from '../types';
import { useAuth } from '../context/AuthContext';

export const DashboardPage: React.FC = () => {
    const { user } = useAuth();
    const [documents, setDocuments] = useState<DocumentItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        documentService.listDocuments()
            .then(setDocuments)
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    const totalDocs = documents.length;
    const myDocs = documents.filter(d => user && d.owner_id === user.id).length;

    return (
        <Layout>
            <PageShell
                title={`Welcome back, ${user?.username || 'User'}!`}
                subtitle="Here is your TrustVault secure document security overview."
                loading={loading}
                error={error}
                action={
                    <Link to="/upload" className="tv-btn tv-btn-primary">
                        + Upload Document
                    </Link>
                }
            >
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
                    <div className="tv-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Total System Documents</span>
                        <span style={{ fontSize: '2.25rem', fontWeight: 700, color: '#38bdf8' }}>{totalDocs}</span>
                    </div>
                    <div className="tv-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>My Uploaded Documents</span>
                        <span style={{ fontSize: '2.25rem', fontWeight: 700, color: '#eab308' }}>{myDocs}</span>
                    </div>
                    <div className="tv-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Security Status</span>
                        <span style={{ fontSize: '1.25rem', fontWeight: 600, color: '#22c55e', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            🟢 Fully Protected
                        </span>
                    </div>
                </div>

                <div className="tv-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#f8fafc', margin: 0 }}>Recent Documents</h2>
                        <Link to="/documents" style={{ color: '#38bdf8', fontSize: '0.875rem', textDecoration: 'none' }}>View All →</Link>
                    </div>

                    {documents.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                            No documents uploaded yet. <Link to="/upload" style={{ color: '#38bdf8' }}>Upload your first document</Link>
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid #334155', color: '#94a3b8', fontSize: '0.85rem' }}>
                                        <th style={{ padding: '0.75rem' }}>Title</th>
                                        <th style={{ padding: '0.75rem' }}>File Name</th>
                                        <th style={{ padding: '0.75rem' }}>Uploaded By</th>
                                        <th style={{ padding: '0.75rem' }}>Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {documents.slice(0, 5).map(doc => (
                                        <tr key={doc.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <td style={{ padding: '0.75rem' }}>
                                                <Link to={`/documents/${doc.id}`} style={{ color: '#38bdf8', textDecoration: 'none', fontWeight: 500 }}>
                                                    {doc.title}
                                                </Link>
                                            </td>
                                            <td style={{ padding: '0.75rem', color: '#cbd5e1', fontSize: '0.9rem' }}>{doc.file_name}</td>
                                            <td style={{ padding: '0.75rem', color: '#cbd5e1', fontSize: '0.9rem' }}>{doc.uploaded_by}</td>
                                            <td style={{ padding: '0.75rem', color: '#94a3b8', fontSize: '0.85rem' }}>{new Date(doc.created_at).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </PageShell>
        </Layout>
    );
};
