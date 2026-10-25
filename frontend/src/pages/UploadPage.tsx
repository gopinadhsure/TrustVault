import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { PageShell } from '../components/PageShell';
import { documentService } from '../services/documentService';

export const UploadPage: React.FC = () => {
    const navigate = useNavigate();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) {
            setError('Please select a file to upload.');
            return;
        }

        setError(null);
        setLoading(true);

        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        formData.append('file', file);

        try {
            await documentService.uploadDocument(formData);
            navigate('/documents');
        } catch (err: any) {
            setError(err.message || 'Failed to upload document.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <PageShell
                title="Upload Secure Document"
                subtitle="Upload encrypted files to TrustVault with role-based access enforcement."
            >
                <div className="tv-card" style={{ maxWidth: '600px', margin: '0 auto' }}>
                    {error && (
                        <div style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', color: '#fca5a5', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: '1.25rem' }}>
                            <label className="tv-label">Document Title</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                                className="tv-input"
                                placeholder="e.g. Q3 Financial Audit"
                            />
                        </div>

                        <div style={{ marginBottom: '1.25rem' }}>
                            <label className="tv-label">Description (Optional)</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                                className="tv-input"
                                placeholder="Add document description..."
                                style={{ resize: 'vertical' }}
                            />
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label className="tv-label">Select File</label>
                            <input
                                type="file"
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                                required
                                style={{
                                    display: 'block',
                                    width: '100%',
                                    padding: '0.75rem',
                                    background: '#0f172a',
                                    border: '1px dashed #334155',
                                    borderRadius: '0.5rem',
                                    color: '#cbd5e1',
                                    cursor: 'pointer'
                                }}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="tv-btn tv-btn-primary"
                            style={{ width: '100%', opacity: loading ? 0.7 : 1 }}
                        >
                            {loading ? 'Uploading & Encrypting...' : 'Upload Document'}
                        </button>
                    </form>
                </div>
            </PageShell>
        </Layout>
    );
};
