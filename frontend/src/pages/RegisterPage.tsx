import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiFetch } from '../api';

export const RegisterPage: React.FC = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        if (password.length < 8) {
            setError('Password must be at least 8 characters long.');
            return;
        }

        setLoading(true);
        try {
            const res = await apiFetch('/auth/register/', {
                method: 'POST',
                body: JSON.stringify({ username, email, password }),
            });

            if (res.ok) {
                setSuccess('Account created successfully! Redirecting to login...');
                setTimeout(() => navigate('/login'), 2000);
            } else {
                const errData = await res.json().catch(() => ({}));
                setError(errData.detail || errData.username?.[0] || 'Registration endpoint not configured on backend yet.');
            }
        } catch {
            setError('Backend registration endpoint not yet connected.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            padding: '1rem'
        }}>
            <div className="tv-card" style={{ width: '100%', maxWidth: '440px' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: 700, marginBottom: '0.5rem', color: '#38bdf8', margin: 0 }}>TrustVault</h1>
                    <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Create a New Secure Account</p>
                </div>

                {error && (
                    <div style={{
                        background: 'rgba(239, 68, 68, 0.2)',
                        border: '1px solid #ef4444',
                        color: '#fca5a5',
                        padding: '0.75rem',
                        borderRadius: '0.5rem',
                        marginBottom: '1.5rem',
                        fontSize: '0.875rem',
                        textAlign: 'center'
                    }}>
                        {error}
                    </div>
                )}

                {success && (
                    <div style={{
                        background: 'rgba(34, 197, 94, 0.2)',
                        border: '1px solid #22c55e',
                        color: '#86efac',
                        padding: '0.75rem',
                        borderRadius: '0.5rem',
                        marginBottom: '1.5rem',
                        fontSize: '0.875rem',
                        textAlign: 'center'
                    }}>
                        {success}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label className="tv-label">Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            className="tv-input"
                            placeholder="Choose a username"
                        />
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label className="tv-label">Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="tv-input"
                            placeholder="name@example.com"
                        />
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label className="tv-label">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="tv-input"
                            placeholder="At least 8 characters"
                        />
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label className="tv-label">Confirm Password</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            className="tv-input"
                            placeholder="Re-enter password"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="tv-btn tv-btn-primary"
                        style={{ width: '100%', opacity: loading ? 0.7 : 1 }}
                    >
                        {loading ? 'Creating Account...' : 'Register'}
                    </button>
                </form>

                <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: '#94a3b8' }}>
                    Already have an account? <Link to="/login" style={{ color: '#38bdf8', textDecoration: 'none' }}>Sign In</Link>
                </div>
            </div>
        </div>
    );
};
