import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredRole?: 'ADMIN' | 'OWNER' | 'VIEWER';
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', color: '#f8fafc' }}>
                Authenticating TrustVault session...
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (requiredRole === 'ADMIN' && user.role !== 'ADMIN') {
        return (
            <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#f8fafc', padding: '2rem' }}>
                <h2 style={{ color: '#ef4444', marginBottom: '1rem' }}>403 Forbidden</h2>
                <p style={{ color: '#94a3b8' }}>You need Administrator privileges to access this page.</p>
            </div>
        );
    }

    return <>{children}</>;
};
