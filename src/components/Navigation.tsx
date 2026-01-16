'use client';

import Link from 'next/link';
import React from 'react';

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
    const tabBase = 'px-6 py-3 text-sm md:text-base font-semibold rounded-xl transition focus:outline-none focus:ring-2 focus:ring-white/20 shadow-sm';

    return (
        <div className="flex gap-3 mb-8 overflow-x-auto pb-3 border-b border-slate-700/60">
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
                                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-700/70 hover:text-white',
                        ].join(' ')}
                    >
                        {t.label}
                    </Link>
                );
            })}
        </div>
    );
}
