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
    maximum_withdraw?: CurrencyTable[];
    minimum_stake_to_wager?: CurrencyTable[];
    maximum_stake_to_wager?: CurrencyTable[];
    maximum_amount?: CurrencyTable[];
    casino_proportions?: CurrencyTable[];
    live_casino_proportions?: CurrencyTable[];
}

const CURRENCIES = ['EUR', 'USD', 'CAD', 'AUD', 'BRL', 'NOK', 'NZD', 'CLP', 'MXN', 'GBP', 'PLN', 'PEN', 'ZAR', 'CHF', 'NGN', 'JPY', 'AZN', 'TRY', 'KZT', 'RUB', 'UZS'];
const SUPPORTED_LOCALES = ['en', 'de', 'fi', 'no', 'pt', 'fr', 'es', 'it', 'pl', 'ru', 'et'];

export default function ReloadBonusForm({ notes, setNotes, onBonusSaved }: { notes: string; setNotes: (value: string) => void; onBonusSaved?: () => void }) {
    // ============ STATE ============
    const [provider, setProvider] = useState('SYSTEM');
    const [adminConfig, setAdminConfig] = useState<AdminConfig | null>(null);
    const [loadingAdmin, setLoadingAdmin] = useState(false);

    // Basic info
    const [gameId, setGameId] = useState('');

    // Schedule (optional)
    const [withSchedule, setWithSchedule] = useState(false);
    const [scheduleFrom, setScheduleFrom] = useState('');
    const [scheduleTo, setScheduleTo] = useState('');

    // Segments (optional)
    const [segments, setSegments] = useState<string[]>([]);
    const [segmentInput, setSegmentInput] = useState('');

    // Trigger section
    const [minimumAmountEUR, setMinimumAmountEUR] = useState(25);
    const [iterations, setIterations] = useState(0);
    const [triggerType, setTriggerType] = useState('deposit');
    const [duration, setDuration] = useState('7d');
    const [restrictedCountries, setRestrictedCountries] = useState<string[]>([]);
    const [countryInput, setCountryInput] = useState('');

    // Config section
    const [percentage, setPercentage] = useState(150);
    const [wageringMultiplier, setWageringMultiplier] = useState(20);
    const [category, setCategory] = useState('games');
    const [includeAmount, setIncludeAmount] = useState(true);
    const [capCalculation, setCapCalculation] = useState(false);
    const [expiry, setExpiry] = useState('7d');
    const [proportionsType, setProportionsType] = useState('casino');

    // EUR values for searching admin config tables
    const [minStakeEUR, setMinStakeEUR] = useState(0.5);
    const [maxStakeEUR, setMaxStakeEUR] = useState(5);
    const [maxAmountEUR, setMaxAmountEUR] = useState(100);
    const [casinoProportionsEUR, setCasinoProportionsEUR] = useState(100);
    const [liveCasinoProportionsEUR, setLiveCasinoProportionsEUR] = useState(100);

    // Validation
    const [errors, setErrors] = useState<string[]>([]);

    // ============ FETCH ALL TABLES FROM DEFAULT (provider is static 'SYSTEM') ============
    useEffect(() => {
        const fetchCommonTables = async () => {
            try {
                setLoadingAdmin(true);

                // Fetch ALL tables from DEFAULT (including cost, amounts, stakes, withdrawals, proportions)
                console.log('🔍 Fetching ALL tables from DEFAULT provider...');
                const response = await axios.get(`http://localhost:8000/api/stable-config/DEFAULT/with-tables`);
                console.log('📦 Response data:', response.data);
                const config = response.data as AdminConfig;

                console.log('📦 Fetched ALL tables from DEFAULT');
                console.log('  - minimum_amount:', config.minimum_amount);
                console.log('  - minimum_stake_to_wager:', config.minimum_stake_to_wager);
                console.log('  - maximum_stake_to_wager:', config.maximum_stake_to_wager);
                console.log('  - maximum_amount:', config.maximum_amount);
                console.log('  - maximum_withdraw:', config.maximum_withdraw);

                // Admin config loaded - user will enter EUR values to search tables
                console.log('✅ Admin config loaded. User can now enter EUR values to search tables.');

                // Store config
                setAdminConfig(config);
            } catch (err: any) {
                console.error('❌ Failed to fetch common tables:', err);
                console.error('Error details:', err.response?.data);
                setAdminConfig(null);
            } finally {
                setLoadingAdmin(false);
            }
        };

        fetchCommonTables();
    }, []); // Empty array - fetch once on mount, provider is static 'SYSTEM'

    // ============ BUILD CURRENCY MAP FROM ADMIN ============
    const buildCurrencyMap = (
        eurValue: number,
        fieldName: 'minimum_amount' | 'maximum_withdraw' | 'maximum_amount' | 'minimum_stake_to_wager' | 'maximum_stake_to_wager' | 'casino_proportions' | 'live_casino_proportions'
    ): Record<string, number> => {
        const tolerance = 0.001;

        // 🎯 For minimum_amount field, search admin config tables
        if (fieldName === 'minimum_amount' && adminConfig && adminConfig.minimum_amount) {
            for (const table of adminConfig.minimum_amount) {
                if (table.values && Math.abs(table.values.EUR - eurValue) < tolerance) {
                    console.log('✅ Found matching minimum_amount table for EUR =', eurValue, ':', table.values);
                    // "*" is ALWAYS the EUR value
                    return { '*': table.values.EUR, ...table.values };
                }
            }
            console.warn('⚠️ No exact minimum_amount table found for EUR =', eurValue, '- using defaults');
        }

        // 🎯 For maximum_withdraw field, search admin config tables
        if (fieldName === 'maximum_withdraw' && adminConfig && adminConfig.maximum_withdraw) {
            for (const table of adminConfig.maximum_withdraw) {
                if (table.values && Math.abs(table.values.EUR - eurValue) < tolerance) {
                    console.log('✅ Found matching maximum_withdraw table for EUR =', eurValue, ':', table.values);
                    // "*" is ALWAYS the EUR value
                    return { '*': table.values.EUR, ...table.values };
                }
            }
            console.warn('⚠️ No exact maximum_withdraw table found for EUR =', eurValue, '- using defaults');
        }

        // Fallback: use the same EUR value for all currencies
        const map: Record<string, number> = { '*': eurValue };
        CURRENCIES.forEach(curr => {
            map[curr] = eurValue;
        });
        return map;
    };

    // ============ CALCULATE MAX WITHDRAW BASED ON PERCENTAGE ============
    const getMaxWithdrawMultiplier = (percentage: number): number => {
        if (percentage >= 200) return 3;
        if (percentage >= 150) return 6;
        if (percentage >= 120) return 8;
        if (percentage >= 100) return 10;
        if (percentage >= 25) return 12;
        return 12; // default fallback
    };

    // ============ PARSE SEGMENTS FROM COMMA-SEPARATED INPUT ============
    const handleSegmentInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const input = e.target.value;
        setSegmentInput(input);
        // Auto-parse comma-separated values
        if (input.includes(',')) {
            const parsed = input
                .split(',')
                .map(s => s.trim())
                .filter(s => s && !segments.includes(s));
            setSegments([...segments, ...parsed]);
            setSegmentInput('');
        }
    };

    const handleSegmentKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && segmentInput.trim()) {
            const value = segmentInput.trim();
            if (!segments.includes(value)) {
                setSegments([...segments, value]);
                setSegmentInput('');
            }
            e.preventDefault();
        }
    };

    const handleSegmentBlur = () => {
        if (segmentInput.trim() && !segments.includes(segmentInput.trim())) {
            setSegments([...segments, segmentInput.trim()]);
            setSegmentInput('');
        }
    };

    const handleRemoveSegment = (idx: number) => {
        setSegments(segments.filter((_, i) => i !== idx));
    };

    // ============ PARSE COUNTRIES FROM COMMA-SEPARATED INPUT ============
    const handleCountryInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const input = e.target.value.toUpperCase();
        setCountryInput(input);
        // Auto-parse comma-separated values
        if (input.includes(',')) {
            const parsed = input
                .split(',')
                .map(s => s.trim())
                .filter(s => s && !restrictedCountries.includes(s));
            setRestrictedCountries([...restrictedCountries, ...parsed]);
            setCountryInput('');
        }
    };

    const handleCountryKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && countryInput.trim()) {
            const value = countryInput.trim().toUpperCase();
            if (!restrictedCountries.includes(value)) {
                setRestrictedCountries([...restrictedCountries, value]);
                setCountryInput('');
            }
            e.preventDefault();
        }
    };

    const handleCountryBlur = () => {
        if (countryInput.trim()) {
            const value = countryInput.trim().toUpperCase();
            if (!restrictedCountries.includes(value)) {
                setRestrictedCountries([...restrictedCountries, value]);
                setCountryInput('');
            }
        }
    };

    const handleRemoveCountry = (idx: number) => {
        setRestrictedCountries(restrictedCountries.filter((_, i) => i !== idx));
    };

    // ============ FORMAT DATE/TIME ============
    const formatDateTimeForPayload = (dateTimeLocal: string): string => {
        // Input: "2026-01-04T22:00" (datetime-local format)
        // Output: "04-01-2026 22:00"
        if (!dateTimeLocal) return '';
        const [datePart, timePart] = dateTimeLocal.split('T');
        const [year, month, day] = datePart.split('-');
        return `${day}-${month}-${year} ${timePart}`;
    };

    // ============ VALIDATION ============
    const validate = (): boolean => {
        const newErrors: string[] = [];

        if (!gameId.trim()) newErrors.push('Game ID is required');
        if (minimumAmountEUR <= 0) newErrors.push('Minimum amount must be > 0');
        if (percentage <= 0) newErrors.push('Percentage must be > 0');
        if (wageringMultiplier <= 0) newErrors.push('Wagering multiplier must be > 0');
        if (withSchedule && (!scheduleFrom || !scheduleTo)) newErrors.push('Both schedule dates required if enabled');

        setErrors(newErrors);
        return newErrors.length === 0;
    };

    // ============ BUILD & SAVE JSON ============
    const handleSave = async () => {
        if (!validate()) return;

        try {
            // Build maximum_withdraw with simple multiplier value for all currencies
            const maxWithdrawMultiplier = getMaxWithdrawMultiplier(percentage);
            const maxWithdrawMap: Record<string, number> = { '*': maxWithdrawMultiplier };
            CURRENCIES.forEach(curr => {
                maxWithdrawMap[curr] = maxWithdrawMultiplier;
            });

            const payload: any = {
                id: gameId,
                bonus_type: 'reload',
                trigger_type: triggerType,
                trigger_duration: duration,
                category: category,
                provider: provider,
                brand: 'SYSTEM',
                config_type: 'cash',
                percentage: percentage,
                wagering_multiplier: wageringMultiplier,
                minimum_amount: buildCurrencyMap(minimumAmountEUR, 'minimum_amount'),
                minimum_stake_to_wager: buildCurrencyMap(minStakeEUR, 'minimum_stake_to_wager'),
                maximum_stake_to_wager: buildCurrencyMap(maxStakeEUR, 'maximum_stake_to_wager'),
                maximum_amount: buildCurrencyMap(maxAmountEUR, 'maximum_amount'),
                maximum_withdraw: maxWithdrawMap,
                include_amount_on_target_wager: includeAmount,
                cap_calculation_to_maximum: capCalculation,
                compensate_overspending: true,
                withdraw_active: false,
                restricted_countries: restrictedCountries.length > 0 ? restrictedCountries : null,
                segments: segments.length > 0 ? segments : null,
                notes: notes || undefined,
                ...(iterations > 0 && { trigger_iterations: iterations }),
                ...(withSchedule && scheduleFrom && scheduleTo && {
                    schedule_from: formatDateTimeForPayload(scheduleFrom),
                    schedule_to: formatDateTimeForPayload(scheduleTo),
                    schedule_type: 'period',
                }),
                config_extra: {
                    category: category,
                    proportions_type: proportionsType,
                    ...(proportionsType === 'casino' && { proportions: buildCurrencyMap(casinoProportionsEUR, 'casino_proportions') }),
                    ...(proportionsType === 'live_casino' && { proportions: buildCurrencyMap(liveCasinoProportionsEUR, 'live_casino_proportions') }),
                },
                expiry: expiry,
            };

            // Save to database
            await axios.post('http://localhost:8000/api/bonus-templates', payload);

            alert(`✅ Reload Bonus "${gameId}" saved successfully!`);
            onBonusSaved?.();

            // Reset form
            setGameId('');
            setRestrictedCountries([]);
            setSegments([]);
            setErrors([]);
        } catch (err: any) {
            let errorMsg = 'Failed to save bonus';
            if (err.response?.data?.detail && Array.isArray(err.response.data.detail)) {
                errorMsg = err.response.data.detail
                    .map((e: any) => `${e.loc?.join('.')}: ${e.msg}`)
                    .join(' | ');
            } else if (err.response?.data?.detail) {
                errorMsg = String(err.response.data.detail);
            }
            setErrors([...errors, errorMsg]);
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-6 bg-slate-800/50 rounded-lg border border-slate-700/60">
            <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">🔄 Reload Bonus</h2>

            {/* Errors */}
            {errors.length > 0 && (
                <div className="mb-6 p-4 bg-red-900/20 border border-red-700/60 rounded-lg">
                    <p className="font-semibold text-red-400 mb-2">⚠️ Errors:</p>
                    {errors.map((err, i) => (
                        <p key={i} className="text-red-300 text-sm">• {err}</p>
                    ))}
                </div>
            )}

            <div className="space-y-6">
                {/* Game ID */}
                <div className="p-4 bg-slate-700/40 rounded-lg border border-blue-500/40">
                    <label className="block text-sm font-semibold text-slate-100 mb-2">Game ID *</label>
                    <input
                        type="text"
                        value={gameId}
                        onChange={(e) => setGameId(e.target.value)}
                        placeholder="e.g., 150% Casino Reload Bonus up to €250"
                        className="w-full px-3 py-2 border border-slate-600 rounded-md text-slate-100 bg-slate-900/60 placeholder-slate-500"
                    />
                </div>

                {/* Provider Selection */}
                <div className="p-4 bg-slate-700/40 rounded-lg border border-indigo-500/40">
                    <label className="block text-sm font-semibold text-slate-100 mb-2">Provider</label>
                    <select
                        value={provider}
                        onChange={(e) => setProvider(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-600 rounded-md text-slate-100 bg-slate-900/60 appearance-none cursor-pointer"
                    >
                        <option value="SYSTEM" className="bg-slate-800">SYSTEM</option>
                        <option value="PRAGMATIC" className="bg-slate-800">PRAGMATIC</option>
                        <option value="BETSOFT" className="bg-slate-800">BETSOFT</option>
                    </select>
                    {loadingAdmin && <p className="text-xs text-indigo-400 mt-2">📡 Fetching admin setup...</p>}
                </div>

                {/* 📋 Segments */}
                <div className="p-3 bg-slate-700/40 rounded border border-purple-500/40">
                    <label className="block text-sm font-medium text-slate-100 mb-2">📋 Segments (Optional - comma separated or press Enter)</label>
                    <div className="flex gap-2 mb-2">
                        <input
                            type="text"
                            value={segmentInput}
                            onChange={handleSegmentInputChange}
                            onKeyDown={handleSegmentKeyDown}
                            onBlur={handleSegmentBlur}
                            placeholder="e.g., segment1, segment2, fast-track_system-lifecycle-version-1959"
                            className="flex-1 px-3 py-2 border border-slate-600 rounded-md text-slate-100 bg-slate-900/60 placeholder-slate-500"
                        />
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {segments.map((segment, idx) => (
                            <div key={idx} className="flex items-center gap-1 px-3 py-1 bg-blue-900/40 border border-blue-500/40 rounded-full text-sm text-slate-100">
                                {segment}
                                <button
                                    onClick={() => handleRemoveSegment(idx)}
                                    className="text-red-400 hover:text-red-300 font-bold cursor-pointer"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 🚫 Restricted Countries */}
                <div className="p-3 bg-slate-700/40 rounded border border-amber-500/40">
                    <label className="block text-sm font-medium text-slate-100 mb-2">🚫 Restricted Countries (Optional - comma separated or press Enter)</label>
                    <div className="flex gap-2 mb-2">
                        <input
                            type="text"
                            value={countryInput}
                            onChange={handleCountryInputChange}
                            onKeyDown={handleCountryKeyDown}
                            onBlur={handleCountryBlur}
                            placeholder="e.g., BR, AU, NZ, TR"
                            className="flex-1 px-3 py-2 border border-slate-600 rounded-md text-slate-100 bg-slate-900/60 placeholder-slate-500"
                        />
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {restrictedCountries.map((country, idx) => (
                            <div key={idx} className="flex items-center gap-1 px-3 py-1 bg-amber-900/40 border border-amber-500/40 rounded-full text-sm text-slate-100">
                                {country}
                                <button
                                    onClick={() => handleRemoveCountry(idx)}
                                    className="text-red-400 hover:text-red-300 font-bold cursor-pointer"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ============ SCHEDULE (OPTIONAL) ============ */}
                <div className="p-4 bg-slate-700/40 rounded-lg border border-purple-500/40">
                    <h3 className="text-lg font-semibold text-slate-100 mb-4">📅 Schedule (Optional)</h3>

                    <label className="flex items-center text-sm font-medium text-slate-100 mb-4 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={withSchedule}
                            onChange={(e) => setWithSchedule(e.target.checked)}
                            className="mr-2 w-4 h-4"
                        />
                        Enable time-boxed promo
                    </label>

                    {withSchedule && (
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-100 mb-1">From</label>
                                <input
                                    type="datetime-local"
                                    value={scheduleFrom}
                                    onChange={(e) => setScheduleFrom(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-600 rounded-md text-slate-100 bg-slate-900/60 appearance-none cursor-pointer"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-100 mb-1">To</label>
                                <input
                                    type="datetime-local"
                                    value={scheduleTo}
                                    onChange={(e) => setScheduleTo(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-600 rounded-md text-slate-100 bg-slate-900/60 appearance-none cursor-pointer"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* ============ TRIGGER ============ */}
                <div className="p-4 bg-slate-700/40 rounded-lg border border-amber-500/40">
                    <h3 className="text-lg font-semibold text-slate-100 mb-4">🎯 Trigger</h3>

                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-100 mb-1">Min Deposit (EUR) *</label>
                                <input
                                    type="number"
                                    value={minimumAmountEUR}
                                    onChange={(e) => setMinimumAmountEUR(parseFloat(e.target.value))}
                                    className="w-full px-3 py-2 border border-slate-600 rounded-md text-slate-100 bg-slate-900/60 appearance-none cursor-pointer"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-100 mb-1">Iterations (Optional)</label>
                                <input
                                    type="number"
                                    value={iterations}
                                    onChange={(e) => setIterations(parseInt(e.target.value) || 0)}
                                    placeholder="Leave empty or 0 if not needed"
                                    className="w-full px-3 py-2 border border-slate-600 rounded-md text-slate-100 bg-slate-900/60"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-100 mb-1">Type</label>
                                <select
                                    value={triggerType}
                                    onChange={(e) => setTriggerType(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-600 rounded-md text-slate-100 bg-slate-900/60 appearance-none cursor-pointer"
                                >
                                    <option value="deposit">Deposit</option>
                                    <option value="external">External</option>
                                    <option value="manual">Manual</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-100 mb-1">Duration</label>
                                <input
                                    type="text"
                                    value={duration}
                                    onChange={(e) => setDuration(e.target.value)}
                                    placeholder="e.g., 7d"
                                    className="w-full px-3 py-2 border border-slate-600 rounded-md text-slate-100 bg-slate-900/60 appearance-none cursor-pointer"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* ============ CONFIG ============ */}
                <div className="p-4 bg-slate-700/40 rounded-lg border border-green-500/40">
                    <h3 className="text-lg font-semibold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent mb-4">⚙️ Config</h3>

                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-100 mb-1">Percentage (%) *</label>
                                <input
                                    type="number"
                                    value={percentage}
                                    onChange={(e) => setPercentage(parseFloat(e.target.value))}
                                    className="w-full px-3 py-2 border border-slate-600 rounded-md text-slate-100 bg-slate-900/60 appearance-none cursor-pointer"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-100 mb-1">Wagering Multiplier (x) *</label>
                                <input
                                    type="number"
                                    value={wageringMultiplier}
                                    onChange={(e) => setWageringMultiplier(parseFloat(e.target.value))}
                                    className="w-full px-3 py-2 border border-slate-600 rounded-md text-slate-100 bg-slate-900/60 appearance-none cursor-pointer"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-100 mb-1">Min Stake to Wager (EUR) *</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={minStakeEUR}
                                    onChange={(e) => setMinStakeEUR(parseFloat(e.target.value))}
                                    placeholder="e.g., 0.5"
                                    className="w-full px-3 py-2 border border-slate-600 rounded-md text-slate-100 bg-slate-900/60"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-100 mb-1">Max Stake to Wager (EUR) *</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={maxStakeEUR}
                                    onChange={(e) => setMaxStakeEUR(parseFloat(e.target.value))}
                                    placeholder="e.g., 5"
                                    className="w-full px-3 py-2 border border-slate-600 rounded-md text-slate-100 bg-slate-900/60"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-100 mb-1">Maximum Amount (EUR) *</label>
                                <input
                                    type="number"
                                    step="1"
                                    value={maxAmountEUR}
                                    onChange={(e) => setMaxAmountEUR(parseFloat(e.target.value))}
                                    placeholder="e.g., 100"
                                    className="w-full px-3 py-2 border border-slate-600 rounded-md text-slate-100 bg-slate-900/60"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-100 mb-1">Maximum Withdraw</label>
                                <div className="w-full px-3 py-2 border border-slate-600 rounded-md text-slate-100 bg-slate-800/60">
                                    EUR: {getMaxWithdrawMultiplier(percentage)}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-100 mb-1">Category</label>
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-600 rounded-md text-slate-100 bg-slate-900/60 appearance-none cursor-pointer"
                                >
                                    <option value="games">Games</option>
                                    <option value="live_casino">Live Casino</option>
                                    <option value="sports">Sports</option>
                                </select>
                            </div>
                        </div>

                        {/* Proportions Section - Radio Buttons + EUR Input */}
                        <div className="p-3 bg-slate-700/30 rounded border border-red-500/50">
                            <label className="block text-sm font-semibold text-slate-100 mb-3">🚫 Proportions *</label>
                            <div className="flex gap-4 mb-3">
                                <label className="flex items-center text-sm font-medium text-slate-100 cursor-pointer">
                                    <input
                                        type="radio"
                                        checked={proportionsType === 'casino'}
                                        onChange={() => setProportionsType('casino')}
                                        className="mr-2 w-4 h-4"
                                    />
                                    🎰 Casino Proportions
                                </label>
                                <label className="flex items-center text-sm font-medium text-slate-100 cursor-pointer">
                                    <input
                                        type="radio"
                                        checked={proportionsType === 'live_casino'}
                                        onChange={() => setProportionsType('live_casino')}
                                        className="mr-2 w-4 h-4"
                                    />
                                    🎭 Live Casino Proportions
                                </label>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-100 mb-1">
                                    {proportionsType === 'casino' ? 'Casino' : 'Live Casino'} Proportions (EUR) *
                                </label>
                                <input
                                    type="number"
                                    step="1"
                                    value={proportionsType === 'casino' ? casinoProportionsEUR : liveCasinoProportionsEUR}
                                    onChange={(e) => {
                                        if (proportionsType === 'casino') {
                                            setCasinoProportionsEUR(parseFloat(e.target.value));
                                        } else {
                                            setLiveCasinoProportionsEUR(parseFloat(e.target.value));
                                        }
                                    }}
                                    placeholder="e.g., 100"
                                    className="w-full px-3 py-2 border border-slate-600 rounded-md text-slate-100 bg-slate-900/60"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <label className="flex items-center text-sm font-medium text-slate-100 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={includeAmount}
                                    onChange={(e) => setIncludeAmount(e.target.checked)}
                                    className="mr-2 w-4 h-4"
                                />
                                Include Amount on Target Wager
                            </label>

                            <label className="flex items-center text-sm font-medium text-slate-100 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={capCalculation}
                                    onChange={(e) => setCapCalculation(e.target.checked)}
                                    className="mr-2 w-4 h-4"
                                />
                                Cap Calculation to Maximum
                            </label>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-100 mb-1">Expiry</label>
                            <input
                                type="text"
                                value={expiry}
                                onChange={(e) => setExpiry(e.target.value)}
                                placeholder="e.g., 7d"
                                className="w-full px-3 py-2 border border-slate-600 rounded-md text-slate-100 bg-slate-900/60 appearance-none cursor-pointer"
                            />
                        </div>
                    </div>
                </div>

                {/* Save Button */}
                <button
                    onClick={handleSave}
                    className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-lg hover:from-green-700 hover:to-emerald-700 transition"
                >
                    💾 Save Reload Bonus
                </button>
            </div>
        </div>
    );
}
