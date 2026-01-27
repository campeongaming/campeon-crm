'use client';

import React, { useState, useCallback, useEffect } from 'react';
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
    currency_unit?: CurrencyTable[];
    minimum_stake_to_wager?: CurrencyTable[];
    maximum_stake_to_wager?: CurrencyTable[];
    maximum_bets?: CurrencyTable[];
}

const CURRENCIES = ['EUR', 'USD', 'CAD', 'AUD', 'BRL', 'NOK', 'NZD', 'CLP', 'MXN', 'GBP', 'PLN', 'PEN', 'ZAR', 'CHF', 'NGN', 'JPY', 'AZN', 'TRY', 'KZT', 'RUB', 'UZS'];
const SUPPORTED_LOCALES = ['en', 'de', 'fi', 'no', 'pt', 'fr', 'es', 'it', 'pl', 'ru', 'et'];

export default function AwardFreeSpins({ notes, setNotes, onBonusSaved }: { notes: string; setNotes: (value: string) => void; onBonusSaved?: () => void }) {
    // ============ STATE ============
    const [bonusId, setBonusId] = useState('');
    const [provider, setProvider] = useState('PRAGMATIC');
    const [adminConfig, setAdminConfig] = useState<AdminConfig | null>(null);
    const [loadingAdmin, setLoadingAdmin] = useState(false);
    const [matchedCostTable, setMatchedCostTable] = useState<Record<string, number> | null>(null);

    // Basic info
    const [gameId, setGameId] = useState('');

    // Schedule (optional)
    const [scheduleFrom, setScheduleFrom] = useState('');
    const [scheduleTo, setScheduleTo] = useState('');
    const [scheduleTimezone, setScheduleTimezone] = useState('');

    // Trigger section
    const [minimumAmountEUR, setMinimumAmountEUR] = useState<number | ''>('');
    const [iterations, setIterations] = useState<number | ''>('');
    const [triggerType, setTriggerType] = useState('deposit');
    const [duration, setDuration] = useState('7d');
    const [restrictedCountries, setRestrictedCountries] = useState<string[]>([]);
    const [countryInput, setCountryInput] = useState('');
    const [allowedCountries, setAllowedCountries] = useState<string[]>([]);
    const [allowedCountryInput, setAllowedCountryInput] = useState('');
    const [segments, setSegments] = useState<string[]>([]);
    const [segmentInput, setSegmentInput] = useState('');

    // Config section
    const [costEUR, setCostEUR] = useState(0.12);
    const [maximumBetsEUR, setMaximumBetsEUR] = useState<number | ''>('');
    const [selectedMaxWithdrawTable, setSelectedMaxWithdrawTable] = useState('');
    const [brand, setBrand] = useState('PRAGMATIC');
    const [configType, setConfigType] = useState('free_bet');
    const [withdrawActive, setWithdrawActive] = useState(false);
    const [category, setCategory] = useState('games');
    const [maximumWithdrawEUR, setMaximumWithdrawEUR] = useState(100);
    const [game, setGame] = useState('');
    const [expiry, setExpiry] = useState('7d');
    const [includeAmount, setIncludeAmount] = useState(true);
    const [capCalculation, setCapCalculation] = useState(false);

    // Up To feature - FS/EUR ratio only (total FS comes from maximumBetsEUR)
    const [upTo, setUpTo] = useState(false);
    const [upToFsPerEuro, setUpToFsPerEuro] = useState(10);

    // Validation
    const [errors, setErrors] = useState<string[]>([]);

    // ============ FETCH ADMIN CONFIG ============
    useEffect(() => {
        const fetchAdminConfig = async () => {
            try {
                setLoadingAdmin(true);

                // Fetch cost from provider (PRAGMATIC/BETSOFT)
                console.log(`🔍 Fetching from ${provider} provider for cost tables...`);
                const providerResponse = await axios.get(`http://localhost:8000/api/stable-config/${provider}/with-tables`);

                // Fetch all other tables from DEFAULT (minimum_amount, maximum_withdraw, stakes, amounts, etc.)
                console.log('🔍 Fetching from DEFAULT provider for other tables...');
                const defaultResponse = await axios.get(`http://localhost:8000/api/stable-config/DEFAULT/with-tables`);

                // Merge: cost from provider, everything else from DEFAULT
                const mergedConfig: AdminConfig = {
                    ...defaultResponse.data,
                    cost: providerResponse.data.cost || [],
                };

                setAdminConfig(mergedConfig);
                console.log('✅ Fetched admin config - cost from', provider, ', other tables from DEFAULT:', mergedConfig);
            } catch (err) {
                console.error('Failed to fetch admin config:', err);
                setAdminConfig(null);
            } finally {
                setLoadingAdmin(false);
            }
        };

        fetchAdminConfig();
    }, [provider]);

    // ============ FETCH PRICING TABLE BY COST ============
    const fetchPricingTableByCost = async (costValue: number) => {
        try {
            setLoadingAdmin(true);
            const response = await axios.get(`http://localhost:8000/api/stable-config/${provider}?cost_only=true`);
            const config = response.data as AdminConfig;

            // Search for cost table matching this EUR value
            if (config.cost && Array.isArray(config.cost)) {
                let matchedTable = null;
                const tolerance = 0.001; // Allow small floating point differences

                // Find table where EUR value is close to costValue
                for (const table of config.cost) {
                    if (table.values && Math.abs(table.values.EUR - costValue) < tolerance) {
                        matchedTable = table;
                        break;
                    }
                }

                if (matchedTable && matchedTable.values) {
                    // ✅ SAVE the matched table for later use (only for cost lookup)
                    setMatchedCostTable(matchedTable.values);
                    console.log('✅ Matched cost table with EUR ≈', costValue, ':', matchedTable.values);
                } else {
                    console.warn('⚠️ No cost table found with EUR ≈', costValue);
                    setMatchedCostTable(null);
                }
            }
        } catch (err) {
            console.error('Failed to fetch pricing table by cost:', err);
            setMatchedCostTable(null);
        } finally {
            setLoadingAdmin(false);
        }
    };

    // Handle cost change - fetch table when cost is set
    const handleCostChange = (newCost: number) => {
        setCostEUR(newCost);
        if (newCost > 0) {
            fetchPricingTableByCost(newCost);
        }
    };

    const handleMaxWithdrawTableChange = (tableId: string) => {
        setSelectedMaxWithdrawTable(tableId);
        if (adminConfig && adminConfig.maximum_withdraw) {
            const table = adminConfig.maximum_withdraw.find(t => t.id === tableId);
            if (table && table.values['EUR']) {
                setMaximumWithdrawEUR(table.values['EUR']);
            }
        }
    };

    // ============ BUILD CURRENCY MAP FROM ADMIN ============
    const buildCurrencyMap = (
        eurValue: number,
        fieldName: 'minimum_amount' | 'cost' | 'maximum_withdraw' | 'maximum_bets'
    ): Record<string, number> => {
        const tolerance = 0.001;

        // 🎯 For cost field, ALWAYS search for matching table by EUR value
        if (fieldName === 'cost' && adminConfig && adminConfig.cost) {
            for (const table of adminConfig.cost) {
                if (table.values && Math.abs(table.values.EUR - eurValue) < tolerance) {
                    console.log('✅ Found matching cost table for EUR =', eurValue, ':', table.values);
                    // "*" is ALWAYS the EUR value
                    return { '*': table.values.EUR, ...table.values };
                }
            }
            console.warn('⚠️ No exact cost table found for EUR =', eurValue, '- using defaults');
        }

        // 🎯 For minimum_amount field, use deposit multipliers: multiply EUR value by each currency multiplier
        if (fieldName === 'minimum_amount' && adminConfig && adminConfig.minimum_amount) {
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

        // 🎯 For maximum_withdraw field, search admin config tables
        if (fieldName === 'maximum_withdraw' && adminConfig && adminConfig.maximum_withdraw) {
            for (const table of adminConfig.maximum_withdraw) {
                if (table.values && Math.abs(table.values.EUR - eurValue) < tolerance) {
                    console.log('✅ Found matching maximum_withdraw table for EUR =', eurValue, ':', table.values);
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

    // ============ CALCULATE MULTIPLIER ============
    const buildMultiplierMap = (): Record<string, number> => {
        const costMap = buildCurrencyMap(costEUR, 'cost');
        const multiplierMap: Record<string, number> = {};

        CURRENCIES.forEach(curr => {
            const cost = costMap[curr] || costEUR;
            if (cost > 0) {
                if (upTo) {
                    // When Up To is enabled: multiplier = (FS/EUR * cost) / currencyUnit
                    // Get currency unit for this currency (default to 1 if not found)
                    let currencyUnitValue = 1;
                    if (adminConfig?.currency_unit && adminConfig.currency_unit.length > 0) {
                        const unitTable = adminConfig.currency_unit[0];
                        currencyUnitValue = unitTable.values?.[curr] || 1;
                    }

                    const multiplier = (upToFsPerEuro * cost) / currencyUnitValue;
                    multiplierMap[curr] = parseFloat(multiplier.toFixed(4));
                    console.log(`✅ Up To multiplier for ${curr}: (${upToFsPerEuro} * ${cost}) / ${currencyUnitValue} = ${multiplier.toFixed(4)}`);
                } else if (minimumAmountEUR !== '' && minimumAmountEUR > 0 && maximumBetsEUR !== '' && maximumBetsEUR > 0) {
                    // Original logic: multiplier = maximumBetsEUR / (minimumAmountEUR / cost)
                    const fsValue = (minimumAmountEUR as number) / cost;
                    multiplierMap[curr] = parseFloat(((maximumBetsEUR as number) / fsValue).toFixed(4));
                } else {
                    multiplierMap[curr] = 1;
                }
            } else {
                multiplierMap[curr] = 1;
            }
        });

        return multiplierMap;
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

    // ============ ALLOWED COUNTRIES HANDLERS ============
    const handleAllowedCountryInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const input = e.target.value.toUpperCase();
        setAllowedCountryInput(input);
        // Auto-parse comma-separated values
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

        if (!bonusId.trim()) newErrors.push('Bonus ID is required');
        if (!provider.trim()) newErrors.push('Provider is required');
        if (costEUR <= 0) newErrors.push('Cost must be > 0');
        if (maximumBetsEUR !== '' && maximumBetsEUR <= 0) newErrors.push('Maximum bets must be > 0 if provided');
        if (maximumWithdrawEUR <= 0) newErrors.push('Maximum withdraw must be > 0');
        if (!game.trim()) newErrors.push('Game name is required');
        // Validate schedule only if one field is filled
        if ((scheduleFrom && !scheduleTo) || (!scheduleFrom && scheduleTo)) {
            newErrors.push('Both schedule dates required if using schedule');
        }

        setErrors(newErrors);
        return newErrors.length === 0;
    };

    // ============ BUILD & SAVE JSON ============
    const handleSave = async () => {
        if (!validate()) return;

        try {
            // Build complete JSON structure
            const bonusJson: any = {
                id: gameId,
                type: 'bonus_template',
            };

            // Schedule (only if both dates provided)
            if (scheduleFrom && scheduleTo) {
                bonusJson.schedule = {
                    type: 'period',
                    from: scheduleFrom,
                    to: scheduleTo,
                    ...(scheduleTimezone && { timezone: scheduleTimezone })
                };
            }

            // Trigger
            bonusJson.trigger = {
                type: triggerType,
                duration: duration,
            };

            // Only include minimumAmount if value > 0
            if (minimumAmountEUR !== '' && minimumAmountEUR > 0) {
                bonusJson.trigger.minimumAmount = buildCurrencyMap(minimumAmountEUR as number, 'minimum_amount');
            }

            // Only include iterations if value > 0
            if (iterations !== '' && iterations > 0) {
                bonusJson.trigger.iterations = iterations;
            }

            if (restrictedCountries.length > 0) {
                bonusJson.trigger.restrictedCountries = restrictedCountries;
            }

            if (allowedCountries.length > 0) {
                bonusJson.trigger.allowedCountries = allowedCountries;
            }

            // Config
            const multiplierMap = buildMultiplierMap();
            const maxWithdrawMap = buildCurrencyMap(maximumWithdrawEUR, 'maximum_withdraw');
            const maxWithdrawObjects: Record<string, { cap: number }> = {};

            Object.entries(maxWithdrawMap).forEach(([currency, value]) => {
                maxWithdrawObjects[currency] = { cap: value };
            });

            bonusJson.config = {
                cost: buildCurrencyMap(costEUR, 'cost'),
                multiplier: multiplierMap,
                ...(maximumBetsEUR !== '' && maximumBetsEUR > 0 && { maximumBets: buildCurrencyMap(maximumBetsEUR as number, 'maximum_bets') }),
                maximumWithdraw: maxWithdrawObjects,
                provider: provider,
                brand: brand,
                type: configType,
                withdrawActive: withdrawActive,
                category: category,
                extra: { game: game },
                expiry: expiry,
            };

            // Flatten for database storage
            const payload: any = {
                id: bonusId,
                bonus_type: 'free_spins',
                trigger_type: triggerType,
                trigger_duration: duration,
                ...(iterations !== '' && iterations > 0 && { trigger_iterations: iterations }),
                category: category,
                provider: provider,
                brand: provider,
                config_type: configType,
                game: game,
                expiry: expiry,
                ...(minimumAmountEUR !== '' && minimumAmountEUR > 0 && { minimum_amount: buildCurrencyMap(minimumAmountEUR as number, 'minimum_amount') }),
                cost: buildCurrencyMap(costEUR, 'cost'),
                multiplier: buildMultiplierMap(),
                ...(maximumBetsEUR !== '' && maximumBetsEUR > 0 && { maximum_bets: buildCurrencyMap(maximumBetsEUR as number, 'maximum_bets') }),
                maximum_withdraw: buildCurrencyMap(maximumWithdrawEUR, 'maximum_withdraw'),
                include_amount_on_target_wager: includeAmount,
                cap_calculation_to_maximum: capCalculation,
                withdraw_active: withdrawActive,
                ...(restrictedCountries.length > 0 && { restricted_countries: restrictedCountries }),
                ...(allowedCountries.length > 0 && { allowed_countries: allowedCountries }),
                ...(segments.length > 0 && { segments: segments }),
                notes: notes || undefined,
                ...(scheduleFrom && scheduleTo && {
                    schedule_from: formatDateTimeForPayload(scheduleFrom),
                    schedule_to: formatDateTimeForPayload(scheduleTo),
                    schedule_type: 'period',
                    ...(scheduleTimezone && { timezone: scheduleTimezone })
                }),
                config_extra: { game: game },
                up_to: upTo,
                ...(upTo && { up_to_fs_per_euro: upToFsPerEuro }),
            };

            // Save to database
            await axios.post('http://localhost:8000/api/bonus-templates', payload);

            // Also save the complete JSON for reference
            console.log('Complete Bonus JSON:', JSON.stringify(bonusJson, null, 2));

            alert(`✅ Free Spins Bonus "${bonusId}" saved successfully!`);
            onBonusSaved?.();

            // Reset form
            setBonusId('');
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
        <div className="space-y-5">
            {/* Header */}
            <div className="bg-gradient-to-br from-cyan-500/90 via-blue-500/90 to-indigo-500/90 p-8 rounded-2xl shadow-xl backdrop-blur-sm border border-white/10">
                <h2 className="text-3xl font-bold text-white drop-shadow-md">🎫 Award Free Spins</h2>
                <p className="text-cyan-50 mt-3 text-lg font-medium">Create a free spins bonus with customizable parameters</p>
            </div>

            {/* Errors */}
            {errors.length > 0 && (
                <div className="bg-red-500/10 border border-red-400/40 rounded-xl p-5 backdrop-blur-sm shadow-md">
                    <p className="font-semibold text-red-100 mb-3 text-lg">⚠️ Validation Errors:</p>
                    {errors.map((err, i) => (
                        <p key={i} className="text-red-200 text-base">• {err}</p>
                    ))}
                </div>
            )}

            <div className="space-y-4">
                {/* Bonus Setup - All in one box */}
                <div className="p-6 bg-slate-700/20 rounded-xl border border-purple-400/20 backdrop-blur-sm shadow-lg">
                    <h3 className="text-xl font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent mb-6">🏷️ Bonus Setup</h3>

                    {/* Bonus ID and Provider */}
                    <div className="grid grid-cols-2 gap-4 mb-6 pb-6 border-b border-slate-600/30">
                        <div>
                            <label className="block text-sm text-slate-300 mb-2 font-semibold">Bonus ID</label>
                            <input
                                type="text"
                                value={bonusId}
                                onChange={(e) => setBonusId(e.target.value)}
                                placeholder="e.g., FREE_SPINS_600_BONUS"
                                className="w-full px-4 py-3 border border-slate-500/40 rounded-lg text-slate-100 bg-slate-800/50 backdrop-blur-sm focus:border-purple-400 focus:ring-2 focus:ring-purple-400/30 focus:outline-none transition-all text-base"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-300 mb-2 font-semibold">Provider</label>
                            <select
                                value={provider}
                                onChange={(e) => setProvider(e.target.value)}
                                className="w-full px-4 py-3 border border-slate-500/40 rounded-lg text-slate-100 bg-slate-800/50 backdrop-blur-sm focus:border-purple-400 focus:ring-2 focus:ring-purple-400/30 focus:outline-none transition-all text-base cursor-pointer"
                            >
                                <option value="PRAGMATIC">PRAGMATIC</option>
                                <option value="BETSOFT">BETSOFT</option>
                            </select>
                        </div>
                    </div>

                    {/* Segments */}
                    <div className="mb-6 pb-6 border-b border-slate-600/30">
                        <label className="block text-sm font-semibold text-slate-300 mb-3">📋 Segments (Optional)</label>
                        <div className="flex gap-2 mb-3">
                            <input
                                type="text"
                                value={segmentInput}
                                onChange={handleSegmentInputChange}
                                onKeyDown={handleSegmentKeyDown}
                                onBlur={handleSegmentBlur}
                                placeholder="Press Enter to add segment"
                                className="flex-1 px-4 py-2 border border-slate-600 rounded-lg text-slate-100 bg-slate-900/60 placeholder-slate-500 focus:border-purple-400 focus:ring-1 focus:ring-purple-400/30"
                            />
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {segments.map((segment, idx) => (
                                <div key={idx} className="flex items-center gap-1 px-3 py-1 bg-blue-900/40 border border-blue-500/40 rounded-full text-sm">
                                    {segment}
                                    <button
                                        onClick={() => handleRemoveSegment(idx)}
                                        className="text-red-300 hover:text-red-800 font-bold cursor-pointer"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
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
                                placeholder="e.g., DE, SE, NO - Press Enter to add"
                                className="flex-1 px-4 py-2 border border-slate-600 rounded-lg text-slate-100 bg-slate-900/60 placeholder-slate-500 focus:border-purple-400 focus:ring-1 focus:ring-purple-400/30"
                            />
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {allowedCountries.map((country, idx) => (
                                <div key={idx} className="flex items-center gap-1 px-3 py-1 bg-green-900/40 border border-green-500/40 rounded-full text-sm text-green-200">
                                    {country}
                                    <button
                                        onClick={() => handleRemoveAllowedCountry(idx)}
                                        className="text-green-300 hover:text-green-100 font-bold cursor-pointer"
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
                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <label className="block text-xs text-slate-400 mb-2">From</label>
                                <input
                                    type="datetime-local"
                                    value={scheduleFrom}
                                    onChange={(e) => setScheduleFrom(e.target.value)}
                                    className="w-full px-4 py-2 border border-slate-600 rounded-lg text-slate-100 bg-slate-900/60 focus:border-purple-400 focus:ring-1 focus:ring-purple-400/30 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-slate-400 mb-2">To</label>
                                <input
                                    type="datetime-local"
                                    value={scheduleTo}
                                    onChange={(e) => setScheduleTo(e.target.value)}
                                    className="w-full px-4 py-2 border border-slate-600 rounded-lg text-slate-100 bg-slate-900/60 focus:border-purple-400 focus:ring-1 focus:ring-purple-400/30 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-slate-400 mb-2">Timezone</label>
                                <input
                                    type="text"
                                    value={scheduleTimezone}
                                    onChange={(e) => setScheduleTimezone(e.target.value)}
                                    placeholder="CET, UTC, EST"
                                    className="w-full px-4 py-2 border border-slate-600 rounded-lg text-slate-100 bg-slate-900/60 placeholder-slate-500 focus:border-purple-400 focus:ring-1 focus:ring-purple-400/30 text-sm"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* ============ TRIGGER ============ */}
                <div className="p-6 bg-slate-700/20 rounded-xl border border-amber-400/20 backdrop-blur-sm shadow-lg">
                    <h3 className="text-xl font-bold bg-gradient-to-r from-amber-300 to-yellow-300 bg-clip-text text-transparent mb-6">🎯 Trigger</h3>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-2">Min Deposit (EUR) - Optional</label>
                            <input
                                type="number"
                                value={minimumAmountEUR}
                                onChange={(e) => setMinimumAmountEUR(e.target.value === '' ? '' : parseFloat(e.target.value))}
                                placeholder="Leave empty if not required"
                                className="w-full px-4 py-3 border border-slate-500/40 rounded-lg text-slate-100 bg-slate-800/50 backdrop-blur-sm focus:border-amber-400 focus:ring-2 focus:ring-amber-400/30 focus:outline-none transition-all text-base"
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-300 mb-2">Type</label>
                                <select
                                    value={triggerType}
                                    onChange={(e) => setTriggerType(e.target.value)}
                                    className="w-full px-4 py-3 border border-slate-500/40 rounded-lg text-slate-100 bg-slate-800/50 backdrop-blur-sm focus:border-amber-400 focus:ring-2 focus:ring-amber-400/30 focus:outline-none transition-all text-base cursor-pointer"
                                >
                                    <option value="deposit">Deposit</option>
                                    <option value="external">External</option>
                                    <option value="manual">Manual</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-300 mb-2">Duration</label>
                                <input
                                    type="text"
                                    value={duration}
                                    onChange={(e) => setDuration(e.target.value)}
                                    placeholder="e.g., 7d"
                                    className="w-full px-4 py-3 border border-slate-500/40 rounded-lg text-slate-100 bg-slate-800/50 backdrop-blur-sm focus:border-amber-400 focus:ring-2 focus:ring-amber-400/30 focus:outline-none transition-all text-base"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-300 mb-2">Iterations - Optional</label>
                                <input
                                    type="number"
                                    value={iterations}
                                    onChange={(e) => setIterations(e.target.value === '' ? '' : parseInt(e.target.value))}
                                    placeholder="Leave empty if not needed"
                                    className="w-full px-4 py-3 border border-slate-500/40 rounded-lg text-slate-100 bg-slate-800/50 backdrop-blur-sm focus:border-amber-400 focus:ring-2 focus:ring-amber-400/30 focus:outline-none transition-all text-base"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* ============ CONFIG ============ */}
                <div className="p-6 bg-slate-700/20 rounded-xl border border-cyan-400/20 backdrop-blur-sm shadow-lg">
                    <h3 className="text-xl font-bold bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent mb-6">⚙️ Config</h3>

                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-300 mb-2">Cost (EUR) *
                                    {loadingAdmin && <span className="text-xs text-indigo-400 ml-2">Loading table...</span>}
                                </label>
                                <input
                                    type="number"
                                    value={costEUR}
                                    onChange={(e) => handleCostChange(parseFloat(e.target.value))}
                                    step="0.01"
                                    className="w-full px-4 py-3 border border-slate-500/40 rounded-lg text-slate-100 bg-slate-800/50 backdrop-blur-sm focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30 focus:outline-none transition-all text-base"
                                />
                                <p className="text-xs text-slate-400 mt-1">💡 Enter cost to auto-load pricing table</p>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-300 mb-2">Maximum Bets (EUR)</label>
                                <input
                                    type="number"
                                    value={maximumBetsEUR}
                                    onChange={(e) => setMaximumBetsEUR(e.target.value === '' ? '' : parseFloat(e.target.value))}
                                    placeholder="e.g., 300"
                                    className="w-full px-4 py-3 border border-slate-500/40 rounded-lg text-slate-100 bg-slate-800/50 backdrop-blur-sm focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30 focus:outline-none transition-all text-base"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-2">Max Withdraw (EUR) *</label>
                            <select
                                value={selectedMaxWithdrawTable}
                                onChange={(e) => handleMaxWithdrawTableChange(e.target.value)}
                                className="w-full px-4 py-3 border border-slate-500/40 rounded-lg text-slate-100 bg-slate-800/50 backdrop-blur-sm focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30 focus:outline-none transition-all text-base cursor-pointer"
                            >
                                <option value="">-- Select Max Withdraw Table --</option>
                                {adminConfig && adminConfig.maximum_withdraw && adminConfig.maximum_withdraw.map(table => (
                                    <option key={table.id} value={table.id}>
                                        {table.name} (€{table.values['EUR']})
                                    </option>
                                ))}
                            </select>
                            {selectedMaxWithdrawTable && (
                                <div className="text-xs text-green-400 mt-2">
                                    Selected: €{maximumWithdrawEUR.toFixed(2)}
                                </div>
                            )}
                        </div>

                        {/* Up To Feature */}
                        <div className="p-4 bg-slate-700/20 rounded-lg border border-green-400/20 mt-4">
                            <label className="flex items-center text-sm font-semibold text-slate-300 mb-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={upTo}
                                    onChange={(e) => setUpTo(e.target.checked)}
                                    className="mr-2 w-4 h-4"
                                />
                                🎟️ Up To Feature
                            </label>

                            {upTo && (
                                <div className="mt-3 p-3 bg-slate-800/40 rounded-lg border border-green-400/20">
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Free Spins per EURO deposited</label>
                                    <input
                                        type="number"
                                        value={upToFsPerEuro}
                                        onChange={(e) => setUpToFsPerEuro(Number(e.target.value) || 1)}
                                        step="0.1"
                                        className="w-full px-4 py-2 border border-slate-500/40 rounded-lg text-slate-100 bg-slate-800/50 focus:border-green-400 focus:ring-1 focus:ring-green-400/30"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-300 mb-2">Brand</label>
                                <input
                                    type="text"
                                    value={brand}
                                    onChange={(e) => setBrand(e.target.value)}
                                    className="w-full px-4 py-3 border border-slate-500/40 rounded-lg text-slate-100 bg-slate-800/50 backdrop-blur-sm focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30 focus:outline-none transition-all text-base"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-300 mb-2">Type</label>
                                <input
                                    type="text"
                                    value={configType}
                                    onChange={(e) => setConfigType(e.target.value)}
                                    className="w-full px-4 py-3 border border-slate-500/40 rounded-lg text-slate-100 bg-slate-800/50 backdrop-blur-sm focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30 focus:outline-none transition-all text-base"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-300 mb-2">Category</label>
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className="w-full px-4 py-3 border border-slate-500/40 rounded-lg text-slate-100 bg-slate-800/50 backdrop-blur-sm focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30 focus:outline-none transition-all text-base cursor-pointer"
                                >
                                    <option value="games">Games</option>
                                    <option value="live_casino">Live Casino</option>
                                    <option value="sports_book">Sports Book</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-300 mb-2">Game</label>
                                <input
                                    type="text"
                                    value={game}
                                    onChange={(e) => setGame(e.target.value)}
                                    placeholder="e.g., Bigger Bass Blizzard"
                                    className="w-full px-4 py-3 border border-slate-500/40 rounded-lg text-slate-100 bg-slate-800/50 backdrop-blur-sm focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30 focus:outline-none transition-all text-base"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-2">Expiry</label>
                            <input
                                type="text"
                                value={expiry}
                                onChange={(e) => setExpiry(e.target.value)}
                                placeholder="e.g., 7d"
                                className="w-full px-4 py-3 border border-slate-500/40 rounded-lg text-slate-100 bg-slate-800/50 backdrop-blur-sm focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30 focus:outline-none transition-all text-base"
                            />
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
                </div>

                {/* Save Button */}
                <button
                    onClick={handleSave}
                    className="w-full px-5 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-purple-500/20"
                >
                    💾 Save Free Spins Bonus
                </button>
            </div>
        </div>
    );
}
