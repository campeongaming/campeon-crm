'use client';

import React, { useState, useCallback, useMemo } from 'react';
import axios from 'axios';
import {
    TriggerType,
    ConfigType,
    ConfigCategory,
    CURRENCY_PRESETS,
    SUPPORTED_LOCALES,
} from '@/lib/bonusSchemas';
import {
    generateBonusJson,
    validateBonusForm,
    createCurrencyMap,
    createMultiLangField,
} from '@/lib/bonusTemplates';

interface BonusCreatorProps {
    onBonusSaved?: () => void;
}

export const BonusCreator: React.FC<BonusCreatorProps> = ({ onBonusSaved }) => {
    // ============ UI STATE ============
    const [triggerType, setTriggerType] = useState<TriggerType>('deposit');
    const [configType, setConfigType] = useState<ConfigType>('cash');
    const [configCategory, setConfigCategory] = useState<ConfigCategory>('games');
    const [currencyPreset, setCurrencyPreset] = useState<keyof typeof CURRENCY_PRESETS>('EU');

    // ============ FORM STATE - COMMON ============
    const [id, setId] = useState('');
    const [duration, setDuration] = useState('7d');
    const [withSchedule, setWithSchedule] = useState(false);
    const [scheduleFrom, setScheduleFrom] = useState('');
    const [scheduleTo, setScheduleTo] = useState('');

    // ============ FORM STATE - DEPOSIT ============
    const [depositMinimumAmount, setDepositMinimumAmount] = useState(25);
    const [depositPercentage, setDepositPercentage] = useState(100);
    const [depositWageringMultiplier, setDepositWageringMultiplier] = useState(30);
    const [depositMaximumAmount, setDepositMaximumAmount] = useState(300);
    const [depositMinStake, setDepositMinStake] = useState(0.5);
    const [depositMaxStake, setDepositMaxStake] = useState(5);
    const [depositIterations, setDepositIterations] = useState(1);
    const [includeAmount, setIncludeAmount] = useState(true);
    const [capCalculation, setCapCalculation] = useState(true);
    const [compensateOverspending, setCompensateOverspending] = useState(false);

    // ============ FORM STATE - EXTERNAL / OPEN ============
    const [bonusName, setBonusName] = useState('');
    const [bonusNameLocalized, setBonusNameLocalized] = useState<Record<string, string>>({});
    const [provider, setProvider] = useState('PRAGMATIC');
    const [brand, setBrand] = useState('SYSTEM');
    const [cost, setCost] = useState(10);
    const [multiplier, setMultiplier] = useState(30);
    const [maximumBets, setMaximumBets] = useState(1);
    const [expiry, setExpiry] = useState('7d');
    const [maximumWithdraw, setMaximumWithdraw] = useState(300);
    const [game, setGame] = useState('');

    // ============ FORM STATE - OPEN ============
    const [chainedBonusIds, setChainedBonusIds] = useState<string[]>([]);
    const [chainedBonusInput, setChainedBonusInput] = useState('');

    // ============ FORM STATE - CASHBACK ============
    const [cashbackPercentage, setCashbackPercentage] = useState(10);
    const [cashbackMaximum, setCashbackMaximum] = useState(100);

    // ============ VALIDATION & OUTPUT ============
    const [validationErrors, setValidationErrors] = useState<string[]>([]);

    const currencies = useMemo(() => CURRENCY_PRESETS[currencyPreset], [currencyPreset]);

    // ============ TRIGGER TYPE CONSTRAINTS ============
    // Certain trigger types only support certain config types
    const supportedConfigTypes: ConfigType[] = useMemo(() => {
        switch (triggerType) {
            case 'deposit':
                return ['cash'];
            case 'external':
            case 'open':
                return ['free_bet'];
            case 'manual':
                return ['cash', 'free_bet', 'cashback'];
            case 'cashback':
                return ['cashback'];
            default:
                return ['cash', 'free_bet'];
        }
    }, [triggerType]);

    // Auto-select config type if current one is not supported
    const validConfigType = useMemo(() => {
        if (supportedConfigTypes.includes(configType)) {
            return configType;
        }
        return supportedConfigTypes[0];
    }, [configType, supportedConfigTypes]);

    // ============ SAVE TO DATABASE ============
    const handleSaveBonus = useCallback(async () => {
        setValidationErrors([]);

        // Build form state based on trigger type
        let formState: any = {};

        switch (triggerType) {
            case 'deposit':
                formState = {
                    id,
                    duration,
                    minimumAmount: createCurrencyMap(depositMinimumAmount, currencies),
                    percentage: depositPercentage,
                    wageringMultiplier: depositWageringMultiplier,
                    maximumAmount: createCurrencyMap(depositMaximumAmount, currencies),
                    minimumStakeToWager: createCurrencyMap(depositMinStake, currencies),
                    maximumStakeToWager: createCurrencyMap(depositMaxStake, currencies),
                    iterations: depositIterations,
                    includeAmountOnTargetWagerCalculation: includeAmount,
                    capCalculationAmountToMaximumBonus: capCalculation,
                    compensateOverspending: compensateOverspending,
                    withSchedule,
                    scheduleFrom: withSchedule ? scheduleFrom : undefined,
                    scheduleTo: withSchedule ? scheduleTo : undefined,
                };
                break;

            case 'external':
                formState = {
                    id,
                    duration,
                    name: createMultiLangField(bonusName, bonusNameLocalized),
                    provider,
                    brand,
                    category: configCategory,
                    cost: createCurrencyMap(cost, currencies),
                    multiplier: createCurrencyMap(multiplier, currencies),
                    maximumBets: createCurrencyMap(maximumBets, currencies),
                    expiry,
                    maximumWithdraw: createCurrencyMap(maximumWithdraw, currencies),
                    game: game || undefined,
                    withSchedule,
                    scheduleFrom: withSchedule ? scheduleFrom : undefined,
                    scheduleTo: withSchedule ? scheduleTo : undefined,
                };
                break;

            case 'open':
                formState = {
                    id,
                    duration,
                    name: createMultiLangField(bonusName, bonusNameLocalized),
                    chainedBonusIds,
                    provider,
                    brand,
                    category: configCategory,
                    cost: createCurrencyMap(cost, currencies),
                    multiplier: createCurrencyMap(multiplier, currencies),
                    maximumBets: createCurrencyMap(maximumBets, currencies),
                    expiry,
                    maximumWithdraw: createCurrencyMap(maximumWithdraw, currencies),
                    game: game || undefined,
                };
                break;

            case 'cashback':
                formState = {
                    id,
                    percentage: cashbackPercentage,
                    maximumCashback: createCurrencyMap(cashbackMaximum, currencies),
                    provider,
                    brand,
                };
                break;
        }

        // Validate
        const errors = validateBonusForm(triggerType, formState);
        if (errors.length > 0) {
            setValidationErrors(errors);
            return;
        }

        // Save to database
        try {
            // Build payload that matches backend Pydantic schema (all dict fields)
            const payload: any = {
                id,
                bonus_type: triggerType,
                trigger_type: triggerType,  // REQUIRED: was missing!
                trigger_name: { "*": bonusName || `${triggerType} Bonus` },  // Dict, not string
                trigger_description: { "*": bonusName || '' },  // Dict, not string
                trigger_duration: duration,
                trigger_iterations: depositIterations || 1,
                category: configCategory || 'games',
                provider,
                brand,
                percentage: 0,  // Default, will be overridden
                wagering_multiplier: 1,  // Default, will be overridden
                include_amount_on_target_wager: includeAmount,
                cap_calculation_to_maximum: capCalculation,
                compensate_overspending: compensateOverspending,
                withdraw_active: false,
            };

            // Add type-specific fields (all must be dictionaries for multilingual support)
            if (triggerType === 'deposit') {
                payload.minimum_amount = createCurrencyMap(depositMinimumAmount, currencies);
                payload.percentage = depositPercentage;
                payload.wagering_multiplier = depositWageringMultiplier;
                payload.minimum_stake_to_wager = createCurrencyMap(depositMinStake, currencies);
                payload.maximum_stake_to_wager = createCurrencyMap(depositMaxStake, currencies);
                payload.maximum_amount = createCurrencyMap(depositMaximumAmount, currencies);
                payload.maximum_withdraw = createCurrencyMap(depositMaximumAmount, currencies);
            } else if (triggerType === 'external' || triggerType === 'open') {
                payload.minimum_amount = createCurrencyMap(cost, currencies);
                payload.percentage = multiplier;
                payload.wagering_multiplier = multiplier;
                payload.minimum_stake_to_wager = createCurrencyMap(0, currencies);
                payload.maximum_stake_to_wager = createCurrencyMap(maximumBets, currencies);
                payload.maximum_amount = createCurrencyMap(maximumWithdraw, currencies);
                payload.maximum_withdraw = createCurrencyMap(maximumWithdraw, currencies);
            } else if (triggerType === 'cashback') {
                payload.minimum_amount = createCurrencyMap(0, currencies);
                payload.percentage = cashbackPercentage;
                payload.wagering_multiplier = 1;
                payload.minimum_stake_to_wager = createCurrencyMap(0, currencies);
                payload.maximum_stake_to_wager = createCurrencyMap(0, currencies);
                payload.maximum_amount = createCurrencyMap(cashbackMaximum, currencies);
                payload.maximum_withdraw = createCurrencyMap(cashbackMaximum, currencies);
            }

            await axios.post(`${API_ENDPOINTS.BASE_URL}/api/bonus-templates`, payload);
            setValidationErrors([]);
            alert(`✅ Bonus "${id}" saved successfully! Go to Optimization tab to generate JSON.`);
            onBonusSaved?.();
        } catch (error: any) {
            let errorMessage = 'Failed to save bonus';

            // Handle Pydantic validation error (array of errors)
            if (error.response?.data?.detail && Array.isArray(error.response.data.detail)) {
                errorMessage = error.response.data.detail
                    .map((err: any) => `${err.loc?.join('.')}: ${err.msg}`)
                    .join(' | ');
            } else if (error.response?.data?.detail) {
                errorMessage = String(error.response.data.detail);
            } else if (error.message) {
                errorMessage = error.message;
            }

            setValidationErrors([errorMessage]);
        }
    }, [
        triggerType,
        configType,
        id,
        duration,
        depositMinimumAmount,
        depositPercentage,
        depositWageringMultiplier,
        depositMaximumAmount,
        depositMinStake,
        depositMaxStake,
        depositIterations,
        includeAmount,
        capCalculation,
        compensateOverspending,
        bonusName,
        bonusNameLocalized,
        provider,
        brand,
        cost,
        multiplier,
        maximumBets,
        expiry,
        maximumWithdraw,
        game,
        chainedBonusIds,
        cashbackPercentage,
        cashbackMaximum,
        configCategory,
        currencies,
        withSchedule,
        scheduleFrom,
        scheduleTo,
        onBonusSaved,
    ]);

    // ============ HANDLE CHAINED BONUS ID INPUT ============
    const handleAddChainedBonus = () => {
        if (chainedBonusInput.trim() && !chainedBonusIds.includes(chainedBonusInput.trim())) {
            setChainedBonusIds([...chainedBonusIds, chainedBonusInput.trim()]);
            setChainedBonusInput('');
        }
    };

    const handleRemoveChainedBonus = (index: number) => {
        setChainedBonusIds(chainedBonusIds.filter((_, i) => i !== index));
    };

    // ============ RENDER FIELDS BY TRIGGER TYPE ============

    return (
        <div className="w-full max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md border border-gray-200">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">🎲 Bonus JSON Generator</h2>

            {/* Trigger Type Selector */}
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                    1. Bonus Trigger Type
                </label>
                <select
                    value={triggerType}
                    onChange={(e) => setTriggerType(e.target.value as TriggerType)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white cursor-pointer"
                >
                    <option value="deposit">Deposit (reload bonus)</option>
                    <option value="external">External (drops, campaigns)</option>
                    <option value="open">Open (chained bonus)</option>
                    <option value="cashback">Cashback</option>
                </select>
                <p className="text-xs text-gray-600 mt-1">
                    {triggerType === 'deposit' && 'Triggered when user makes a deposit'}
                    {triggerType === 'external' && 'Triggered by external event (like casino drop)'}
                    {triggerType === 'open' && 'Triggered after completing another bonus'}
                    {triggerType === 'cashback' && 'Cashback rewards on losses'}
                </p>
            </div>

            {/* Config Category Selector (for external/open) */}
            {(triggerType === 'external' || triggerType === 'open') && (
                <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        2. Reward Category
                    </label>
                    <select
                        value={configCategory}
                        onChange={(e) => setConfigCategory(e.target.value as ConfigCategory)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white cursor-pointer"
                    >
                        <option value="games">Casino Games</option>
                        <option value="live_casino">Live Casino</option>
                        <option value="sports_book">Sports Book</option>
                    </select>
                </div>
            )}

            {/* Currency Preset */}
            <div className="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Currency Set
                </label>
                <select
                    value={currencyPreset}
                    onChange={(e) => setCurrencyPreset(e.target.value as keyof typeof CURRENCY_PRESETS)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white cursor-pointer"
                >
                    <option value="EU">EU (EUR, GBP, NOK, SEK, DKK, CHF)</option>
                    <option value="GLOBAL">Global (All 21 currencies)</option>
                </select>
                <p className="text-xs text-gray-600 mt-1">Selected: {currencies.join(', ')}</p>
            </div>

            {/* COMMON FIELDS */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-300">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Basic Info</h3>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Bonus ID *
                    </label>
                    <input
                        type="text"
                        value={id}
                        onChange={(e) => setId(e.target.value)}
                        placeholder="e.g., DEPOSIT_25_200_2025-01-05"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Duration (e.g., 7d, 30d)
                    </label>
                    <input
                        type="text"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                    />
                </div>

                {/* Schedule Toggle */}
                <div className="mb-4">
                    <label className="flex items-center text-sm font-medium text-gray-700">
                        <input
                            type="checkbox"
                            checked={withSchedule}
                            onChange={(e) => setWithSchedule(e.target.checked)}
                            className="mr-2 w-4 h-4 cursor-pointer"
                        />
                        Time-boxed Promo (with schedule)
                    </label>
                </div>

                {withSchedule && (
                    <div className="space-y-4 p-3 bg-yellow-50 rounded border border-yellow-300">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Schedule From (ISO 8601)
                            </label>
                            <input
                                type="datetime-local"
                                value={scheduleFrom}
                                onChange={(e) => setScheduleFrom(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Schedule To (ISO 8601)
                            </label>
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

            {/* ============ DEPOSIT-SPECIFIC FIELDS ============ */}
            {triggerType === 'deposit' && (
                <div className="mb-6 p-4 bg-amber-50 rounded-lg border border-amber-300">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">💳 Deposit Bonus Details</h3>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Minimum Deposit ({currencies[0]})
                            </label>
                            <input
                                type="number"
                                value={depositMinimumAmount}
                                onChange={(e) => setDepositMinimumAmount(parseFloat(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Maximum Bonus ({currencies[0]})
                            </label>
                            <input
                                type="number"
                                value={depositMaximumAmount}
                                onChange={(e) => setDepositMaximumAmount(parseFloat(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Bonus Percentage (%)
                            </label>
                            <input
                                type="number"
                                value={depositPercentage}
                                onChange={(e) => setDepositPercentage(parseFloat(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Wagering Multiplier (x)
                            </label>
                            <input
                                type="number"
                                value={depositWageringMultiplier}
                                onChange={(e) => setDepositWageringMultiplier(parseFloat(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Min Stake per Round ({currencies[0]})
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                value={depositMinStake}
                                onChange={(e) => setDepositMinStake(parseFloat(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Max Stake per Round ({currencies[0]})
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                value={depositMaxStake}
                                onChange={(e) => setDepositMaxStake(parseFloat(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Iterations
                            </label>
                            <input
                                type="number"
                                value={depositIterations}
                                onChange={(e) => setDepositIterations(parseInt(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                            />
                        </div>
                    </div>

                    <div className="mt-4 space-y-2">
                        <label className="flex items-center text-sm font-medium text-gray-700">
                            <input
                                type="checkbox"
                                checked={includeAmount}
                                onChange={(e) => setIncludeAmount(e.target.checked)}
                                className="mr-2 w-4 h-4 cursor-pointer"
                            />
                            Include Amount on Target Wager
                        </label>
                        <label className="flex items-center text-sm font-medium text-gray-700">
                            <input
                                type="checkbox"
                                checked={capCalculation}
                                onChange={(e) => setCapCalculation(e.target.checked)}
                                className="mr-2 w-4 h-4 cursor-pointer"
                            />
                            Cap Calculation to Maximum Bonus
                        </label>
                        <label className="flex items-center text-sm font-medium text-gray-700">
                            <input
                                type="checkbox"
                                checked={compensateOverspending}
                                onChange={(e) => setCompensateOverspending(e.target.checked)}
                                className="mr-2 w-4 h-4 cursor-pointer"
                            />
                            Compensate Overspending
                        </label>
                    </div>
                </div>
            )}

            {/* ============ EXTERNAL / OPEN FIELDS ============ */}
            {(triggerType === 'external' || triggerType === 'open') && (
                <div className="mb-6 p-4 bg-indigo-50 rounded-lg border border-indigo-300">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                        {triggerType === 'external' ? '🎁 Free Spins / Free Bet' : '🔗 Chained Bonus'} Details
                    </h3>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Bonus Name (Default) *
                        </label>
                        <input
                            type="text"
                            value={bonusName}
                            onChange={(e) => setBonusName(e.target.value)}
                            placeholder="e.g., Welcome Free Spins"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                        />
                    </div>

                    {triggerType === 'open' && (
                        <div className="mb-4 p-3 bg-blue-100 rounded border border-blue-300">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Chained Bonus IDs *
                            </label>
                            <div className="flex gap-2 mb-2">
                                <input
                                    type="text"
                                    value={chainedBonusInput}
                                    onChange={(e) => setChainedBonusInput(e.target.value)}
                                    placeholder="Enter bonus ID to chain"
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                                />
                                <button
                                    onClick={handleAddChainedBonus}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                                >
                                    Add
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {chainedBonusIds.map((bonusId, idx) => (
                                    <div key={idx} className="flex items-center gap-2 px-3 py-1 bg-blue-200 rounded-full text-sm">
                                        {bonusId}
                                        <button
                                            onClick={() => handleRemoveChainedBonus(idx)}
                                            className="text-red-600 hover:text-red-800 font-bold cursor-pointer"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Provider
                            </label>
                            <input
                                type="text"
                                value={provider}
                                onChange={(e) => setProvider(e.target.value)}
                                placeholder="e.g., PRAGMATIC"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Brand
                            </label>
                            <input
                                type="text"
                                value={brand}
                                onChange={(e) => setBrand(e.target.value)}
                                placeholder="e.g., SYSTEM"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Cost per FS ({currencies[0]})
                            </label>
                            <input
                                type="number"
                                value={cost}
                                onChange={(e) => setCost(parseFloat(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Multiplier (x)
                            </label>
                            <input
                                type="number"
                                value={multiplier}
                                onChange={(e) => setMultiplier(parseFloat(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Maximum Bets ({currencies[0]})
                            </label>
                            <input
                                type="number"
                                value={maximumBets}
                                onChange={(e) => setMaximumBets(parseFloat(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Expiry (e.g., 7d)
                            </label>
                            <input
                                type="text"
                                value={expiry}
                                onChange={(e) => setExpiry(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Maximum Withdraw ({currencies[0]})
                            </label>
                            <input
                                type="number"
                                value={maximumWithdraw}
                                onChange={(e) => setMaximumWithdraw(parseFloat(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                            />
                        </div>

                        {(configCategory === 'games' || configCategory === 'live_casino') && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Game Name (Optional)
                                </label>
                                <input
                                    type="text"
                                    value={game}
                                    onChange={(e) => setGame(e.target.value)}
                                    placeholder="e.g., Book of Dead"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ============ CASHBACK FIELDS ============ */}
            {triggerType === 'cashback' && (
                <div className="mb-6 p-4 bg-rose-50 rounded-lg border border-rose-300">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">💰 Cashback Details</h3>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Provider
                            </label>
                            <input
                                type="text"
                                value={provider}
                                onChange={(e) => setProvider(e.target.value)}
                                placeholder="e.g., PRAGMATIC"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Brand
                            </label>
                            <input
                                type="text"
                                value={brand}
                                onChange={(e) => setBrand(e.target.value)}
                                placeholder="e.g., SYSTEM"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Cashback Percentage (%)
                            </label>
                            <input
                                type="number"
                                value={cashbackPercentage}
                                onChange={(e) => setCashbackPercentage(parseFloat(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Maximum Cashback ({currencies[0]})
                            </label>
                            <input
                                type="number"
                                value={cashbackMaximum}
                                onChange={(e) => setCashbackMaximum(parseFloat(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* ============ VALIDATION ERRORS ============ */}
            {validationErrors.length > 0 && (
                <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-300">
                    <h4 className="font-semibold text-red-900 mb-2">⚠️ Validation Errors</h4>
                    <ul className="text-red-800 text-sm space-y-1">
                        {validationErrors.map((error, idx) => (
                            <li key={idx}>• {error}</li>
                        ))}
                    </ul>
                </div>
            )}

            {/* ============ SAVE BUTTON ============ */}
            <button
                onClick={handleSaveBonus}
                className="w-full px-4 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 text-base"
            >
                💾 Save Bonus Details
            </button>

            {/* ============ SUCCESS MESSAGE ============ */}
            {validationErrors.length === 0 && (
                <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-300">
                    <p className="text-green-900 font-semibold mb-2">
                        ✅ Bonus details ready to save
                    </p>
                    <p className="text-sm text-green-800">
                        Click the button above to save. Then go to Optimization Team tab to generate JSON.
                    </p>
                </div>
            )}
        </div>
    );
};
