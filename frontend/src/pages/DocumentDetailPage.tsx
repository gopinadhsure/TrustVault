import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { PageShell } from '../components/PageShell';
import { documentService } from '../services/documentService';
import type { DocumentItem } from '../types';

export const DocumentDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [document, setDocument] = useState<DocumentItem | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        if (!id) return;
        documentService.getDocument(Number(id))
            .then(setDocument)
            .catch((err: any) => setError(err.message))
            .finally(() => setLoading(false));
    }, [id]);

    const handleDelete = async () => {
        if (!id || !window.confirm('Are you sure you want to delete this document?')) return;
        setDeleting(true);
        try {
            await documentService.deleteDocument(Number(id));
            navigate('/documents');
        } catch (err: any) {
            setError(err.message);
            setDeleting(false);
        }
    };

    return (
        <Layout>
            <PageShell
                title={document?.title || 'Document Details'}
                subtitle="Secure document metadata and granular access control."
                loading={loading}
                error={error}
                action={
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <Link to="/permissions" className="tv-btn tv-btn-secondary">
                            🔒 Manage Access
                        </Link>
                        <button
                            onClick={handleDelete}
                            disabled={deleting}
                            className="tv-btn tv-btn-danger"
                        >
                            {deleting ? 'Deleting...' : 'Delete Document'}
                        </button>
                    </div>
                }
            >
                {document && (
                    <div className="tv-card">
                        <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '1.25rem', fontSize: '0.95rem' }}>
                            <span style={{ color: '#94a3b8', fontWeight: 500 }}>Document ID:</span>
                            <span style={{ color: '#fff' }}>#{document.id}</span>

                            <span style={{ color: '#94a3b8', fontWeight: 500 }}>Title:</span>
                            <span style={{ color: '#fff', fontWeight: 600 }}>{document.title}</span>

                            <span style={{ color: '#94a3b8', fontWeight: 500 }}>Description:</span>
                            <span style={{ color: '#cbd5e1' }}>{document.description || 'No description provided.'}</span>

                            <span style={{ color: '#94a3b8', fontWeight: 500 }}>File Name:</span>
                            <span style={{ color: '#38bdf8' }}>{document.file_name}</span>

                            <span style={{ color: '#94a3b8', fontWeight: 500 }}>File Size:</span>
                            <span style={{ color: '#fff' }}>{(document.file_size / 1024).toFixed(1)} KB</span>

                            <span style={{ color: '#94a3b8', fontWeight: 500 }}>File Type:</span>
                            <span style={{ color: '#fff' }}>{document.file_type}</span>

                            <span style={{ color: '#94a3b8', fontWeight: 500 }}>Uploaded By:</span>
                            <span style={{ color: '#fff' }}>{document.uploaded_by}</span>

                            <span style={{ color: '#94a3b8', fontWeight: 500 }}>Created At:</span>
                            <span style={{ color: '#94a3b8' }}>{new Date(document.created_at).toLocaleString()}</span>
                        </div>
                    </div>
                )}
            </PageShell>
        </Layout>
    );
};
