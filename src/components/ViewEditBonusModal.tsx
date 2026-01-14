'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_ENDPOINTS } from '@/lib/api-config';

interface BonusDetails {
    id: string;
    schedule_type?: string;
    schedule_from?: string;
    schedule_to?: string;
    trigger_name?: any;
    trigger_description?: any;
    trigger_type?: string;
    trigger_iterations?: number;
    trigger_duration?: string;
    minimum_amount?: any;
    restricted_countries?: string[];
    segments?: string[];
    cost?: any;
    multiplier?: any;
    maximum_bets?: any;
    percentage?: number;
    wagering_multiplier?: number;
    minimum_stake_to_wager?: any;
    maximum_stake_to_wager?: any;
    maximum_amount?: any;
    maximum_withdraw?: any;
    include_amount_on_target_wager?: boolean;
    cap_calculation_to_maximum?: boolean;
    compensate_overspending?: boolean;
    withdraw_active?: boolean;
    category?: string;
    provider?: string;
    brand?: string;
    bonus_type?: string;
    game?: string;
    expiry?: string;
    config_type?: string;
    created_at?: string;
    updated_at?: string;
    notes?: string;
    translations?: Array<{
        language: string;
        currency?: string;
        name: string;
        description?: string;
    }>;
}

interface Props {
    bonusId: string;
    mode: 'view' | 'edit';
    onClose: () => void;
    onSave?: () => void;
}

