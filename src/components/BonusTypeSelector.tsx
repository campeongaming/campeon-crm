'use client';

import React, { useState } from 'react';
import AwardFreeSpins from './AwardFreeSpins';
import ReloadBonusForm from './ReloadBonusForm';

export default function BonusTypeSelector({ onBonusSaved }: { onBonusSaved?: () => void }) {
    const [selectedType, setSelectedType] = useState('free_spins');

    return (
        <div className="space-y-6">
            {/* Bonus Type Selector */}
            <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-300">
                <label className="block text-sm font-semibold text-gray-700 mb-3">Select Bonus Type</label>
                <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="w-full px-4 py-2 border border-indigo-300 rounded-lg text-gray-900 bg-white font-medium"
                >
                    <option value="free_spins">🎟️ Award Free Spins</option>
                    <option value="reload">🔄 Reload Bonus</option>
                </select>
            </div>

            {/* Forms */}
            {selectedType === 'free_spins' && <AwardFreeSpins onBonusSaved={onBonusSaved} />}
            {selectedType === 'reload' && <ReloadBonusForm onBonusSaved={onBonusSaved} />}
        </div>
    );
}
