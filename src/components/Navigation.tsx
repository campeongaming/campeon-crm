'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';

const tabs = [
    { id: 'admin', label: '⚙️ Admin Setup', path: '/admin', active: 'from-amber-600 to-amber-700', glow: 'shadow-amber-500/30' },
    { id: 'browse', label: '📅 Browse Bonuses', path: '/browse', active: 'from-cyan-600 to-cyan-700', glow: 'shadow-cyan-500/30' },
    { id: 'create', label: '🎰 Create Bonus', path: '/create', active: 'from-blue-600 to-blue-700', glow: 'shadow-blue-500/30' },
    { id: 'translation', label: '🌐 Translation Team', path: '/translation', active: 'from-green-600 to-green-700', glow: 'shadow-green-500/30' },
    { id: 'optimization', label: '📊 Optimization Team', path: '/optimization', active: 'from-purple-600 to-purple-700', glow: 'shadow-purple-500/30' },
] as const;

interface NavigationProps {
    activeTab: string;
}

export default function Navigation({ activeTab }: NavigationProps) {
    const tabBase = 'px-6 py-3 text-sm md:text-base font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-white/30 shadow-sm';
    const router = useRouter();
    const { user, logout, isAdmin } = useAuth();
    const [showUserMenu, setShowUserMenu] = useState(false);

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    return (
        <div className="flex justify-between items-center gap-3 mb-8 pb-4 pt-2 border-b border-slate-700/60 flex-wrap">
            {/* Tabs */}
            <div className="flex gap-3 overflow-x-auto">
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
                                    ? `bg-gradient-to-r ${t.active} text-white shadow-lg ${t.glow}`
                                    : 'bg-slate-800/60 text-slate-300 hover:bg-slate-700/80 hover:text-slate-50 hover:shadow-md',
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
                        <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-50 py-2">
                            <div className="px-4 py-2 border-b border-slate-700">
                                <p className="text-sm text-slate-400">Logged in as</p>
                                <p className="text-white font-semibold">{user.username}</p>
                                <p className="text-xs text-slate-500">{user.email}</p>
                                {isAdmin && <p className="text-xs text-amber-400 mt-1">✨ Admin Account</p>}
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
