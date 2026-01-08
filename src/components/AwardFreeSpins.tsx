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
}

const CURRENCIES = ['EUR', 'USD', 'CAD', 'AUD', 'BRL', 'NOK', 'NZD', 'CLP', 'MXN', 'GBP', 'PLN', 'PEN', 'ZAR', 'CHF', 'NGN', 'JPY', 'AZN', 'TRY', 'KZT', 'RUB', 'UZS'];
const SUPPORTED_LOCALES = ['en', 'de', 'fi', 'no', 'pt', 'fr', 'es', 'it', 'pl', 'ru', 'et'];

export default function AwardFreeSpins({ onBonusSaved }: { onBonusSaved?: () => void }) {
    // ============ STATE ============
    const [provider, setProvider] = useState('PRAGMATIC');
    const [adminConfig, setAdminConfig] = useState<AdminConfig | null>(null);
    const [loadingAdmin, setLoadingAdmin] = useState(false);
    const [matchedCostTable, setMatchedCostTable] = useState<Record<string, number> | null>(null);

    // Basic info
    const [gameId, setGameId] = useState('');

    // Schedule (optional)
    const [withSchedule, setWithSchedule] = useState(false);
    const [scheduleFrom, setScheduleFrom] = useState('');
    const [scheduleTo, setScheduleTo] = useState('');

    // Trigger section
    const [triggerName, setTriggerName] = useState('');
    const [triggerDescription, setTriggerDescription] = useState('');
    const [minimumAmountEUR, setMinimumAmountEUR] = useState(50);
    const [iterations, setIterations] = useState(1);
    const [iterationsOptional, setIterationsOptional] = useState(false);
    const [triggerType, setTriggerType] = useState('deposit');
    const [duration, setDuration] = useState('7d');
    const [restrictedCountries, setRestrictedCountries] = useState<string[]>([]);
    const [countryInput, setCountryInput] = useState('');

    // Config section
    const [costEUR, setCostEUR] = useState(0.12);
    const [maximumBets, setMaximumBets] = useState(600);
    const [brand, setBrand] = useState('PRAGMATIC');
    const [configType, setConfigType] = useState('free_bet');
    const [withdrawActive, setWithdrawActive] = useState(false);
    const [category, setCategory] = useState('games');
    const [maximumWithdrawEUR, setMaximumWithdrawEUR] = useState(100);
    const [game, setGame] = useState('');
    const [expiry, setExpiry] = useState('7d');
    const [includeAmount, setIncludeAmount] = useState(true);
    const [capCalculation, setCapCalculation] = useState(false);
    const [compensateOverspend, setCompensateOverspend] = useState(true);

    // Validation
    const [errors, setErrors] = useState<string[]>([]);

    // ============ FETCH ADMIN CONFIG ============
    useEffect(() => {
        const fetchAdminConfig = async () => {
            try {
                setLoadingAdmin(true);
                const response = await axios.get(`http://localhost:8000/api/stable-config/${provider}`);
                setAdminConfig(response.data);
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
            const response = await axios.get(`http://localhost:8000/api/stable-config/${provider}`);
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
                    // ✅ SAVE the matched table for later use
                    setMatchedCostTable(matchedTable.values);
                    console.log('✅ Matched cost table with EUR ≈', costValue, ':', matchedTable.values);

                    // Set minimum amount based on EUR value from table
                    setMinimumAmountEUR(matchedTable.values.EUR * 250);

                    // Set maximum withdraw from admin config if available
                    if (config.maximum_withdraw && Array.isArray(config.maximum_withdraw)) {
                        const withdrawTable = config.maximum_withdraw[0];
                        if (withdrawTable && withdrawTable.values) {
                            const eurWithdraw = withdrawTable.values.EUR || Object.values(withdrawTable.values)[0];
                            if (eurWithdraw) {
                                setMaximumWithdrawEUR(eurWithdraw);
                            }
                        }
                    }
                } else {
                    console.warn('⚠️ No cost table found with EUR ≈', costValue);
                    setMatchedCostTable(null);
                }
            }

            setAdminConfig(config);
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

    // ============ BUILD CURRENCY MAP FROM ADMIN ============
    const buildCurrencyMap = (eurValue: number, fieldName: 'minimum_amount' | 'cost' | 'maximum_withdraw'): Record<string, number> => {
        // 🎯 For cost field, ALWAYS search for matching table by EUR value
        if (fieldName === 'cost' && adminConfig && adminConfig.cost) {
            const tolerance = 0.001;
            for (const table of adminConfig.cost) {
                if (table.values && Math.abs(table.values.EUR - eurValue) < tolerance) {
                    console.log('✅ Found matching cost table for EUR =', eurValue, ':', table.values);
                    // "*" is ALWAYS the EUR value
                    return { '*': table.values.EUR, ...table.values };
                }
            }
            console.warn('⚠️ No exact cost table found for EUR =', eurValue, '- using defaults');
        }

        // Otherwise build from admin config or use default
        // "*" is ALWAYS EUR value
        const map: Record<string, number> = { '*': eurValue };

        if (!adminConfig || !adminConfig[fieldName]) {
            CURRENCIES.forEach(curr => {
                map[curr] = eurValue;
            });
            return map;
        }

        const tables = adminConfig[fieldName];
        if (Array.isArray(tables) && tables.length > 0) {
            const table = tables[0];
            // Get EUR value from table for "*"
            map['*'] = table.values.EUR || eurValue;
            CURRENCIES.forEach(curr => {
                map[curr] = table.values[curr] || eurValue;
            });
        } else {
            CURRENCIES.forEach(curr => {
                map[curr] = eurValue;
            });
        }

        return map;
    };

    // ============ CALCULATE MULTIPLIER ============
    const buildMultiplierMap = (): Record<string, number> => {
        const minimumAmountMap = buildCurrencyMap(minimumAmountEUR, 'minimum_amount');
        const costMap = buildCurrencyMap(costEUR, 'cost');
        const multiplierMap: Record<string, number> = {};

        CURRENCIES.forEach(curr => {
            const minAmount = minimumAmountMap[curr] || minimumAmountEUR;
            const cost = costMap[curr] || costEUR;
            if (cost > 0) {
                const fsValue = minAmount / cost;
                multiplierMap[curr] = parseFloat((maximumBets / fsValue).toFixed(4));
            } else {
                multiplierMap[curr] = 1;
            }
        });

        return multiplierMap;
    };

    // ============ BUILD TRIGGER NAME MAP ============
    const buildTriggerNameMap = (): Record<string, string> | null => {
        if (!triggerName.trim()) return null;

        const nameMap: Record<string, string> = {
            en: triggerName,
            GBP_en: triggerName,
            USD_en: triggerName,
            AUD_en: triggerName,
            NZD_en: triggerName,
            CAD_en: triggerName,
            de: triggerName,
            fr: triggerName,
            fi: triggerName,
            NOK_no: triggerName,
            EUR_no: triggerName,
            EUR_pt: triggerName,
            BRL_pt: triggerName,
            es: triggerName,
            CLP_es: triggerName,
            it: triggerName,
            EUR_pl: triggerName,
            PLN_pl: triggerName,
            CAD_fr: triggerName,
            RUB_ru: triggerName,
            KZT_ru: triggerName,
            et: triggerName,
        };

        return nameMap;
    };

    // ============ ADD COUNTRY ============
    const handleAddCountry = () => {
        if (countryInput.trim() && !restrictedCountries.includes(countryInput)) {
            setRestrictedCountries([...restrictedCountries, countryInput.toUpperCase()]);
            setCountryInput('');
        }
    };

    const handleRemoveCountry = (idx: number) => {
        setRestrictedCountries(restrictedCountries.filter((_, i) => i !== idx));
    };

    // ============ VALIDATION ============
    const validate = (): boolean => {
        const newErrors: string[] = [];

        if (!gameId.trim()) newErrors.push('Game ID is required');
        if (!triggerName.trim()) newErrors.push('Trigger name is required');
        if (minimumAmountEUR <= 0) newErrors.push('Minimum amount must be > 0');
        if (costEUR <= 0) newErrors.push('Cost must be > 0');
        if (maximumBets <= 0) newErrors.push('Maximum bets must be > 0');
        if (maximumWithdrawEUR <= 0) newErrors.push('Maximum withdraw must be > 0');
        if (!game.trim()) newErrors.push('Game name is required');
        if (withSchedule && (!scheduleFrom || !scheduleTo)) newErrors.push('Both schedule dates required if enabled');

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

            // Schedule
            if (withSchedule && scheduleFrom && scheduleTo) {
                bonusJson.schedule = {
                    type: 'period',
                    from: scheduleFrom,
                    to: scheduleTo,
                };
            }

            // Trigger
            const triggerNameMap = buildTriggerNameMap();
            bonusJson.trigger = {
                name: triggerNameMap || { en: 'Free Spins' },
                type: triggerType,
                duration: duration,
                minimumAmount: buildCurrencyMap(minimumAmountEUR, 'minimum_amount'),
            };

            if (triggerDescription.trim()) {
                bonusJson.trigger.description = triggerDescription;
            }

            if (iterationsOptional && iterations > 1) {
                bonusJson.trigger.iterations = iterations;
            }

            if (restrictedCountries.length > 0) {
                bonusJson.trigger.restrictedCountries = restrictedCountries;
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
                maximumBets: Object.fromEntries(CURRENCIES.map(c => [c, maximumBets])),
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
                id: gameId,
                bonus_type: triggerType,
                trigger_type: triggerType,
                trigger_name: triggerNameMap || { en: 'Free Spins' },
                trigger_description: triggerDescription ? { '*': triggerDescription } : { '*': '' },
                trigger_duration: duration,
                trigger_iterations: iterationsOptional ? iterations : 1,
                category: category,
                provider: provider,
                brand: brand,
                config_type: configType,
                game: game,
                expiry: expiry,
                percentage: 100,
                wagering_multiplier: 1,
                minimum_amount: buildCurrencyMap(minimumAmountEUR, 'minimum_amount'),
                cost: buildCurrencyMap(costEUR, 'cost'),
                multiplier: buildMultiplierMap(),
                maximum_bets: Object.fromEntries(CURRENCIES.map(c => [c, maximumBets])),
                minimum_stake_to_wager: Object.fromEntries(CURRENCIES.map(c => [c, 0])),
                maximum_stake_to_wager: Object.fromEntries(CURRENCIES.map(c => [c, maximumBets])),
                maximum_amount: buildCurrencyMap(maximumWithdrawEUR, 'maximum_withdraw'),
                maximum_withdraw: buildCurrencyMap(maximumWithdrawEUR, 'maximum_withdraw'),
                include_amount_on_target_wager: includeAmount,
                cap_calculation_to_maximum: capCalculation,
                compensate_overspending: compensateOverspend,
                withdraw_active: withdrawActive,
                restricted_countries: restrictedCountries.length > 0 ? restrictedCountries : null,
                config_extra: { game: game },
            };

            // Save to database
            await axios.post('http://localhost:8000/api/bonus-templates', payload);

            // Also save the complete JSON for reference
            console.log('Complete Bonus JSON:', JSON.stringify(bonusJson, null, 2));

            alert(`✅ Free Spins Bonus "${gameId}" saved successfully!`);
            onBonusSaved?.();

            // Reset form
            setGameId('');
            setTriggerName('');
            setTriggerDescription('');
            setRestrictedCountries([]);
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
        <div className="max-w-5xl mx-auto p-6 bg-white rounded-lg">
            <h2 className="text-3xl font-bold mb-6 text-gray-800">🎰 Award Free Spins</h2>

            {/* Errors */}
            {errors.length > 0 && (
                <div className="mb-6 p-4 bg-red-50 border border-red-300 rounded-lg">
                    <p className="font-semibold text-red-700 mb-2">⚠️ Errors:</p>
                    {errors.map((err, i) => (
                        <p key={i} className="text-red-600 text-sm">• {err}</p>
                    ))}
                </div>
            )}

            <div className="space-y-6">
                {/* Game ID */}
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-300">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Game ID *</label>
                    <input
                        type="text"
                        value={gameId}
                        onChange={(e) => setGameId(e.target.value)}
                        placeholder="e.g., Deposit 50 Get 600 FS on Bigger Bass Blizzard"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                    />
                </div>

                {/* Provider Selection */}
                <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-300">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Provider</label>
                    <select
                        value={provider}
                        onChange={(e) => setProvider(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                    >
                        <option value="PRAGMATIC">PRAGMATIC</option>
                        <option value="BETSOFT">BETSOFT</option>
                    </select>
                    {loadingAdmin && <p className="text-xs text-indigo-600 mt-2">📡 Fetching admin pricing...</p>}
                </div>

                {/* ============ SCHEDULE (OPTIONAL) ============ */}
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-300">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">📅 Schedule (Optional)</h3>

                    <label className="flex items-center text-sm font-medium text-gray-700 mb-4 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={withSchedule}
                            onChange={(e) => setWithSchedule(e.target.checked)}
                            className="mr-2 w-4 h-4"
                        />
                        Enable time-boxed promo
                    </label>

                    {withSchedule && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
                                <input
                                    type="datetime-local"
                                    value={scheduleFrom}
                                    onChange={(e) => setScheduleFrom(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                                <input
                                    type="datetime-local"
                                    value={scheduleTo}
                                    onChange={(e) => setScheduleTo(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* ============ TRIGGER ============ */}
                <div className="p-4 bg-amber-50 rounded-lg border border-amber-300">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">🎯 Trigger</h3>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                            <input
                                type="text"
                                value={triggerName}
                                onChange={(e) => setTriggerName(e.target.value)}
                                placeholder="e.g., 600 FS on Bigger Bass Blizzard with x20 wagering"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                            <input
                                type="text"
                                value={triggerDescription}
                                onChange={(e) => setTriggerDescription(e.target.value)}
                                placeholder="Additional details..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Min Deposit (EUR) *</label>
                                <input
                                    type="number"
                                    value={minimumAmountEUR}
                                    onChange={(e) => setMinimumAmountEUR(parseFloat(e.target.value))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                <select
                                    value={triggerType}
                                    onChange={(e) => setTriggerType(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                                >
                                    <option value="deposit">Deposit</option>
                                    <option value="external">External</option>
                                    <option value="manual">Manual</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                                <input
                                    type="text"
                                    value={duration}
                                    onChange={(e) => setDuration(e.target.value)}
                                    placeholder="e.g., 7d"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                                />
                            </div>

                            <div>
                                <label className="flex items-center text-sm font-medium text-gray-700 cursor-pointer">
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

                        {/* Restricted Countries */}
                        <div className="p-3 bg-white rounded border border-amber-200">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Restricted Countries (Optional)</label>
                            <div className="flex gap-2 mb-2">
                                <input
                                    type="text"
                                    value={countryInput}
                                    onChange={(e) => setCountryInput(e.target.value.toUpperCase())}
                                    placeholder="e.g., BR, AU, NZ"
                                    maxLength={2}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                                />
                                <button
                                    onClick={handleAddCountry}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                                >
                                    Add
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {restrictedCountries.map((country, idx) => (
                                    <div key={idx} className="flex items-center gap-1 px-3 py-1 bg-blue-100 rounded-full text-sm">
                                        {country}
                                        <button
                                            onClick={() => handleRemoveCountry(idx)}
                                            className="text-red-600 hover:text-red-800 font-bold cursor-pointer"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ============ CONFIG ============ */}
                <div className="p-4 bg-green-50 rounded-lg border border-green-300">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">⚙️ Config</h3>

                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Cost (EUR) *
                                    {loadingAdmin && <span className="text-xs text-indigo-600 ml-2">Loading table...</span>}
                                </label>
                                <input
                                    type="number"
                                    value={costEUR}
                                    onChange={(e) => handleCostChange(parseFloat(e.target.value))}
                                    step="0.01"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                                />
                                <p className="text-xs text-gray-500 mt-1">💡 Enter cost to auto-load pricing table</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Bets *</label>
                                <input
                                    type="number"
                                    value={maximumBets}
                                    onChange={(e) => setMaximumBets(parseFloat(e.target.value))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                                <input
                                    type="text"
                                    value={brand}
                                    onChange={(e) => setBrand(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                <input
                                    type="text"
                                    value={configType}
                                    onChange={(e) => setConfigType(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                                >
                                    <option value="games">Games</option>
                                    <option value="live_casino">Live Casino</option>
                                    <option value="sports_book">Sports Book</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Max Withdraw (EUR) *</label>
                                <input
                                    type="number"
                                    value={maximumWithdrawEUR}
                                    onChange={(e) => setMaximumWithdrawEUR(parseFloat(e.target.value))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Game Name *</label>
                            <input
                                type="text"
                                value={game}
                                onChange={(e) => setGame(e.target.value)}
                                placeholder="e.g., Bigger Bass Blizzard - Christmas Catch"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Expiry</label>
                            <input
                                type="text"
                                value={expiry}
                                onChange={(e) => setExpiry(e.target.value)}
                                placeholder="e.g., 7d"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                            />
                        </div>

                        <label className="flex items-center text-sm font-medium text-gray-700 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={withdrawActive}
                                onChange={(e) => setWithdrawActive(e.target.checked)}
                                className="mr-2 w-4 h-4"
                            />
                            Withdraw Active
                        </label>
                    </div>
                </div>

                {/* Save Button */}
                <button
                    onClick={handleSave}
                    className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-lg hover:from-green-700 hover:to-emerald-700 transition"
                >
                    💾 Save Free Spins Bonus
                </button>
            </div>
        </div>
    );
}
