'use client';

import { useState } from 'react';
import AdminPanel from '@/components/AdminPanel';
import BonusTypeSelector from '@/components/BonusTypeSelector';
import BonusBrowser from '@/components/BonusBrowser';
import TranslationTeam from '@/components/TranslationTeam';
import OptimizationTeam from '@/components/OptimizationTeam';

const tabs = [
    { id: 'admin', label: '⚙️ Admin Setup', active: 'from-red-600 to-red-700', glow: 'shadow-red-500/30' },
    { id: 'browse', label: '📅 Browse Bonuses', active: 'from-cyan-600 to-cyan-700', glow: 'shadow-cyan-500/30' },
    { id: 'casino', label: '🎰 Create Bonus', active: 'from-blue-600 to-blue-700', glow: 'shadow-blue-500/30' },
    { id: 'translation', label: '🌐 Translation Team', active: 'from-green-600 to-green-700', glow: 'shadow-green-500/30' },
    { id: 'optimization', label: '📊 Optimization Team', active: 'from-purple-600 to-purple-700', glow: 'shadow-purple-500/30' },
] as const;

export default function Home() {
    const [activeTab, setActiveTab] = useState<(typeof tabs)[number]['id']>('admin');

    const tabBase =
        'px-6 py-3 text-sm md:text-base font-semibold rounded-xl transition focus:outline-none focus:ring-2 focus:ring-white/20 shadow-sm';

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
            <div className="w-full px-10 py-10">

                {/* Header */}
                <header className="mb-6 border-b border-slate-700/50">
                    <div className="flex items-center h-30 px-0">
                        <img
                            src="/Bonuslab_transparent.png"
                            alt="BonusLab"
                            className="h-20 w-auto object-contain"
                        />
                    </div>
                </header>






                {/* Tabs */}
                <div className="flex gap-3 mb-8 overflow-x-auto pb-3 border-b border-slate-700/60">
                    {tabs.map((t) => {
                        const isActive = activeTab === t.id;
                        return (
                            <button
                                key={t.id}
                                onClick={() => setActiveTab(t.id)}
                                className={[
                                    tabBase,
                                    'whitespace-nowrap',
                                    isActive
                                        ? `bg-gradient-to-r ${t.active} text-white shadow-lg ${t.glow}`
                                        : 'bg-slate-800/60 text-slate-300 hover:bg-slate-700/70 hover:text-white',
                                ].join(' ')}
                            >
                                {t.label}
                            </button>
                        );
                    })}
                </div>

                {/* Content wrapper (replaces "card") */}
                <div className="rounded-2xl border border-slate-700/60 bg-slate-900/40 shadow-xl shadow-black/20 backdrop-blur p-5 md:p-7">
                    {activeTab === 'admin' && <AdminPanel />}
                    {activeTab === 'casino' && <BonusTypeSelector />}
                    {activeTab === 'browse' && <BonusBrowser />}
                    {activeTab === 'translation' && <TranslationTeam />}
                    {activeTab === 'optimization' && <OptimizationTeam />}
                </div>
            </div>
        </div>
    );
}
