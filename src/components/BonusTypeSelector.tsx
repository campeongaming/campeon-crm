'use client';

import React, { useState } from 'react';
import AwardFreeSpins from './AwardFreeSpins';
import ReloadBonusForm from './ReloadBonusForm';

export default function BonusTypeSelector({ onBonusSaved }: { onBonusSaved?: () => void }) {
    const [selectedType, setSelectedType] = useState('free_spins');
    const [notes, setNotes] = useState('');

    // Reset notes when bonus type changes
    const handleTypeChange = (newType: string) => {
        setSelectedType(newType);
        setNotes(''); // Clear notes when switching types
    };

    return (
        <div className="space-y-6">
            {/* Bonus Type Selector */}
            <div className="p-4 bg-slate-700/40 rounded-lg border border-indigo-500/40">
                <label className="block text-sm font-semibold text-slate-100 mb-3">Select Bonus Type</label>
                <select
                    value={selectedType}
                    onChange={(e) => handleTypeChange(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-600 rounded-lg text-slate-100 bg-slate-900/60 font-medium appearance-none cursor-pointer"
                >
                    <option value="free_spins" className="bg-slate-800">🎟️ Award Free Spins</option>
                    <option value="reload" className="bg-slate-800">🔄 Reload Bonus</option>
                </select>
            </div>

            {/* Two Column Layout: Form + Notes */}
            <div className="grid grid-cols-3 gap-6">
                {/* Left: Form (2/3 width) */}
                <div className="col-span-2">
                    {selectedType === 'free_spins' && <AwardFreeSpins notes={notes} setNotes={setNotes} onBonusSaved={onBonusSaved} />}
                    {selectedType === 'reload' && <ReloadBonusForm notes={notes} setNotes={setNotes} onBonusSaved={onBonusSaved} />}
                </div>

                {/* Right: Notes Box (1/3 width) */}
                <div className="col-span-1">
                    <div className="bg-slate-800 border border-slate-600 rounded-xl p-6 sticky top-4">
                        <h3 className="text-lg font-bold text-white mb-4">📝 Notes</h3>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add any internal notes about this bonus..."
                            rows={25}
                            className="w-full px-3 py-2 bg-slate-900/40 border border-slate-700 rounded-lg text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none placeholder-slate-500"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
