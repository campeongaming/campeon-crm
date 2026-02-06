'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios'; import { API_ENDPOINTS } from '@/lib/api-config';
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
    casino_proportions?: string;
    live_casino_proportions?: string;
}

const CURRENCIES = ['EUR', 'USD', 'CAD', 'AUD', 'BRL', 'NOK', 'NZD', 'CLP', 'MXN', 'GBP', 'PLN', 'PEN', 'ZAR', 'CHF', 'NGN', 'JPY', 'AZN', 'TRY', 'KZT', 'RUB', 'UZS'];
const SUPPORTED_LOCALES = ['en', 'de', 'fi', 'no', 'pt', 'fr', 'es', 'it', 'pl', 'ru', 'et'];

export default function CashbackForm({ notes, setNotes, onBonusSaved }: { notes: string; setNotes: (value: string) => void; onBonusSaved?: () => void }) {
    // ============ STATE ============
    const [adminConfig, setAdminConfig] = useState<AdminConfig | null>(null);
    const [loadingAdmin, setLoadingAdmin] = useState(false);

    // ID and Provider
    const [bonusId, setBonusId] = useState('');
    const [provider, setProvider] = useState('SYSTEM');

    // Trigger name (multilingual)
    const [triggerName, setTriggerName] = useState<Record<string, string>>({ '*': 'Cashback Bonus' });
    const [currentLocale, setCurrentLocale] = useState('*');

    // Schedule (optional)
    const [scheduleType, setScheduleType] = useState('day');
    const [scheduleValue, setScheduleValue] = useState(['monday']);
    const [scheduleTimezone, setScheduleTimezone] = useState('');

    // Config section
    const [configType, setConfigType] = useState('deposit');
    const [percentage, setPercentage] = useState(100);
    const [wageringMultiplier, setWageringMultiplier] = useState(15);
    const [category, setCategory] = useState('games');
    const [compensateOverspending, setCompensateOverspending] = useState(false);
    const [includeAmount, setIncludeAmount] = useState(false);
    const [capCalculation, setCapCalculation] = useState(false);
    const [withdrawActive, setWithdrawActive] = useState(false);
    const [expiry, setExpiry] = useState('7d');
    const [proportionsType, setProportionsType] = useState('none');

    // EUR values for searching admin config tables
    const [maxAmountEUR, setMaxAmountEUR] = useState(500);
    const [minStakeEUR, setMinStakeEUR] = useState(0.5);
    const [maxStakeEUR, setMaxStakeEUR] = useState(5);

    // Trigger section
    const [triggerCalculation, setTriggerCalculation] = useState('losses');
    const [triggerMinimumAmountEUR, setTriggerMinimumAmountEUR] = useState<number | ''>('');
    const [triggerDuration, setTriggerDuration] = useState('7d');
    const [restrictedCountries, setRestrictedCountries] = useState<string[]>([]);
    const [countryInput, setCountryInput] = useState('');
    const [allowedCountries, setAllowedCountries] = useState<string[]>([]);
    const [allowedCountryInput, setAllowedCountryInput] = useState('');
    const [triggerCategories, setTriggerCategories] = useState('LIVE_CASINO');

    // Validation
    const [errors, setErrors] = useState<string[]>([]);

    // ============ FETCH ALL TABLES FROM DEFAULT ============
    useEffect(() => {
        const fetchCommonTables = async () => {
            try {
                setLoadingAdmin(true);
                console.log('🔍 Fetching ALL tables from DEFAULT provider...');
                const response = await axios.get(`${API_ENDPOINTS.BASE_URL}/api/stable-config/DEFAULT/with-tables`);
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
    const buildCurrencyMap = (eurValue: number, fieldName: 'minimum_amount' | 'maximum_amount' | 'minimum_stake_to_wager' | 'maximum_stake_to_wager'): Record<string, number> => {
        if (!adminConfig) {
            console.warn('⚠️ Admin config not loaded, using fallback');
            const fallback: Record<string, number> = { '*': eurValue };
            CURRENCIES.forEach(curr => fallback[curr] = eurValue);
            return fallback;
        }

        // 🎯 For minimum_amount field, use deposit multipliers: multiply EUR value by each currency multiplier
        if (fieldName === 'minimum_amount' && adminConfig.minimum_amount) {
            if (adminConfig.minimum_amount.length > 0) {
                const multiplierTable = adminConfig.minimum_amount[0]; // Get first (and typically only) multiplier table
                if (multiplierTable.values) {
                    const result: Record<string, number> = { '*': eurValue }; // EUR as fallback
                    CURRENCIES.forEach(curr => {
                        const multiplier = multiplierTable.values[curr] || 1;
                        result[curr] = parseFloat((eurValue * multiplier).toFixed(4));
                    });
                    console.log('✅ Applied deposit multipliers:', result);
                    return result;
                }
            }
            console.warn('⚠️ No deposit multiplier table found - using EUR value for all currencies');
        }

        // 🎯 For maximum_amount field, use currency exchange multipliers: multiply EUR value by each currency multiplier
        if (fieldName === 'maximum_amount' && adminConfig.maximum_amount) {
            if (adminConfig.maximum_amount.length > 0) {
                const multiplierTable = adminConfig.maximum_amount[0]; // Get first (and typically only) multiplier table
                if (multiplierTable.values) {
                    const result: Record<string, number> = { '*': eurValue }; // EUR as fallback
                    CURRENCIES.forEach(curr => {
                        const multiplier = multiplierTable.values[curr] || 1;
                        result[curr] = parseFloat((eurValue * multiplier).toFixed(4));
                    });
                    console.log('✅ Applied actual currency exchange multipliers:', result);
                    return result;
                }
            }
            console.warn('⚠️ No actual currency exchange multiplier table found - using EUR value for all currencies');
        }

        const tables = adminConfig[fieldName] as CurrencyTable[] | undefined;
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

    // ============ COUNTRY HANDLERS ============
    const handleCountryInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCountryInput(e.target.value);
    };

    const handleCountryKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if ((e.key === 'Enter' || e.key === ',') && countryInput.trim()) {
            e.preventDefault();
            const parsed = countryInput
                .split(',')
                .map(s => s.trim().toUpperCase())
                .filter(s => s && !restrictedCountries.includes(s));
            setRestrictedCountries([...restrictedCountries, ...parsed]);
            setCountryInput('');
        }
    };

    const handleCountryBlur = () => {
        if (countryInput.trim()) {
            const parsed = countryInput
                .split(',')
                .map(s => s.trim().toUpperCase())
                .filter(s => s && !restrictedCountries.includes(s));
            setRestrictedCountries([...restrictedCountries, ...parsed]);
            setCountryInput('');
        }
    };

    const handleRemoveCountry = (idx: number) => {
        setRestrictedCountries(restrictedCountries.filter((_, i) => i !== idx));
    };

    // ============ PARSE ALLOWED COUNTRIES FROM COMMA-SEPARATED INPUT ============
    const handleAllowedCountryInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const input = e.target.value.toUpperCase();
        setAllowedCountryInput(input);
        if (input.includes(',')) {
            const parsed = input
                .split(',')
                .map(s => s.trim())
                .filter(s => s && !allowedCountries.includes(s));
            setAllowedCountries([...allowedCountries, ...parsed]);
            setAllowedCountryInput('');
        }
    };

    const handleAllowedCountryKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && allowedCountryInput.trim()) {
            const value = allowedCountryInput.trim().toUpperCase();
            if (!allowedCountries.includes(value)) {
                setAllowedCountries([...allowedCountries, value]);
                setAllowedCountryInput('');
            }
            e.preventDefault();
        }
    };

    const handleAllowedCountryBlur = () => {
        if (allowedCountryInput.trim()) {
            const value = allowedCountryInput.trim().toUpperCase();
            if (!allowedCountries.includes(value)) {
                setAllowedCountries([...allowedCountries, value]);
                setAllowedCountryInput('');
            }
        }
    };

    const handleRemoveAllowedCountry = (idx: number) => {
        setAllowedCountries(allowedCountries.filter((_, i) => i !== idx));
    };

    // ============ VALIDATION ============
    const validateForm = (): boolean => {
        const newErrors: string[] = [];

        if (!bonusId.trim()) newErrors.push('Bonus ID is required');
        if (!provider.trim()) newErrors.push('Provider is required');
        if (!triggerName['*']) newErrors.push('Trigger name (fallback) is required');
        if (percentage <= 0) newErrors.push('Percentage must be > 0');
        if (wageringMultiplier <= 0) newErrors.push('Wagering multiplier must be > 0');
        if (maxAmountEUR <= 0) newErrors.push('Maximum amount must be > 0');
        if (minStakeEUR <= 0) newErrors.push('Minimum stake must be > 0');
        if (maxStakeEUR <= 0) newErrors.push('Maximum stake must be > 0');
        if (maxStakeEUR <= minStakeEUR) newErrors.push('Maximum stake must be > minimum stake');
        if (triggerMinimumAmountEUR !== '' && triggerMinimumAmountEUR <= 0) newErrors.push('Trigger minimum amount must be > 0 if provided');

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
            const maxWithdrawMap = buildMaxWithdrawMap(); // ALWAYS 5

            // Build trigger minimum amount map (only if provided)
            const triggerMinimumMap = triggerMinimumAmountEUR !== '' && triggerMinimumAmountEUR > 0
                ? buildCurrencyMap(triggerMinimumAmountEUR as number, 'minimum_amount')
                : null;

            // Fetch proportions from admin based on selected type
            let proportionsObject = {};
            if (proportionsType === 'none') {
                // No proportions - empty object
                proportionsObject = {};
                console.log('✅ No proportions selected');
            } else if (proportionsType === 'casino' && adminConfig?.casino_proportions) {
                try {
                    let proportionsData = typeof adminConfig.casino_proportions === 'string'
                        ? JSON.parse(adminConfig.casino_proportions)
                        : adminConfig.casino_proportions;

                    // If it's an array (table format), extract the first table's values
                    if (Array.isArray(proportionsData) && proportionsData.length > 0) {
                        proportionsObject = proportionsData[0].values || {};
                    } else if (typeof proportionsData === 'object' && !Array.isArray(proportionsData)) {
                        proportionsObject = proportionsData;
                    }
                    console.log('✅ Loaded casino proportions:', proportionsObject);
                } catch (err) {
                    console.error('❌ Failed to parse casino_proportions:', err);
                }
            } else if (proportionsType === 'live_casino' && adminConfig?.live_casino_proportions) {
                try {
                    let proportionsData = typeof adminConfig.live_casino_proportions === 'string'
                        ? JSON.parse(adminConfig.live_casino_proportions)
                        : adminConfig.live_casino_proportions;

                    // If it's an array (table format), extract the first table's values
                    if (Array.isArray(proportionsData) && proportionsData.length > 0) {
                        proportionsObject = proportionsData[0].values || {};
                    } else if (typeof proportionsData === 'object' && !Array.isArray(proportionsData)) {
                        proportionsObject = proportionsData;
                    }
                    console.log('✅ Loaded live_casino proportions:', proportionsObject);
                } catch (err) {
                    console.error('❌ Failed to parse live_casino_proportions:', err);
                }
            }

            // Build payload - match BonusTemplateCreate schema exactly
            const payload = {
                id: bonusId,
                bonus_type: 'cashback',
                trigger_type: 'manual',
                trigger_name: triggerName,
                trigger_description: undefined,
                trigger_duration: triggerDuration,
                ...(triggerMinimumMap && { minimum_amount: triggerMinimumMap }),
                restricted_countries: restrictedCountries.length > 0 ? restrictedCountries : undefined,
                allowed_countries: allowedCountries.length > 0 ? allowedCountries : undefined,
                segments: undefined,
                schedule_type: 'period',
                schedule_from: undefined,
                schedule_to: undefined,
                percentage,
                wagering_multiplier: wageringMultiplier,
                maximum_amount: maxAmountMap,
                minimum_stake_to_wager: minStakeMap,
                maximum_stake_to_wager: maxStakeMap,
                maximum_withdraw: maxWithdrawMap,
                include_amount_on_target_wager: includeAmount,
                cap_calculation_to_maximum: capCalculation,
                compensate_overspending: compensateOverspending,
                withdraw_active: withdrawActive,
                category,
                expiry,
                provider,
                brand: provider,
                config_type: configType,
                game: undefined,
                ...(proportionsType !== 'none' && { proportions: proportionsObject }),
                config_extra: {
                    category,
                    ...(triggerCategories.trim() && { trigger_categories: triggerCategories })
                },
                notes: notes || ''
            };

            console.log('📤 Sending cashback payload:', payload);

            const response = await axios.post(`${API_ENDPOINTS.BASE_URL}/api/bonus-templates`, payload);
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
        <div className="space-y-5">
            {/* Header */}
            <div className="bg-gradient-to-br from-cyan-500/90 via-blue-500/90 to-indigo-500/90 p-8 rounded-2xl shadow-xl backdrop-blur-sm border border-white/10">
                <h2 className="text-3xl font-bold text-white drop-shadow-md">💰 Cashback Bonus</h2>
                <p className="text-cyan-50 mt-3 text-lg font-medium">Cash reward based on player losses</p>
            </div>

            {loadingAdmin && (
                <div className="bg-cyan-500/10 border border-cyan-400/40 rounded-xl p-5 backdrop-blur-sm shadow-md">
                    <span className="text-lg">⏳</span> <span className="text-cyan-100 font-medium">Loading admin configuration tables...</span>
                </div>
            )}

            {/* Validation Errors */}
            {errors.length > 0 && (
                <div className="bg-red-500/10 border border-red-400/40 rounded-xl p-5 backdrop-blur-sm shadow-md">
                    <p className="text-red-100 font-semibold mb-3 text-lg">⚠️ Validation Errors:</p>
                    <ul className="list-disc list-inside text-red-200 space-y-2 text-base">
                        {errors.map((err, idx) => <li key={idx}>{err}</li>)}
                    </ul>
                </div>
            )}

            {/* ID and Provider */}
            <div className="p-6 bg-slate-700/20 rounded-xl border border-purple-400/20 backdrop-blur-sm shadow-lg">
                <h3 className="text-xl font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent mb-6">🏷️ Bonus Details</h3>

                {/* ID and Provider */}
                <div className="grid grid-cols-2 gap-4 mb-6 pb-6 border-b border-slate-600/30">
                    <div>
                        <label className="block text-sm text-slate-300 mb-2 font-semibold">Bonus ID *</label>
                        <input
                            type="text"
                            value={bonusId}
                            onChange={(e) => setBonusId(e.target.value)}
                            placeholder="e.g., CASHBACK_MONDAY_25"
                            className="w-full px-4 py-3 border border-slate-500/40 rounded-lg text-slate-100 bg-slate-800/50 backdrop-blur-sm focus:border-purple-400 focus:ring-2 focus:ring-purple-400/30 focus:outline-none transition-all text-base"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-slate-300 mb-2 font-semibold">Provider *</label>
                        <input
                            type="text"
                            value={provider}
                            onChange={(e) => setProvider(e.target.value)}
                            placeholder="e.g., SYSTEM"
                            className="w-full px-4 py-3 border border-slate-500/40 rounded-lg text-slate-100 bg-slate-800/50 backdrop-blur-sm focus:border-purple-400 focus:ring-2 focus:ring-purple-400/30 focus:outline-none transition-all text-base"
                        />
                    </div>
                </div>

                {/* Restricted Countries */}
                <div className="mb-6 pb-6 border-b border-slate-600/30">
                    <label className="block text-sm font-semibold text-slate-300 mb-3">🚫 Restricted Countries (Optional)</label>
                    <div className="flex gap-2 mb-3">
                        <input
                            type="text"
                            value={countryInput}
                            onChange={handleCountryInputChange}
                            onKeyDown={handleCountryKeyDown}
                            onBlur={handleCountryBlur}
                            placeholder="e.g., BR, AU, NZ - Press Enter to add"
                            className="flex-1 px-4 py-2 border border-slate-600 rounded-lg text-slate-100 bg-slate-900/60 placeholder-slate-500 focus:border-purple-400 focus:ring-1 focus:ring-purple-400/30"
                        />
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {restrictedCountries.map((country, idx) => (
                            <div key={idx} className="flex items-center gap-1 px-3 py-1 bg-red-900/40 border border-red-500/40 rounded-full text-sm text-red-200">
                                {country}
                                <button
                                    onClick={() => handleRemoveCountry(idx)}
                                    className="text-red-300 hover:text-red-100 font-bold cursor-pointer"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Allowed Countries */}
                <div className="mb-6 pb-6 border-b border-slate-600/30">
                    <label className="block text-sm font-semibold text-slate-300 mb-3">✅ Allowed Countries (Optional)</label>
                    <div className="flex gap-2 mb-3">
                        <input
                            type="text"
                            value={allowedCountryInput}
                            onChange={handleAllowedCountryInputChange}
                            onKeyDown={handleAllowedCountryKeyDown}
                            onBlur={handleAllowedCountryBlur}
                            placeholder="e.g., SE, NO, FI - Press Enter to add"
                            className="flex-1 px-4 py-2 border border-slate-600 rounded-lg text-slate-100 bg-slate-900/60 placeholder-slate-500 focus:border-purple-400 focus:ring-1 focus:ring-purple-400/30"
                        />
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {allowedCountries.map((country, idx) => (
                            <div key={idx} className="flex items-center gap-1 px-3 py-1 bg-green-900/40 border border-green-500/40 rounded-full text-sm text-green-200">
                                {country}
                                <button
                                    onClick={() => handleRemoveAllowedCountry(idx)}
                                    className="text-red-300 hover:text-red-100 font-bold cursor-pointer"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Schedule */}
                <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-3">📅 Schedule (Optional)</label>
                    <div className="mb-4">
                        <label className="block text-sm text-slate-300 mb-2 font-semibold">Type</label>
                        <select
                            value={scheduleType}
                            onChange={(e) => setScheduleType(e.target.value)}
                            className="w-full px-4 py-3 border border-slate-500/40 rounded-lg text-slate-100 bg-slate-800/50 backdrop-blur-sm focus:border-purple-400 focus:ring-2 focus:ring-purple-400/30 focus:outline-none transition-all text-base cursor-pointer"
                        >
                            <option value="day">Day of Week</option>
                            <option value="date">Date</option>
                            <option value="cron">Cron Expression</option>
                        </select>
                    </div>

                    {scheduleType === 'day' && (
                        <div>
                            <label className="block text-sm text-slate-300 mb-2 font-semibold">Days of Week</label>
                            <div className="grid grid-cols-2 gap-3">
                                {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                                    <label key={day} className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={scheduleValue.includes(day)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setScheduleValue([...scheduleValue, day]);
                                                } else {
                                                    setScheduleValue(scheduleValue.filter(d => d !== day));
                                                }
                                            }}
                                            className="w-4 h-4 rounded cursor-pointer"
                                        />
                                        <span className="text-slate-200 capitalize">{day}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    {scheduleType === 'date' && (
                        <div>
                            <label className="block text-sm text-slate-300 mb-2 font-semibold">Dates (comma-separated)</label>
                            <input
                                type="text"
                                value={scheduleValue.join(', ')}
                                onChange={(e) => setScheduleValue(e.target.value.split(',').map(d => d.trim()))}
                                placeholder="e.g., 01, 15, 25"
                                className="w-full px-4 py-3 border border-slate-500/40 rounded-lg text-slate-100 bg-slate-800/50 backdrop-blur-sm focus:border-purple-400 focus:ring-2 focus:ring-purple-400/30 focus:outline-none transition-all text-base"
                            />
                        </div>
                    )}

                    {scheduleType === 'cron' && (
                        <div>
                            <label className="block text-sm text-slate-300 mb-2 font-semibold">Cron Expression</label>
                            <input
                                type="text"
                                value={scheduleValue[0] || ''}
                                onChange={(e) => setScheduleValue([e.target.value])}
                                placeholder="e.g., 0 0 9 ? * * *"
                                className="w-full px-4 py-3 border border-slate-500/40 rounded-lg text-slate-100 bg-slate-800/50 backdrop-blur-sm focus:border-purple-400 focus:ring-2 focus:ring-purple-400/30 focus:outline-none transition-all text-base"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm text-slate-300 mb-2 font-semibold">Timezone (Optional)</label>
                        <input
                            type="text"
                            value={scheduleTimezone}
                            onChange={(e) => setScheduleTimezone(e.target.value)}
                            placeholder="e.g., CET, UTC, EST"
                            className="w-full px-4 py-3 border border-slate-500/40 rounded-lg text-slate-100 bg-slate-800/50 backdrop-blur-sm focus:border-purple-400 focus:ring-2 focus:ring-purple-400/30 focus:outline-none transition-all text-base"
                        />
                    </div>
                </div>
            </div>

            {/* ============ TRIGGER SECTION ============ */}
            <div className="p-6 bg-slate-700/20 rounded-xl border border-amber-400/20 backdrop-blur-sm shadow-lg">
                <h3 className="text-xl font-bold bg-gradient-to-r from-amber-300 to-yellow-300 bg-clip-text text-transparent mb-6">🎯 Trigger</h3>
                <div className="space-y-4">

                    {/* Calculation */}
                    <div>
                        <label className="block text-sm text-slate-300 mb-2 font-semibold">Calculation Type</label>
                        <select
                            value={triggerCalculation}
                            onChange={(e) => setTriggerCalculation(e.target.value)}
                            className="w-full px-4 py-3 border border-slate-500/40 rounded-lg text-slate-100 bg-slate-800/50 backdrop-blur-sm focus:border-amber-400 focus:ring-2 focus:ring-amber-400/30 focus:outline-none transition-all text-base cursor-pointer"
                        >
                            <option value="losses">Losses</option>
                            <option value="winnings">Winnings</option>
                            <option value="turnover">Turnover</option>
                        </select>
                    </div>

                    {/* Minimum Amount */}
                    <div>
                        <label className="block text-sm text-slate-300 mb-2 font-semibold">Minimum Amount (EUR)</label>
                        <input
                            type="number"
                            step="0.01"
                            value={triggerMinimumAmountEUR}
                            onChange={(e) => setTriggerMinimumAmountEUR(e.target.value === '' ? '' : Number(e.target.value))}
                            placeholder="Leave empty if not required"
                            className="w-full px-4 py-3 border border-slate-500/40 rounded-lg text-slate-100 bg-slate-800/50 backdrop-blur-sm focus:border-amber-400 focus:ring-2 focus:ring-amber-400/30 focus:outline-none transition-all text-base"
                        />
                        <p className="text-xs text-slate-400 mt-1">Will fetch all currencies from admin config if provided</p>
                    </div>

                    {/* Duration */}
                    <div>
                        <label className="block text-sm text-slate-300 mb-2 font-semibold">Duration</label>
                        <input
                            type="text"
                            value={triggerDuration}
                            onChange={(e) => setTriggerDuration(e.target.value)}
                            placeholder="e.g., 7d, 30d, 1h"
                            className="w-full px-4 py-3 border border-slate-500/40 rounded-lg text-slate-100 bg-slate-800/50 backdrop-blur-sm focus:border-amber-400 focus:ring-2 focus:ring-amber-400/30 focus:outline-none transition-all text-base"
                        />
                    </div>

                    {/* Categories */}
                    <div>
                        <label className="block text-sm text-slate-300 mb-2 font-semibold">📂 Categories</label>
                        <input
                            type="text"
                            value={triggerCategories}
                            onChange={(e) => setTriggerCategories(e.target.value)}
                            placeholder="e.g., (LIVE_CASINO), (SLOT_GAMES)"
                            className="w-full px-4 py-3 border border-slate-500/40 rounded-lg text-slate-100 bg-slate-800/50 backdrop-blur-sm focus:border-amber-400 focus:ring-2 focus:ring-amber-400/30 focus:outline-none transition-all text-base"
                        />
                    </div>

                </div>
            </div>

            {/* Main Configuration */}
            <div className="p-6 bg-slate-700/20 rounded-xl border border-cyan-400/20 backdrop-blur-sm shadow-lg">
                <h3 className="text-xl font-bold bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent mb-6">⚙️ Config</h3>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm text-slate-300 mb-2 font-semibold">Type</label>
                        <input
                            type="text"
                            value={configType}
                            onChange={(e) => setConfigType(e.target.value)}
                            placeholder="e.g., deposit"
                            className="w-full px-4 py-3 border border-slate-500/40 rounded-lg text-slate-100 bg-slate-800/50 backdrop-blur-sm focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30 focus:outline-none transition-all text-base"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-slate-300 mb-2 font-semibold">Category</label>
                        <input
                            type="text"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            placeholder="e.g., games"
                            className="w-full px-4 py-3 border border-slate-500/40 rounded-lg text-slate-100 bg-slate-800/50 backdrop-blur-sm focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30 focus:outline-none transition-all text-base"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm text-slate-300 mb-2 font-semibold">Percentage (%)</label>
                        <input
                            type="number"
                            value={percentage}
                            onChange={(e) => setPercentage(Number(e.target.value))}
                            className="w-full px-4 py-3 border border-slate-500/40 rounded-lg text-slate-100 bg-slate-800/50 backdrop-blur-sm focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30 focus:outline-none transition-all text-base"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-slate-300 mb-2 font-semibold">Wagering Multiplier</label>
                        <input
                            type="number"
                            value={wageringMultiplier}
                            onChange={(e) => setWageringMultiplier(Number(e.target.value))}
                            className="w-full px-4 py-3 border border-slate-500/40 rounded-lg text-slate-100 bg-slate-800/50 backdrop-blur-sm focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30 focus:outline-none transition-all text-base"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm text-slate-300 mb-2 font-semibold">Maximum Amount (EUR)</label>
                    <input
                        type="number"
                        value={maxAmountEUR}
                        onChange={(e) => setMaxAmountEUR(Number(e.target.value))}
                        className="w-full px-4 py-3 border border-slate-500/40 rounded-lg text-slate-100 bg-slate-800/50 backdrop-blur-sm focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30 focus:outline-none transition-all text-base"
                    />
                    <p className="text-xs text-slate-400 mt-1">Will fetch all currencies from admin config</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm text-slate-300 mb-2 font-semibold">Min Stake to Wager (EUR)</label>
                        <select
                            value={minStakeEUR}
                            onChange={(e) => setMinStakeEUR(Number(e.target.value))}
                            className="w-full px-4 py-3 border border-slate-500/40 rounded-lg text-slate-100 bg-slate-800/50 backdrop-blur-sm focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30 focus:outline-none transition-all text-base cursor-pointer"
                        >
                            <option value="">-- Select Min Stake --</option>
                            {adminConfig?.minimum_stake_to_wager?.map((table) => (
                                <option key={table.id} value={table.values.EUR}>
                                    {table.name} (EUR: {table.values.EUR})
                                </option>
                            ))}
                        </select>
                        {adminConfig?.minimum_stake_to_wager && adminConfig.minimum_stake_to_wager.length === 0 && (
                            <p className="text-xs text-red-400 mt-1">No tables available in admin config</p>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm text-slate-300 mb-2 font-semibold">Max Stake to Wager (EUR)</label>
                        <select
                            value={maxStakeEUR}
                            onChange={(e) => setMaxStakeEUR(Number(e.target.value))}
                            className="w-full px-4 py-3 border border-slate-500/40 rounded-lg text-slate-100 bg-slate-800/50 backdrop-blur-sm focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30 focus:outline-none transition-all text-base cursor-pointer"
                        >
                            <option value="">-- Select Max Stake --</option>
                            {adminConfig?.maximum_stake_to_wager?.map((table) => (
                                <option key={table.id} value={table.values.EUR}>
                                    {table.name} (EUR: {table.values.EUR})
                                </option>
                            ))}
                        </select>
                        {adminConfig?.maximum_stake_to_wager && adminConfig.maximum_stake_to_wager.length === 0 && (
                            <p className="text-xs text-red-400 mt-1">No tables available in admin config</p>
                        )}
                    </div>
                </div>

                <div>
                    <label className="block text-sm text-slate-300 mb-2 font-semibold">Maximum Withdraw</label>
                    <div className="w-full px-4 py-3 border border-slate-500/40 rounded-lg text-slate-100 bg-slate-800/50 backdrop-blur-sm text-base">
                        EUR: 5
                    </div>
                </div>

                <div>
                    <label className="block text-sm text-slate-300 mb-2 font-semibold">Expiry</label>
                    <input
                        type="text"
                        value={expiry}
                        onChange={(e) => setExpiry(e.target.value)}
                        placeholder="e.g., 7d"
                        className="w-full px-4 py-3 border border-slate-500/40 rounded-lg text-slate-100 bg-slate-800/50 backdrop-blur-sm focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30 focus:outline-none transition-all text-base"
                    />
                </div>

                {/* Proportions Section - Radio Buttons */}
                <div className="p-3 bg-slate-700/30 rounded border border-cyan-400/20 mt-4">
                    <label className="block text-sm font-semibold text-slate-300 mb-3">🎰 Proportions *</label>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Proportions Type</label>
                        <div className="flex gap-4">
                            <label className="flex items-center text-sm font-medium text-slate-300 cursor-pointer">
                                <input
                                    type="radio"
                                    checked={proportionsType === 'none'}
                                    onChange={() => setProportionsType('none')}
                                    className="mr-2 w-4 h-4"
                                />
                                ❌ No Proportions
                            </label>
                            <label className="flex items-center text-sm font-medium text-slate-300 cursor-pointer">
                                <input
                                    type="radio"
                                    checked={proportionsType === 'casino'}
                                    onChange={() => setProportionsType('casino')}
                                    className="mr-2 w-4 h-4"
                                />
                                🎰 Casino
                            </label>
                            <label className="flex items-center text-sm font-medium text-slate-300 cursor-pointer">
                                <input
                                    type="radio"
                                    checked={proportionsType === 'live_casino'}
                                    onChange={() => setProportionsType('live_casino')}
                                    className="mr-2 w-4 h-4"
                                />
                                🎭 Live Casino
                            </label>
                        </div>
                        <p className="text-xs text-slate-400 mt-2">Proportions values come from Admin Setup</p>
                    </div>
                </div>
            </div>

            {/* Boolean Flags */}
            <div className="bg-slate-800 p-6 rounded-lg space-y-3">
                <h3 className="text-lg font-semibold text-white mb-4">⚡ Flags</h3>

                <label className="flex items-center gap-2 text-slate-300">
                    <input
                        type="checkbox"
                        checked={withdrawActive}
                        onChange={(e) => setWithdrawActive(e.target.checked)}
                        className="w-4 h-4"
                    />
                    Withdraw Active
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
