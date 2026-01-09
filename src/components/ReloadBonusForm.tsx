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
    cost?: CurrencyTable[];
    maximum_withdraw?: CurrencyTable[];
    minimum_stake_to_wager?: CurrencyTable[];
    maximum_stake_to_wager?: CurrencyTable[];
    maximum_amount?: CurrencyTable[];
    casino_proportions?: CurrencyTable[];
    live_casino_proportions?: CurrencyTable[];
}

const CURRENCIES = ['EUR', 'USD', 'CAD', 'AUD', 'BRL', 'NOK', 'NZD', 'CLP', 'MXN', 'GBP', 'PLN', 'PEN', 'ZAR', 'CHF', 'NGN', 'JPY', 'AZN', 'TRY', 'KZT', 'RUB', 'UZS'];
const SUPPORTED_LOCALES = ['en', 'de', 'fi', 'no', 'pt', 'fr', 'es', 'it', 'pl', 'ru', 'et'];

export default function ReloadBonusForm({ onBonusSaved }: { onBonusSaved?: () => void }) {
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
    const [iterations, setIterations] = useState(1);
    const [iterationsOptional, setIterationsOptional] = useState(false);
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

    // Selected tables from admin
    const [selectedMinStakeTable, setSelectedMinStakeTable] = useState<Record<string, number> | null>(null);
    const [selectedMaxStakeTable, setSelectedMaxStakeTable] = useState<Record<string, number> | null>(null);
    const [selectedMaxAmountTable, setSelectedMaxAmountTable] = useState<Record<string, number> | null>(null);
    const [selectedMaxWithdrawTable, setSelectedMaxWithdrawTable] = useState<Record<string, number> | null>(null);
    const [selectedCasinoProportionsTable, setSelectedCasinoProportionsTable] = useState<Record<string, number> | null>(null);
    const [selectedLiveCasinoProportionsTable, setSelectedLiveCasinoProportionsTable] = useState<Record<string, number> | null>(null);

    // Validation
    const [errors, setErrors] = useState<string[]>([]);

    // ============ FETCH COMMON TABLES (AMOUNTS, STAKES, WITHDRAWALS, WAGER, PROPORTIONS) ONCE ON MOUNT ============
    // These are INDEPENDENT of provider - same for all providers
    useEffect(() => {
        const fetchCommonTables = async () => {
            try {
                setLoadingAdmin(true);

                // Use PRAGMATIC as default to fetch common tables (doesn't matter which provider)
                const response = await axios.get(`http://localhost:8000/api/stable-config/PRAGMATIC`);
                const config = response.data as AdminConfig;

                console.log('📦 Fetched COMMON tables (Amounts, Stakes, Withdrawals, Wager, Proportions)');

                // Extract first table from each array and set the selected tables
                if (config.minimum_stake_to_wager && Array.isArray(config.minimum_stake_to_wager) && config.minimum_stake_to_wager[0]) {
                    setSelectedMinStakeTable(config.minimum_stake_to_wager[0].values);
                    console.log('✅ Set Min Stake:', config.minimum_stake_to_wager[0].values);
                }
                if (config.maximum_stake_to_wager && Array.isArray(config.maximum_stake_to_wager) && config.maximum_stake_to_wager[0]) {
                    setSelectedMaxStakeTable(config.maximum_stake_to_wager[0].values);
                    console.log('✅ Set Max Stake:', config.maximum_stake_to_wager[0].values);
                }
                if (config.maximum_amount && Array.isArray(config.maximum_amount) && config.maximum_amount[0]) {
                    setSelectedMaxAmountTable(config.maximum_amount[0].values);
                    console.log('✅ Set Max Amount:', config.maximum_amount[0].values);
                }
                if (config.maximum_withdraw && Array.isArray(config.maximum_withdraw) && config.maximum_withdraw[0]) {
                    setSelectedMaxWithdrawTable(config.maximum_withdraw[0].values);
                    console.log('✅ Set Max Withdraw:', config.maximum_withdraw[0].values);
                }
                if (config.casino_proportions && Array.isArray(config.casino_proportions) && config.casino_proportions[0]) {
                    setSelectedCasinoProportionsTable(config.casino_proportions[0].values);
                    console.log('✅ Set Casino Proportions:', config.casino_proportions[0].values);
                }
                if (config.live_casino_proportions && Array.isArray(config.live_casino_proportions) && config.live_casino_proportions[0]) {
                    setSelectedLiveCasinoProportionsTable(config.live_casino_proportions[0].values);
                    console.log('✅ Set Live Casino Proportions:', config.live_casino_proportions[0].values);
                }

                setAdminConfig(config);
            } catch (err) {
                console.error('Failed to fetch common tables:', err);
                setAdminConfig(null);
            } finally {
                setLoadingAdmin(false);
            }
        };

        fetchCommonTables();
    }, []); // Empty dependency array - fetch ONCE on mount, never change based on provider



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
            const payload: any = {
                id: gameId,
                bonus_type: 'reload',
                trigger_type: triggerType,
                trigger_duration: duration,
                trigger_iterations: iterationsOptional ? iterations : 1,
                category: category,
                provider: provider,
                brand: 'SYSTEM',
                config_type: 'cash',
                percentage: percentage,
                wagering_multiplier: wageringMultiplier,
                minimum_amount: Object.fromEntries(CURRENCIES.map(c => [c, minimumAmountEUR])),
                minimum_stake_to_wager: selectedMinStakeTable,
                maximum_stake_to_wager: selectedMaxStakeTable,
                maximum_amount: selectedMaxAmountTable,
                maximum_withdraw: selectedMaxWithdrawTable,
                include_amount_on_target_wager: includeAmount,
                cap_calculation_to_maximum: capCalculation,
                compensate_overspending: true,
                withdraw_active: false,
                restricted_countries: restrictedCountries.length > 0 ? restrictedCountries : null,
                segments: segments.length > 0 ? segments : null,
                ...(withSchedule && scheduleFrom && scheduleTo && {
                    schedule_from: formatDateTimeForPayload(scheduleFrom),
                    schedule_to: formatDateTimeForPayload(scheduleTo),
                    schedule_type: 'period',
                }),
                config_extra: {
                    category: category,
                    proportions_type: proportionsType,
                    ...(proportionsType === 'casino' && selectedCasinoProportionsTable && { proportions: selectedCasinoProportionsTable }),
                    ...(proportionsType === 'live_casino' && selectedLiveCasinoProportionsTable && { proportions: selectedLiveCasinoProportionsTable }),
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

                            <div>
                                <label className="flex items-center text-sm font-medium text-slate-100 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={iterationsOptional}
                                        onChange={(e) => setIterationsOptional(e.target.checked)}
                                        className="mr-2 w-4 h-4"
                                    />
                                    Iterations (Optional)
                                </label>
                                {iterationsOptional && (
                                    <input
                                        type="number"
                                        value={iterations}
                                        onChange={(e) => setIterations(parseInt(e.target.value))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white mt-1"
                                    />
                                )}
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
                                <label className="block text-sm font-medium text-slate-100 mb-1">Min Stake to Wager *</label>
                                <select
                                    value={selectedMinStakeTable ? JSON.stringify(selectedMinStakeTable) : ''}
                                    onChange={(e) => {
                                        if (e.target.value && adminConfig?.minimum_stake_to_wager) {
                                            const table = adminConfig.minimum_stake_to_wager.find(t => JSON.stringify(t.values) === e.target.value);
                                            if (table) setSelectedMinStakeTable(table.values);
                                        }
                                    }}
                                    className="w-full px-3 py-2 border border-slate-600 rounded-md text-slate-100 bg-slate-900/60 appearance-none cursor-pointer"
                                >
                                    <option value="">Select table...</option>
                                    {adminConfig?.minimum_stake_to_wager?.map(table => (
                                        <option key={table.id} value={JSON.stringify(table.values)}>
                                            {table.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-100 mb-1">Max Stake to Wager *</label>
                                <select
                                    value={selectedMaxStakeTable ? JSON.stringify(selectedMaxStakeTable) : ''}
                                    onChange={(e) => {
                                        if (e.target.value && adminConfig?.maximum_stake_to_wager) {
                                            const table = adminConfig.maximum_stake_to_wager.find(t => JSON.stringify(t.values) === e.target.value);
                                            if (table) setSelectedMaxStakeTable(table.values);
                                        }
                                    }}
                                    className="w-full px-3 py-2 border border-slate-600 rounded-md text-slate-100 bg-slate-900/60 appearance-none cursor-pointer"
                                >
                                    <option value="">Select table...</option>
                                    {adminConfig?.maximum_stake_to_wager?.map(table => (
                                        <option key={table.id} value={JSON.stringify(table.values)}>
                                            {table.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-100 mb-1">Maximum Amount *</label>
                                <select
                                    value={selectedMaxAmountTable ? JSON.stringify(selectedMaxAmountTable) : ''}
                                    onChange={(e) => {
                                        if (e.target.value && adminConfig?.maximum_amount) {
                                            const table = adminConfig.maximum_amount.find(t => JSON.stringify(t.values) === e.target.value);
                                            if (table) setSelectedMaxAmountTable(table.values);
                                        }
                                    }}
                                    className="w-full px-3 py-2 border border-slate-600 rounded-md text-slate-100 bg-slate-900/60 appearance-none cursor-pointer"
                                >
                                    <option value="">Select table...</option>
                                    {adminConfig?.maximum_amount?.map(table => (
                                        <option key={table.id} value={JSON.stringify(table.values)}>
                                            {table.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-100 mb-1">Maximum Withdraw *</label>
                                <select
                                    value={selectedMaxWithdrawTable ? JSON.stringify(selectedMaxWithdrawTable) : ''}
                                    onChange={(e) => {
                                        if (e.target.value && adminConfig?.maximum_withdraw) {
                                            const table = adminConfig.maximum_withdraw.find(t => JSON.stringify(t.values) === e.target.value);
                                            if (table) setSelectedMaxWithdrawTable(table.values);
                                        }
                                    }}
                                    className="w-full px-3 py-2 border border-slate-600 rounded-md text-slate-100 bg-slate-900/60 appearance-none cursor-pointer"
                                >
                                    <option value="">Select table...</option>
                                    {adminConfig?.maximum_withdraw?.map(table => (
                                        <option key={table.id} value={JSON.stringify(table.values)}>
                                            {table.name}
                                        </option>
                                    ))}
                                </select>
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

                        {/* Proportions Section - Radio Buttons Only */}
                        <div className="p-3 bg-slate-700/30 rounded border border-green-500/30">
                            <label className="block text-sm font-semibold text-slate-100 mb-3">Proportions *</label>
                            <div className="flex gap-4">
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