export default function ViewEditBonusModal({ bonusId, mode, onClose, onSave }: Props) {
    const [bonus, setBonus] = useState<BonusDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [isEditing, setIsEditing] = useState(mode === 'edit');
    const [translations, setTranslations] = useState<any[]>([]);

    // Editable state
    const [scheduleFrom, setScheduleFrom] = useState('');
    const [scheduleTo, setScheduleTo] = useState('');
    const [triggerName, setTriggerName] = useState('');
    const [triggerDescription, setTriggerDescription] = useState('');
    const [percentage, setPercentage] = useState(0);
    const [wageringMultiplier, setWageringMultiplier] = useState(0);
    const [expiry, setExpiry] = useState('7d');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        fetchBonusDetails();
    }, [bonusId]);

    const fetchBonusDetails = async () => {
        setLoading(true);
        setMessage('');
        try {
            const encodedId = encodeURIComponent(bonusId);
            console.log('Fetching bonus:', bonusId, 'Encoded:', encodedId);
            const response = await axios.get(`${API_ENDPOINTS.BASE_URL}/api/bonus-templates/${encodedId}`);
            console.log('Bonus response:', response.data);
            const data = response.data;
            setBonus(data);

            // Fetch translations separately
            try {
                const transResponse = await axios.get(`${API_ENDPOINTS.BASE_URL}/api/bonus-templates/${encodedId}/translations`);
                console.log('Translations response:', transResponse.data);
                setTranslations(transResponse.data || []);

                // Use first translation (usually English) for editable fields
                if (transResponse.data && transResponse.data.length > 0) {
                    const firstTrans = transResponse.data[0];
                    setTriggerName(firstTrans.name || '');
                    setTriggerDescription(firstTrans.description || '');
                }
            } catch (transError) {
                console.log('No translations found or error fetching translations:', transError);
                setTranslations([]);
            }

            // Pre-fill other editable fields
            setScheduleFrom(data.schedule_from || '');
            setScheduleTo(data.schedule_to || '');
            setPercentage(data.percentage || 0);
            setWageringMultiplier(data.wagering_multiplier || 0);
            setExpiry(data.expiry || '7d');
            setNotes(data.notes || '');
        } catch (error: any) {
            console.error('Error fetching bonus:', error);
            console.error('Error details:', error.response?.data);
            setMessage(error.response?.data?.detail || error.message || 'Failed to load bonus details');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!bonus) return;

        setSaving(true);
        setMessage('');
        try {
            const payload = {
                schedule_from: scheduleFrom,
                schedule_to: scheduleTo,
                trigger_name: { '*': triggerName },
                trigger_description: { '*': triggerDescription },
                percentage,
                wagering_multiplier: wageringMultiplier,
                expiry,
                notes,
            };

            await axios.patch(`${API_ENDPOINTS.BASE_URL}/api/bonus-templates/${bonusId}`, payload);
            setMessage('✅ Bonus updated successfully!');
            setIsEditing(false);
            if (onSave) onSave();
        } catch (error: any) {
            console.error('Error updating bonus:', error);
            setMessage(error.response?.data?.detail || 'Failed to update bonus');
        } finally {
            setSaving(false);
        }
    };

    const formatCurrency = (value: any): string => {
        if (!value) return 'N/A';
        if (typeof value === 'number') return `€${value.toFixed(2)}`;
        // For objects, prioritize EUR, then *, then fallback
        if (typeof value === 'object') {
            const eurValue = value['EUR'] || value['*'];
            if (eurValue !== undefined && eurValue !== null) {
                return `€${Number(eurValue).toFixed(2)}`;
            }
        }
        return 'N/A';
    };

    const formatText = (value: any): string => {
        if (!value) return 'N/A';
        if (typeof value === 'string') return value;
        if (typeof value === 'object' && value['*']) return value['*'];
        return JSON.stringify(value);
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-3xl w-full mx-4">
                    <div className="text-center text-white">Loading...</div>
                </div>
            </div>
        );
    }

    if (!bonus) {
        return (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-3xl w-full mx-4">
                    <div className="text-center text-red-400">Bonus not found</div>
                    <button onClick={onClose} className="mt-4 w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg">
                        Close
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-6xl w-full my-8">
                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-1">
                            {isEditing ? '✏️ Edit Bonus' : '👁️ View Bonus'}
                        </h2>
                        <p className="text-slate-400 text-sm font-mono">{bonus.id}</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl">
                        ✕
                    </button>
                </div>

                {message && (
                    <div className={`mb-6 p-4 rounded-lg ${message.includes('✅') ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {message}
                    </div>
                )}

                {/* Two Column Layout */}
                <div className="grid grid-cols-3 gap-6">
                    {/* Left: Bonus Form (2/3 width) */}
                    <div className="col-span-2 space-y-6 max-h-[60vh] overflow-y-auto pr-2">
                        {/* Schedule */}
                        <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-6">
                            <h3 className="text-lg font-bold text-white mb-4">📅 Schedule</h3>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <label className="block text-slate-400 mb-1">Type</label>
                                    <div className="text-white">{bonus.schedule_type || 'N/A'}</div>
                                </div>
                                <div>
                                    <label className="block text-slate-400 mb-1">From</label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={scheduleFrom}
                                            onChange={(e) => setScheduleFrom(e.target.value)}
                                            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                                            placeholder="21-11-2025 10:00"
                                        />
                                    ) : (
                                        <div className="text-white">{bonus.schedule_from || 'N/A'}</div>
                                    )}
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-slate-400 mb-1">To</label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={scheduleTo}
                                            onChange={(e) => setScheduleTo(e.target.value)}
                                            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                                            placeholder="28-11-2025 22:59"
                                        />
                                    ) : (
                                        <div className="text-white">{bonus.schedule_to || 'N/A'}</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Trigger */}
                        <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-6">
                            <h3 className="text-lg font-bold text-white mb-4">🎯 Trigger</h3>
                            <div className="space-y-4 text-sm">
                                {/* Show translations if available */}
                                {translations.length > 0 ? (
                                    <div>
                                        <label className="block text-slate-400 mb-2">Translations</label>
                                        <div className="space-y-3">
                                            {translations.map((trans, idx) => (
                                                <div key={idx} className="bg-slate-900/60 border border-slate-600 rounded-lg p-3">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="text-xs font-mono px-2 py-0.5 bg-cyan-600/20 text-cyan-400 rounded">
                                                            {trans.language.toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <div className="text-white font-medium mb-1">{trans.name}</div>
                                                    {trans.description && (
                                                        <div className="text-slate-300 text-xs">{trans.description}</div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-slate-500 italic">
                                        No translations stored yet. Translations are added after JSON generation.
                                    </div>
                                )}

                                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-600">
                                    <div>
                                        <label className="block text-slate-400 mb-1">Type</label>
                                        <div className="text-white">{bonus.trigger_type || 'N/A'}</div>
                                    </div>
                                    <div>
                                        <label className="block text-slate-400 mb-1">Iterations</label>
                                        <div className="text-white">{bonus.trigger_iterations || 'N/A'}</div>
                                    </div>
                                    <div>
                                        <label className="block text-slate-400 mb-1">Duration</label>
                                        <div className="text-white">{bonus.trigger_duration || 'N/A'}</div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-slate-400 mb-1">Minimum Amount</label>
                                    <div className="text-white">{formatCurrency(bonus.minimum_amount)}</div>
                                </div>
                            </div>
                        </div>

                        {/* Config */}
                        <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-6">
                            <h3 className="text-lg font-bold text-white mb-4">⚙️ Configuration</h3>
                            <div className="space-y-4 text-sm">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-slate-400 mb-1">Category</label>
                                        <div className="text-white">{bonus.category || 'N/A'}</div>
                                    </div>
                                    <div>
                                        <label className="block text-slate-400 mb-1">Bonus Type</label>
                                        <div className="text-white">{bonus.bonus_type || 'N/A'}</div>
                                    </div>
                                    <div>
                                        <label className="block text-slate-400 mb-1">Provider</label>
                                        <div className="text-white">{bonus.provider || 'N/A'}</div>
                                    </div>
                                    <div>
                                        <label className="block text-slate-400 mb-1">Brand</label>
                                        <div className="text-white">{bonus.brand || 'N/A'}</div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-slate-400 mb-1">Percentage</label>
                                        {isEditing ? (
                                            <input
                                                type="number"
                                                value={percentage}
                                                onChange={(e) => setPercentage(Number(e.target.value))}
                                                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                                            />
                                        ) : (
                                            <div className="text-white">{bonus.percentage || 'N/A'}%</div>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-slate-400 mb-1">Wagering Multiplier</label>
                                        {isEditing ? (
                                            <input
                                                type="number"
                                                value={wageringMultiplier}
                                                onChange={(e) => setWageringMultiplier(Number(e.target.value))}
                                                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                                            />
                                        ) : (
                                            <div className="text-white">x{bonus.wagering_multiplier || 'N/A'}</div>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-slate-400 mb-1">Cost (per FS)</label>
                                        <div className="text-white">{formatCurrency(bonus.cost)}</div>
                                    </div>
                                    <div>
                                        <label className="block text-slate-400 mb-1">Max Bets</label>
                                        <div className="text-white">{formatCurrency(bonus.maximum_bets)}</div>
                                    </div>
                                    <div>
                                        <label className="block text-slate-400 mb-1">Max Amount</label>
                                        <div className="text-white">{formatCurrency(bonus.maximum_amount)}</div>
                                    </div>
                                    <div>
                                        <label className="block text-slate-400 mb-1">Max Withdraw</label>
                                        <div className="text-white">{formatCurrency(bonus.maximum_withdraw)}</div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-slate-400 mb-1">Min Stake to Wager</label>
                                        <div className="text-white">{formatCurrency(bonus.minimum_stake_to_wager)}</div>
                                    </div>
                                    <div>
                                        <label className="block text-slate-400 mb-1">Max Stake to Wager</label>
                                        <div className="text-white">{formatCurrency(bonus.maximum_stake_to_wager)}</div>
                                    </div>
                                </div>

                                {bonus.game && (
                                    <div>
                                        <label className="block text-slate-400 mb-1">Game</label>
                                        <div className="text-white">{bonus.game}</div>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-slate-400 mb-1">Expiry</label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={expiry}
                                            onChange={(e) => setExpiry(e.target.value)}
                                            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                                            placeholder="7d"
                                        />
                                    ) : (
                                        <div className="text-white">{bonus.expiry || 'N/A'}</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Timestamps */}
                        <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-6">
                            <h3 className="text-lg font-bold text-white mb-4">🕒 Metadata</h3>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <label className="block text-slate-400 mb-1">Created</label>
                                    <div className="text-white">{bonus.created_at ? new Date(bonus.created_at).toLocaleString() : 'N/A'}</div>
                                </div>
                                <div>
                                    <label className="block text-slate-400 mb-1">Updated</label>
                                    <div className="text-white">{bonus.updated_at ? new Date(bonus.updated_at).toLocaleString() : 'N/A'}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Notes (1/3 width) */}
                    <div className="col-span-1">
                        <div className="bg-slate-800 border border-slate-600 rounded-xl p-6 sticky top-0 h-fit">
                            <h3 className="text-lg font-bold text-white mb-4">📝 Notes</h3>
                            {isEditing ? (
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-900/40 border border-slate-700 rounded-lg text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-slate-500"
                                    rows={20}
                                    placeholder="Add notes about this bonus..."
                                />
                            ) : (
                                <div className="text-slate-200 text-sm whitespace-pre-wrap min-h-[400px] bg-slate-900/40 rounded-lg p-3 border border-slate-700">
                                    {bonus.notes || <span className="text-slate-500 italic">No notes</span>}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="flex gap-4 mt-6 pt-6 border-t border-slate-700">
                    {!isEditing ? (
                        <>
                            <button
                                onClick={() => setIsEditing(true)}
                                className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all font-medium"
                            >
                                ✏️ Edit Bonus
                            </button>
                            <button
                                onClick={onClose}
                                className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all font-medium"
                            >
                                Close
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-slate-700 text-white rounded-lg transition-all font-medium"
                            >
                                {saving ? 'Saving...' : '💾 Save Changes'}
                            </button>
                            <button
                                onClick={() => {
                                    setIsEditing(false);
                                    fetchBonusDetails();
                                }}
                                disabled={saving}
                                className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 text-white rounded-lg transition-all font-medium"
                            >
                                Cancel
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
