import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { RoleBadge } from './RoleBadge';

export const Sidebar: React.FC = () => {
    const { user } = useAuth();

    const linkStyle = ({ isActive }: { isActive: boolean }) => ({
        display: 'flex',
        alignItems: 'center',
        padding: '0.75rem 1rem',
        borderRadius: '0.5rem',
        color: isActive ? '#38bdf8' : '#94a3b8',
        background: isActive ? 'rgba(56, 189, 248, 0.1)' : 'transparent',
        textDecoration: 'none',
        fontWeight: isActive ? 600 : 500,
        fontSize: '0.95rem',
        marginBottom: '0.25rem',
        transition: 'all 0.2s'
    });

    return (
        <aside style={{
            width: '260px',
            background: '#0b0f19',
            borderRight: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            position: 'fixed',
            top: 0,
            bottom: 0,
            left: 0,
            zIndex: 100
        }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#38bdf8', margin: 0 }}>TrustVault</h2>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Secure Document Portal</span>
            </div>

            <nav style={{ padding: '1.5rem 1rem', flex: 1, overflowY: 'auto' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem', paddingLeft: '0.5rem' }}>
                    Menu
                </div>
                <NavLink to="/dashboard" style={linkStyle}>📊 Dashboard</NavLink>
                <NavLink to="/documents" style={linkStyle}>📁 All Documents</NavLink>
                <NavLink to="/documents/shared" style={linkStyle}>🤝 Shared With Me</NavLink>
                <NavLink to="/upload" style={linkStyle}>📤 Upload Document</NavLink>
                <NavLink to="/profile" style={linkStyle}>👤 My Profile</NavLink>

                {user?.role === 'ADMIN' && (
                    <>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '1.5rem 0 0.75rem 0.5rem' }}>
                            Administration
                        </div>
                        <NavLink to="/permissions" style={linkStyle}>🔒 Permissions</NavLink>
                        <NavLink to="/activity" style={linkStyle}>📜 Activity Logs</NavLink>
                        <NavLink to="/admin" style={linkStyle}>⚙️ Admin Dashboard</NavLink>
                    </>
                )}
            </nav>

            {user && (
                <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)', background: 'rgba(15, 23, 42, 0.5)' }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#f8fafc', marginBottom: '0.25rem' }}>{user.username}</div>
                    <RoleBadge role={user.role} />
                </div>
            )}
        </aside>
    );
};

export const Topbar: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <header style={{
            height: '70px',
            background: 'rgba(15, 23, 42, 0.8)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 2rem',
            position: 'sticky',
            top: 0,
            zIndex: 90,
            marginLeft: '260px'
        }}>
            <div style={{ fontSize: '0.9rem', color: '#94a3b8' }}>
                Secure Document Management System
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {user && <span style={{ fontSize: '0.875rem', color: '#cbd5e1' }}>Welcome, <strong>{user.username}</strong></span>}
                <button
                    onClick={handleLogout}
                    className="tv-btn tv-btn-danger"
                    style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}
                >
                    Sign Out
                </button>
            </div>
        </header>
    );
};

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#0f172a' }}>
            <Sidebar />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', marginLeft: '260px' }}>
                <Topbar />
                <main style={{ flex: 1, background: 'radial-gradient(circle at top right, #1e293b 0%, #0f172a 100%)' }}>
                    {children}
                </main>
            </div>
        </div>
    );
};
