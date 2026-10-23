import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiFetch } from '../api';

export interface User {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    role: 'ADMIN' | 'OWNER' | 'VIEWER';
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    const refreshUser = async () => {
        try {
            const res = await apiFetch('/me/');
            if (res.ok) {
                const data = await res.json();
                setUser(data);
            } else {
                setUser(null);
            }
        } catch {
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshUser();
    }, []);

    const login = async (username: string, password: string) => {
        try {
            const res = await apiFetch('/login/', {
                method: 'POST',
                body: JSON.stringify({ username, password }),
            });
            if (res.ok) {
                const data = await res.json();
                setUser(data);
                return { success: true };
            } else {
                const errData = await res.json();
                const errorMsg = errData.non_field_errors?.[0] || errData.detail || 'Invalid username or password.';
                return { success: false, error: errorMsg };
            }
        } catch {
            return { success: false, error: 'Network error occurred during login.' };
        }
    };

    const logout = async () => {
        try {
            await apiFetch('/logout/', { method: 'POST' });
        } finally {
            setUser(null);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
