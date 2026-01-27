'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from './auth-context';

export function AuthGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const { isLoggedIn, isLoading } = useAuth();

    // Public routes that don't require authentication
    const publicRoutes = ['/login'];

    useEffect(() => {
        console.log('AuthGuard check:', { isLoading, isLoggedIn, pathname });

        if (isLoading) {
            console.log('Still loading auth...');
            return;
        }

        const isPublicRoute = publicRoutes.includes(pathname);
        console.log('Public route?', isPublicRoute);

        // If not logged in and not on a public route, redirect to login
        if (!isLoggedIn && !isPublicRoute) {
            console.log('Not logged in, redirecting to /login');
            router.push('/login');
        }

        // If logged in and on login page, redirect to create
        if (isLoggedIn && pathname === '/login') {
            console.log('Logged in on /login, redirecting to /create');
            router.push('/create');
        }
    }, [isLoggedIn, isLoading, pathname, router]);

    // Show loading state while checking auth
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900">
                <div className="text-white">
                    <svg className="animate-spin h-12 w-12 mx-auto" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="mt-4 text-center">Loading...</p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
