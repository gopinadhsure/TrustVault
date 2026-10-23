import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProfilePage: React.FC = () => {
    const { user, logout, loading } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    if (loading) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#0f172a',
                color: '#f8fafc',
                fontFamily: 'Inter, sans-serif'
            }}>
                Loading TrustVault...
            </div>
        );
    }

    if (!user) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#0f172a',
                color: '#f8fafc',
                fontFamily: 'Inter, sans-serif',
                gap: '1rem'
            }}>
                <h2>Unauthorized Access</h2>
                <p style={{ color: '#94a3b8' }}>You must be logged in to view this page.</p>
                <button
                    onClick={() => navigate('/login')}
                    style={{
                        padding: '0.75rem 1.5rem',
                        background: '#0284c7',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        fontWeight: 600
                    }}
                >
                    Go to Sign In
                </button>
            </div>
        );
    }

    const roleColor = user.role === 'ADMIN' ? '#ef4444' : user.role === 'OWNER' ? '#eab308' : '#38bdf8';

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            fontFamily: 'Inter, system-ui, sans-serif',
            color: '#f8fafc',
            padding: '2rem'
        }}>
            <div style={{
                maxWidth: '700px',
                margin: '0 auto',
                background: 'rgba(30, 41, 59, 0.7)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '1rem',
                padding: '2.5rem',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid #334155', paddingBottom: '1rem' }}>
                    <div>
                        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#38bdf8', margin: 0 }}>TrustVault</h1>
                        <p style={{ color: '#94a3b8', fontSize: '0.875rem', margin: '0.25rem 0 0 0' }}>Secure Document Management Portal</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        style={{
                            padding: '0.5rem 1rem',
                            background: '#ef4444',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '0.5rem',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: '0.875rem',
                            transition: 'background 0.2s'
                        }}
                    >
                        Sign Out
                    </button>
                </div>

                <div style={{ marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', color: '#f1f5f9' }}>User Profile</h2>

                    <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '1rem', background: '#0f172a', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid #334155' }}>
                        <span style={{ color: '#94a3b8', fontWeight: 500 }}>Username:</span>
                        <span style={{ fontWeight: 600, color: '#fff' }}>{user.username}</span>

                        <span style={{ color: '#94a3b8', fontWeight: 500 }}>Email:</span>
                        <span style={{ color: '#fff' }}>{user.email || 'Not provided'}</span>

                        <span style={{ color: '#94a3b8', fontWeight: 500 }}>Role:</span>
                        <span>
                            <span style={{
                                background: `${roleColor}20`,
                                color: roleColor,
                                border: `1px solid ${roleColor}`,
                                padding: '0.25rem 0.75rem',
                                borderRadius: '9999px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                letterSpacing: '0.05em'
                            }}>
                                {user.role}
                            </span>
                        </span>

                        <span style={{ color: '#94a3b8', fontWeight: 500 }}>First Name:</span>
                        <span style={{ color: '#fff' }}>{user.first_name || '—'}</span>

                        <span style={{ color: '#94a3b8', fontWeight: 500 }}>Last Name:</span>
                        <span style={{ color: '#fff' }}>{user.last_name || '—'}</span>
                    </div>
                </div>

                <div style={{ background: 'rgba(56, 189, 248, 0.1)', border: '1px solid #38bdf8', borderRadius: '0.75rem', padding: '1.25rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#38bdf8', margin: '0 0 0.5rem 0' }}>Phase 2 Status: Authentication & Roles Active</h3>
                    <p style={{ fontSize: '0.875rem', color: '#cbd5e1', margin: 0, lineHeight: 1.5 }}>
                        You are securely authenticated via Django session cookies with CSRF protection. Your role ({user.role}) governs your access permissions across TrustVault.
                    </p>
                </div>
            </div>
        </div>
    );
};
