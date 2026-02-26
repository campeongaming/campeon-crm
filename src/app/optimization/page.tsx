'use client';

import OptimizationTeam from '@/components/OptimizationTeam';
import Navigation from '@/components/Navigation';

export default function OptimizationPage() {

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
            <div className="w-full px-10 py-10">
                <header className="mb-6 border-b border-slate-700/50">
                    <div className="flex items-center h-30 px-0">
                        <img
                            src="/Bonuslab_transparent.png"
                            alt="BonusLab"
                            className="h-20 w-auto object-contain rounded-2xl"
                        />
                    </div>
                </header>

                <Navigation activeTab="optimization" />

                <div className="rounded-2xl border border-slate-700/60 bg-slate-900/40 shadow-xl shadow-black/20 backdrop-blur p-5 md:p-7">
                    <OptimizationTeam />
                </div>
            </div>
        </div>
    );
}
