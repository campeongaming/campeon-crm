'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface CurrencyTable {
    id: string;
    name: string;
    values: Record<string, number>;
}

interface AdminConfig {
    minimum_amount?: CurrencyTable[];
    maximum_amount?: CurrencyTable[];
    minimum_stake_to_wager?: CurrencyTable[];
    maximum_stake_to_wager?: CurrencyTable[];
    casino_proportions?: CurrencyTable[];
    live_casino_proportions?: CurrencyTable[];
}

const CURRENCIES = ['EUR', 'USD', 'CAD', 'AUD', 'BRL', 'NOK', 'NZD', 'CLP', 'MXN', 'GBP', 'PLN', 'PEN', 'ZAR', 'CHF', 'NGN', 'JPY', 'AZN', 'TRY', 'KZT', 'RUB', 'UZS'];
const SUPPORTED_LOCALES = ['en', 'de', 'fi', 'no', 'pt', 'fr', 'es', 'it', 'pl', 'ru', 'et'];

export default function CashbackForm({ notes, setNotes, onBonusSaved }: { notes: string; setNotes: (value: string) => void; onBonusSaved?: () => void }) {
    // ============ STATE ============
    const [adminConfig, setAdminConfig] = useState<AdminConfig | null>(null);
    const [loadingAdmin, setLoadingAdmin] = useState(false);

    // Trigger name (multilingual)
    const [triggerName, setTriggerName] = useState<Record<string, string>>({ '*': 'Cashback Bonus' });
    const [currentLocale, setCurrentLocale] = useState('*');

    // Schedule (optional)
    const [withSchedule, setWithSchedule] = useState(false);
    const [scheduleFrom, setScheduleFrom] = useState('');
    const [scheduleTo, setScheduleTo] = useState('');

    // Config section
    const [percentage, setPercentage] = useState(100);
    const [wageringMultiplier, setWageringMultiplier] = useState(15);
    const [category, setCategory] = useState('games');
    const [proportionsType, setProportionsType] = useState('casino');
    const [compensateOverspending, setCompensateOverspending] = useState(true);
    const [includeAmount, setIncludeAmount] = useState(false);
    const [capCalculation, setCapCalculation] = useState(false);
    const [withdrawActive, setWithdrawActive] = useState(false);
    const [expiry, setExpiry] = useState('7d');

    // EUR values for searching admin config tables
    const [maxAmountEUR, setMaxAmountEUR] = useState(500);
    const [minStakeEUR, setMinStakeEUR] = useState(0.5);
    const [maxStakeEUR, setMaxStakeEUR] = useState(5);
    const [casinoProportionsEUR, setCasinoProportionsEUR] = useState(100);
    const [liveCasinoProportionsEUR, setLiveCasinoProportionsEUR] = useState(0);

    // Validation
    const [errors, setErrors] = useState<string[]>([]);

    // ============ FETCH ALL TABLES FROM DEFAULT ============
    useEffect(() => {
        const fetchCommonTables = async () => {
            try {
                setLoadingAdmin(true);
                console.log('🔍 Fetching ALL tables from DEFAULT provider...');
                const response = await axios.get(`http://localhost:8000/api/stable-config/DEFAULT/with-tables`);
                const config = response.data as AdminConfig;

                console.log('📦 Fetched tables from DEFAULT');
                console.log('  - maximum_amount:', config.maximum_amount);
                console.log('  - minimum_stake_to_wager:', config.minimum_stake_to_wager);
                console.log('  - maximum_stake_to_wager:', config.maximum_stake_to_wager);
                console.log('  - casino_proportions:', config.casino_proportions);
                console.log('  - live_casino_proportions:', config.live_casino_proportions);

                setAdminConfig(config);
            } catch (err: any) {
                console.error('❌ Failed to fetch tables:', err);
                setAdminConfig(null);
            } finally {
                setLoadingAdmin(false);
            }
        };

        fetchCommonTables();
    }, []);

    // ============ CURRENCY MAP BUILDER ============
    const buildCurrencyMap = (eurValue: number, fieldName: 'maximum_amount' | 'minimum_stake_to_wager' | 'maximum_stake_to_wager' | 'casino_proportions' | 'live_casino_proportions'): Record<string, number> => {
        if (!adminConfig) {
            console.warn('⚠️ Admin config not loaded, using fallback');
            const fallback: Record<string, number> = { '*': eurValue };
            CURRENCIES.forEach(curr => fallback[curr] = eurValue);
            return fallback;
        }

        const tables = adminConfig[fieldName];
        if (!tables || tables.length === 0) {
            console.warn(`⚠️ No tables found for ${fieldName}, using fallback`);
            const fallback: Record<string, number> = { '*': eurValue };
            CURRENCIES.forEach(curr => fallback[curr] = eurValue);
            return fallback;
        }

        const tolerance = 0.001;
        for (const table of tables) {
            if (Math.abs(table.values.EUR - eurValue) < tolerance) {
                console.log(`✅ Found matching table for ${fieldName}: ${table.name}`);
                return { '*': table.values.EUR, ...table.values };
            }
        }

        console.warn(`⚠️ No matching table found for ${fieldName} with EUR=${eurValue}`);
        const fallback: Record<string, number> = { '*': eurValue };
        CURRENCIES.forEach(curr => fallback[curr] = eurValue);
        return fallback;
    };

    // ============ MAXIMUM WITHDRAW (ALWAYS 5) ============
    const buildMaxWithdrawMap = (): Record<string, number> => {
        const map: Record<string, number> = { '*': 5 };
        CURRENCIES.forEach(curr => map[curr] = 5);
        return map;
    };

    // ============ VALIDATION ============
    const validateForm = (): boolean => {
        const newErrors: string[] = [];

        if (!triggerName['*']) newErrors.push('Trigger name (fallback) is required');
        if (percentage <= 0) newErrors.push('Percentage must be > 0');
        if (wageringMultiplier <= 0) newErrors.push('Wagering multiplier must be > 0');
        if (maxAmountEUR <= 0) newErrors.push('Maximum amount must be > 0');
        if (minStakeEUR <= 0) newErrors.push('Minimum stake must be > 0');
        if (maxStakeEUR <= 0) newErrors.push('Maximum stake must be > 0');
        if (maxStakeEUR <= minStakeEUR) newErrors.push('Maximum stake must be > minimum stake');

        if (withSchedule) {
            if (!scheduleFrom) newErrors.push('Schedule start date required');
            if (!scheduleTo) newErrors.push('Schedule end date required');
            if (scheduleFrom && scheduleTo && new Date(scheduleFrom) >= new Date(scheduleTo)) {
                newErrors.push('Schedule end must be after start');
            }
        }

        setErrors(newErrors);
        return newErrors.length === 0;
    };

    // ============ SAVE HANDLER ============
    const handleSave = async () => {
        if (!validateForm()) {
            alert('❌ Please fix validation errors');
            return;
        }

        try {
            // Build currency maps from admin config tables
            const maxAmountMap = buildCurrencyMap(maxAmountEUR, 'maximum_amount');
            const minStakeMap = buildCurrencyMap(minStakeEUR, 'minimum_stake_to_wager');
            const maxStakeMap = buildCurrencyMap(maxStakeEUR, 'maximum_stake_to_wager');
            const casinoPropsMap = buildCurrencyMap(casinoProportionsEUR, 'casino_proportions');
            const liveCasinoPropsMap = buildCurrencyMap(liveCasinoProportionsEUR, 'live_casino_proportions');
            const maxWithdrawMap = buildMaxWithdrawMap(); // ALWAYS 5

            // Build proportions object
            const proportions: Record<string, number> = {};
            if (proportionsType === 'casino') {
                proportions.SLOT_GAMES = casinoProportionsEUR;
            } else if (proportionsType === 'live_casino') {
                proportions.LIVE_CASINO = liveCasinoProportionsEUR;
            } else if (proportionsType === 'both') {
                proportions.SLOT_GAMES = casinoProportionsEUR;
                proportions.LIVE_CASINO = liveCasinoProportionsEUR;
            }

            // Build payload
            const payload = {
                id: `CASHBACK_${percentage}_${new Date().toLocaleDateString('en-GB').replace(/\//g, '.')}`,
                bonus_type: 'cashback',
                trigger_type: 'manual',
                trigger_name: triggerName,
                percentage,
                wagering_multiplier: wageringMultiplier,
                maximum_amount: maxAmountMap,
                minimum_stake_to_wager: minStakeMap,
                maximum_stake_to_wager: maxStakeMap,
                maximum_withdraw: maxWithdrawMap, // ALWAYS 5
                compensate_overspending: compensateOverspending,
                include_amount_on_target_wager_calculation: includeAmount,
                cap_calculation_amount_to_maximum_bonus: capCalculation,
                withdraw_active: withdrawActive,
                category,
                expiry,
                provider: 'SYSTEM',
                extra_data: JSON.stringify({
                    proportions,
                    category
                }),
                notes: notes || '',
                ...(withSchedule && scheduleFrom && scheduleTo && {
                    schedule_from: scheduleFrom,
                    schedule_to: scheduleTo
                })
            };

            console.log('📤 Sending cashback payload:', payload);

            const response = await axios.post('http://localhost:8000/api/bonus-templates', payload);
            console.log('✅ Cashback saved:', response.data);

            alert('✅ Cashback bonus created successfully!');
            if (onBonusSaved) onBonusSaved();

        } catch (err: any) {
            console.error('❌ Save error:', err);
            alert(`❌ Failed to save: ${err.response?.data?.detail || err.message}`);
        }
    };

    // ============ RENDER ============
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 rounded-lg">
                <h2 className="text-2xl font-bold text-white">💰 Cashback Bonus</h2>
                <p className="text-purple-100 mt-2">Cash reward based on player losses</p>
            </div>

            {loadingAdmin && (
                <div className="bg-blue-500/20 border border-blue-500 rounded p-4 text-blue-200">
                    ⏳ Loading admin configuration tables...
                </div>
            )}

            {/* Validation Errors */}
            {errors.length > 0 && (
                <div className="bg-red-500/20 border border-red-500 rounded p-4">
                    <p className="text-red-200 font-semibold mb-2">⚠️ Validation Errors:</p>
                    <ul className="list-disc list-inside text-red-300 space-y-1">
                        {errors.map((err, idx) => <li key={idx}>{err}</li>)}
                    </ul>
                </div>
            )}

            {/* Trigger Name (Multilingual) */}
            <div className="bg-slate-800 p-6 rounded-lg space-y-4">
                <h3 className="text-lg font-semibold text-white">🎯 Trigger Name</h3>
                <div className="space-y-3">
                    <div className="flex gap-2">
                        <select
                            value={currentLocale}
                            onChange={(e) => setCurrentLocale(e.target.value)}
                            className="px-4 py-2 bg-slate-700 border border-slate-600 rounded text-white"
                        >
                            <option value="*">* (Fallback)</option>
                            {SUPPORTED_LOCALES.map(locale => (
                                <option key={locale} value={locale}>{locale.toUpperCase()}</option>
                            ))}
                        </select>
                        <input
                            type="text"
                            value={triggerName[currentLocale] || ''}
                            onChange={(e) => setTriggerName({ ...triggerName, [currentLocale]: e.target.value })}
                            placeholder={`Trigger name for ${currentLocale}`}
                            className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded text-white"
                        />
                    </div>
                    <p className="text-sm text-slate-400">
                        Current translations: {Object.keys(triggerName).join(', ')}
                    </p>
                </div>
            </div>

            {/* Schedule (Optional) */}
            <div className="bg-slate-800 p-6 rounded-lg space-y-4">
                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={withSchedule}
                        onChange={(e) => setWithSchedule(e.target.checked)}
                        className="w-4 h-4"
                    />
                    <h3 className="text-lg font-semibold text-white">📅 Schedule (Optional)</h3>
                </div>
                {withSchedule && (
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-slate-300 mb-1">From</label>
                            <input
                                type="datetime-local"
                                value={scheduleFrom}
                                onChange={(e) => setScheduleFrom(e.target.value)}
                                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-300 mb-1">To</label>
                            <input
                                type="datetime-local"
                                value={scheduleTo}
                                onChange={(e) => setScheduleTo(e.target.value)}
                                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded text-white"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Main Configuration */}
            <div className="bg-slate-800 p-6 rounded-lg space-y-4">
                <h3 className="text-lg font-semibold text-white">⚙️ Configuration</h3>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm text-slate-300 mb-1">Percentage (%)</label>
                        <input
                            type="number"
                            value={percentage}
                            onChange={(e) => setPercentage(Number(e.target.value))}
                            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-slate-300 mb-1">Wagering Multiplier</label>
                        <input
                            type="number"
                            value={wageringMultiplier}
                            onChange={(e) => setWageringMultiplier(Number(e.target.value))}
                            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded text-white"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm text-slate-300 mb-1">Maximum Amount (EUR)</label>
                    <input
                        type="number"
                        value={maxAmountEUR}
                        onChange={(e) => setMaxAmountEUR(Number(e.target.value))}
                        className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded text-white"
                    />
                    <p className="text-xs text-slate-400 mt-1">Will fetch all currencies from admin config</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm text-slate-300 mb-1">Min Stake to Wager (EUR)</label>
                        <input
                            type="number"
                            step="0.01"
                            value={minStakeEUR}
                            onChange={(e) => setMinStakeEUR(Number(e.target.value))}
                            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-slate-300 mb-1">Max Stake to Wager (EUR)</label>
                        <input
                            type="number"
                            step="0.01"
                            value={maxStakeEUR}
                            onChange={(e) => setMaxStakeEUR(Number(e.target.value))}
                            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded text-white"
                        />
                    </div>
                </div>

                <div className="bg-green-500/20 border border-green-500 rounded p-3">
                    <p className="text-green-200 text-sm">
                        ✅ <strong>Maximum Withdraw:</strong> Fixed at 5x (all currencies)
                    </p>
                </div>

                <div>
                    <label className="block text-sm text-slate-300 mb-1">Expiry</label>
                    <input
                        type="text"
                        value={expiry}
                        onChange={(e) => setExpiry(e.target.value)}
                        placeholder="e.g., 7d"
                        className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded text-white"
                    />
                </div>
            </div>

            {/* Boolean Flags */}
            <div className="bg-slate-800 p-6 rounded-lg space-y-3">
                <h3 className="text-lg font-semibold text-white mb-4">⚡ Flags</h3>

                <label className="flex items-center gap-2 text-slate-300">
                    <input
                        type="checkbox"
                        checked={compensateOverspending}
                        onChange={(e) => setCompensateOverspending(e.target.checked)}
                        className="w-4 h-4"
                    />
                    Compensate Overspending
                </label>

                <label className="flex items-center gap-2 text-slate-300">
                    <input
                        type="checkbox"
                        checked={includeAmount}
                        onChange={(e) => setIncludeAmount(e.target.checked)}
                        className="w-4 h-4"
                    />
                    Include Amount on Target Wager Calculation
                </label>

                <label className="flex items-center gap-2 text-slate-300">
                    <input
                        type="checkbox"
                        checked={capCalculation}
                        onChange={(e) => setCapCalculation(e.target.checked)}
                        className="w-4 h-4"
                    />
                    Cap Calculation Amount to Maximum Bonus
                </label>

                <label className="flex items-center gap-2 text-slate-300">
                    <input
                        type="checkbox"
                        checked={withdrawActive}
                        onChange={(e) => setWithdrawActive(e.target.checked)}
                        className="w-4 h-4"
                    />
                    Withdraw Active
                </label>
            </div>

            {/* Proportions */}
            <div className="bg-slate-800 p-6 rounded-lg space-y-4">
                <h3 className="text-lg font-semibold text-white">🎰 Proportions</h3>

                <div>
                    <label className="block text-sm text-slate-300 mb-1">Category</label>
                    <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded text-white"
                    >
                        <option value="games">Games</option>
                        <option value="live_casino">Live Casino</option>
                        <option value="both">Both</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm text-slate-300 mb-1">Proportions Type</label>
                    <select
                        value={proportionsType}
                        onChange={(e) => setProportionsType(e.target.value)}
                        className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded text-white"
                    >
                        <option value="casino">Casino (Slots)</option>
                        <option value="live_casino">Live Casino</option>
                        <option value="both">Both</option>
                    </select>
                </div>

                {(proportionsType === 'casino' || proportionsType === 'both') && (
                    <div>
                        <label className="block text-sm text-slate-300 mb-1">Casino Proportions (EUR %)</label>
                        <input
                            type="number"
                            value={casinoProportionsEUR}
                            onChange={(e) => setCasinoProportionsEUR(Number(e.target.value))}
                            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded text-white"
                        />
                    </div>
                )}

                {(proportionsType === 'live_casino' || proportionsType === 'both') && (
                    <div>
                        <label className="block text-sm text-slate-300 mb-1">Live Casino Proportions (EUR %)</label>
                        <input
                            type="number"
                            value={liveCasinoProportionsEUR}
                            onChange={(e) => setLiveCasinoProportionsEUR(Number(e.target.value))}
                            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded text-white"
                        />
                    </div>
                )}
            </div>

            {/* Notes */}
            <div className="bg-slate-800 p-6 rounded-lg">
                <label className="block text-sm text-slate-300 mb-2">📝 Notes (Optional)</label>
                <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                    placeholder="Internal notes..."
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded text-white"
                />
            </div>

            {/* Save Button */}
            <button
                onClick={handleSave}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-lg transition"
            >
                💾 Save Cashback Bonus
            </button>
        </div>
    );
}
