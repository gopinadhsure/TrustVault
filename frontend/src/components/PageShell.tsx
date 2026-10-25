import React from 'react';

interface PageShellProps {
    title: string;
    subtitle?: string;
    loading?: boolean;
    error?: string | null;
    isEmpty?: boolean;
    emptyMessage?: string;
    action?: React.ReactNode;
    children: React.ReactNode;
}

export const PageShell: React.FC<PageShellProps> = ({
    title,
    subtitle,
    loading,
    error,
    isEmpty,
    emptyMessage = 'No items found.',
    action,
    children
}) => {
    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#f8fafc', margin: '0 0 0.25rem 0' }}>{title}</h1>
                    {subtitle && <p style={{ color: '#94a3b8', fontSize: '0.875rem', margin: 0 }}>{subtitle}</p>}
                </div>
                {action && <div>{action}</div>}
            </div>

            {error && (
                <div style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', color: '#fca5a5', padding: '1rem', borderRadius: '0.75rem', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                    <strong>Error: </strong> {error}
                </div>
            )}

            {loading ? (
                <div className="tv-card" style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>
                    Loading data...
                </div>
            ) : isEmpty ? (
                <div className="tv-card" style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>
                    <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>{emptyMessage}</p>
                </div>
            ) : (
                children
            )}
        </div>
    );
};
