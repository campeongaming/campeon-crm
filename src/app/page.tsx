'use client';

import { useState } from 'react';
import AdminPanel from '@/components/AdminPanel';
import SimpleBonusForm from '@/components/SimpleBonusForm';
import TranslationTeam from '@/components/TranslationTeam';
import OptimizationTeam from '@/components/OptimizationTeam';

export default function Home() {
    const [activeTab, setActiveTab] = useState('admin');

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
            <div className="max-w-7xl mx-auto px-4 py-10">
                {/* Header */}
                <header className="mb-10 pb-6 border-b border-slate-700/50">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="text-5xl">🎰</span>
                        <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">CAMPEON CRM</h1>
                    </div>
                    <p className="text-slate-400 text-lg">Collaborative Bonus Offer Management System</p>
                </header>

                {/* Tab Navigation */}
                <div className="flex gap-2 mb-8 overflow-x-auto pb-2 border-b border-slate-700">
                    <button
                        onClick={() => setActiveTab('admin')}
                        className={`px-6 py-3 font-semibold transition-all duration-200 whitespace-nowrap ${activeTab === 'admin'
                            ? 'text-red-400 border-b-3 border-red-400'
                            : 'text-slate-400 hover:text-slate-300 border-b-3 border-transparent hover:border-slate-600'
                            }`}
                    >
                        ⚙️ Admin Setup
                    </button>
                    <button
                        onClick={() => setActiveTab('casino')}
                        className={`px-6 py-3 font-semibold transition-all duration-200 whitespace-nowrap ${activeTab === 'casino'
                            ? 'text-blue-400 border-b-3 border-blue-400'
                            : 'text-slate-400 hover:text-slate-300 border-b-3 border-transparent hover:border-slate-600'
                            }`}
                    >
                        🎰 Create Bonus
                    </button>
                    <button
                        onClick={() => setActiveTab('translation')}
                        className={`px-6 py-3 font-semibold transition-all duration-200 whitespace-nowrap ${activeTab === 'translation'
                            ? 'text-green-400 border-b-3 border-green-400'
                            : 'text-slate-400 hover:text-slate-300 border-b-3 border-transparent hover:border-slate-600'
                            }`}
                    >
                        🌐 Translation Team
                    </button>
                    <button
                        onClick={() => setActiveTab('optimization')}
                        className={`px-6 py-3 font-semibold transition-all duration-200 whitespace-nowrap ${activeTab === 'optimization'
                            ? 'text-purple-400 border-b-3 border-purple-400'
                            : 'text-slate-400 hover:text-slate-300 border-b-3 border-transparent hover:border-slate-600'
                            }`}
                    >
                        📊 Optimization Team
                    </button>
                </div>

                {/* Tab Content */}
                <div className="card">
                    {activeTab === 'admin' && <AdminPanel />}
                    {activeTab === 'casino' && <SimpleBonusForm />}
                    {activeTab === 'translation' && <TranslationTeam />}
                    {activeTab === 'optimization' && <OptimizationTeam />}
                </div>
            </div>
        </div>
    );
}
