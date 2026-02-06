'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { API_ENDPOINTS } from './api-config';

const API_URL = API_ENDPOINTS.BASE_URL;

interface User {
    id: string;
    username: string;
    role: 'admin' | 'user';
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    isLoggedIn: boolean;
    isAdmin: boolean;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Check authentication on mount and when pathname changes
    useEffect(() => {
        const checkAuth = () => {
            const storedToken = localStorage.getItem('auth_token');
            const storedUser = localStorage.getItem('auth_user');

            console.log('Auth check from context:', { hasToken: !!storedToken, hasUser: !!storedUser });

            if (storedToken && storedUser) {
                try {
                    const parsedUser = JSON.parse(storedUser);
                    setToken(storedToken);
                    setUser(parsedUser);

                    // Set auth header for future requests
                    axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
                    console.log('Auth restored from localStorage');
                } catch (err) {
                    console.log('Failed to parse stored user');
                    // Clear invalid data
                    localStorage.removeItem('auth_token');
                    localStorage.removeItem('auth_user');
                }
            } else {
                // Ensure state is cleared if no token
                setToken(null);
                setUser(null);
            }

            setIsLoading(false);
        };

        checkAuth();

        // Also listen for storage changes (in case another tab updates it)
        window.addEventListener('storage', checkAuth);
        return () => window.removeEventListener('storage', checkAuth);
    }, []);

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        delete axios.defaults.headers.common['Authorization'];
    };

    const value: AuthContextType = {
        user,
        token,
        isLoading,
        isLoggedIn: !!token && !!user,
        isAdmin: user?.role === 'admin',
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
