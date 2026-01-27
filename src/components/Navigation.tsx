'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';

const tabs = [
    { id: 'admin', label: '⚙️ Admin Setup', path: '/admin' },
    { id: 'browse', label: '📅 Browse Bonuses', path: '/browse' },
    { id: 'create', label: '🎰 Create Bonus', path: '/create' },
    { id: 'translation', label: '🌐 Translation Team', path: '/translation' },
    { id: 'optimization', label: '📊 Optimization Team', path: '/optimization' },
] as const;

interface NavigationProps {
    activeTab: string;
}

export default function Navigation({ activeTab }: NavigationProps) {
    const tabBase = 'px-5 py-2.5 text-sm md:text-base font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-purple-500/30 shadow-sm border active:shadow-none active:scale-95 backdrop-blur-sm';
    const router = useRouter();
    const { user, logout, isAdmin } = useAuth();
    const [showUserMenu, setShowUserMenu] = useState(false);

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    return (
        <div className="flex justify-between items-center gap-3 mb-8 pb-4 pt-2 border-b border-slate-700/40 flex-wrap">
            {/* Tabs */}
            <div className="flex gap-2 overflow-x-auto">
                {tabs.map((t) => {
                    const isActive = activeTab === t.id;
                    return (
                        <Link
                            key={t.id}
                            href={t.path}
                            className={[
                                tabBase,
                                'whitespace-nowrap',
                                isActive
                                    ? `bg-gradient-to-r from-purple-500/40 to-blue-500/40 text-white border-purple-400/40 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30`
                                    : 'bg-slate-800/40 text-slate-300 border-slate-600/30 hover:bg-slate-700/50 hover:text-slate-100 hover:border-slate-500/50 hover:shadow-md',
                            ].join(' ')}
                        >
                            {t.label}
                        </Link>
                    );
                })}
            </div>

            {/* User Info & Logout */}
            {user && (
                <div className="relative">
                    <button
                        onClick={() => setShowUserMenu(!showUserMenu)}
                        className="px-4 py-2 bg-slate-800/60 text-slate-300 hover:bg-slate-700/80 hover:text-slate-50 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap"
                    >
                        <span>👤 {user.username}</span>
                        {isAdmin && <span className="text-xs bg-amber-500/30 text-amber-300 px-2 py-1 rounded">Admin</span>}
                        <svg className={`w-4 h-4 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                    </button>

                    {/* Dropdown Menu */}
                    {showUserMenu && (
                        <div className="absolute right-0 mt-2 w-72 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-50 py-2 top-full">
                            <div className="px-4 py-2 border-b border-slate-700">
                                <p className="text-sm text-slate-400">Logged in as</p>
                                <p className="text-white font-semibold truncate">{user.username}</p>
                                {isAdmin && <p className="text-xs text-amber-400 mt-1">⭐ Admin Account</p>}
                            </div>
                            <button
                                onClick={handleLogout}
                                className="w-full text-left px-4 py-2 text-red-400 hover:bg-red-500/10 transition-colors text-sm font-semibold"
                            >
                                🚪 Sign Out
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
