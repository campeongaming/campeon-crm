'use client';

import React, { useState } from 'react';
import AwardFreeSpins from './AwardFreeSpins';
import ReloadBonusForm from './ReloadBonusForm';

export default function BonusTypeSelector({ onBonusSaved }: { onBonusSaved?: () => void }) {
    const [selectedType, setSelectedType] = useState('free_spins');

    return (
        <div className="space-y-6">
            {/* Bonus Type Selector */}
            <div className="p-4 bg-slate-700/40 rounded-lg border border-indigo-500/40">
                <label className="block text-sm font-semibold text-slate-100 mb-3">Select Bonus Type</label>
                <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-600 rounded-lg text-slate-100 bg-slate-900/60 font-medium appearance-none cursor-pointer"
                >
                    <option value="free_spins" className="bg-slate-800">🎟️ Award Free Spins</option>
                    <option value="reload" className="bg-slate-800">🔄 Reload Bonus</option>
                </select>
            </div>

            {/* Forms */}
            {selectedType === 'free_spins' && <AwardFreeSpins onBonusSaved={onBonusSaved} />}
            {selectedType === 'reload' && <ReloadBonusForm onBonusSaved={onBonusSaved} />}
        </div>
    );
}
