import React from 'react';

export const RoleBadge: React.FC<{ role: 'ADMIN' | 'OWNER' | 'VIEWER' }> = ({ role }) => {
    const color = role === 'ADMIN' ? '#ef4444' : role === 'OWNER' ? '#eab308' : '#38bdf8';
    return (
        <span style={{
            background: `${color}20`,
            color: color,
            border: `1px solid ${color}`,
            padding: '0.2rem 0.6rem',
            borderRadius: '9999px',
            fontSize: '0.7rem',
            fontWeight: 700,
            letterSpacing: '0.05em'
        }}>
            {role}
        </span>
    );
};
