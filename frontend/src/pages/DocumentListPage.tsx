import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { PageShell } from '../components/PageShell';
import { documentService } from '../services/documentService';
import type { DocumentItem } from '../types';

export const DocumentListPage: React.FC = () => {
    const [documents, setDocuments] = useState<DocumentItem[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        documentService.listDocuments()
            .then(setDocuments)
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    const filtered = documents.filter(d =>
        d.title.toLowerCase().includes(search.toLowerCase()) ||
        d.file_name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <Layout>
            <PageShell
                title="All Documents"
                subtitle="Browse and search all secure documents stored in TrustVault."
                loading={loading}
                error={error}
                isEmpty={filtered.length === 0}
                emptyMessage="No documents found matching your search."
                action={
                    <Link to="/upload" className="tv-btn tv-btn-primary">
                        + Upload New
                    </Link>
                }
            >
                <div style={{ marginBottom: '1.5rem' }}>
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by title or file name..."
                        className="tv-input"
                        style={{ maxWidth: '400px' }}
                    />
                </div>

                <div className="tv-card">
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid #334155', color: '#94a3b8', fontSize: '0.85rem' }}>
                                <th style={{ padding: '0.75rem' }}>Title</th>
                                <th style={{ padding: '0.75rem' }}>File Name</th>
                                <th style={{ padding: '0.75rem' }}>Size</th>
                                <th style={{ padding: '0.75rem' }}>Uploaded By</th>
                                <th style={{ padding: '0.75rem' }}>Date</th>
                                <th style={{ padding: '0.75rem', textAlign: 'right' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(doc => (
                                <tr key={doc.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding: '0.75rem' }}>
                                        <Link to={`/documents/${doc.id}`} style={{ color: '#38bdf8', textDecoration: 'none', fontWeight: 600 }}>
                                            {doc.title}
                                        </Link>
                                    </td>
                                    <td style={{ padding: '0.75rem', color: '#cbd5e1', fontSize: '0.9rem' }}>{doc.file_name}</td>
                                    <td style={{ padding: '0.75rem', color: '#94a3b8', fontSize: '0.85rem' }}>{(doc.file_size / 1024).toFixed(1)} KB</td>
                                    <td style={{ padding: '0.75rem', color: '#cbd5e1', fontSize: '0.9rem' }}>{doc.uploaded_by}</td>
                                    <td style={{ padding: '0.75rem', color: '#94a3b8', fontSize: '0.85rem' }}>{new Date(doc.created_at).toLocaleDateString()}</td>
                                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                                        <Link to={`/documents/${doc.id}`} className="tv-btn tv-btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>
                                            View
                                        </Link>
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
