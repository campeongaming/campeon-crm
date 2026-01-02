'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import React from 'react';
import { API_ENDPOINTS } from '@/lib/api-config';

interface BonusFormData {
    id: string;
    bonusType: 'DEPOSIT' | 'RELOAD' | 'WAGER' | 'FSDROP' | 'CASHBACK' | 'SEQ' | 'COMBO';
    provider: string;
    schedule_type: string;
    schedule_from: string;
    schedule_to: string;
    trigger_type: string;
    category: string;
    brand: string;

    // DEPOSIT & RELOAD fields
    percentage?: number;
    wagering_multiplier?: number;
    minimum_amount?: number;
    cost_eur?: number;

    // WAGER fields
    wager_amount?: Record<string, number>;
    free_spins_count?: number;
    cost_per_wager?: Record<string, number>;
    maximum_bets?: Record<string, number>;
    wager_game_title?: string;
    wager_expiry?: string;
    wager_maximum_withdraw?: Record<string, number>;

    // CASHBACK fields
    cashback_percentage?: number;
    minimum_loss_amount?: number;
    maximum_cashback?: Record<string, number>;
    maximum_withdraw?: Record<string, number>;
    withdraw_active?: boolean;
    restricted_countries?: string[];

    // FSDROP fields
    fsdrop_game_title?: string;
    fsdrop_expiry?: string;
    fsdrop_maximum_bets?: Record<string, number>;
    fsdrop_maximum_withdraw?: Record<string, number>;

    // Common fields
    trigger_name?: string;
    trigger_description?: string;
    iterations?: number;
    duration?: string;
}

const BONUS_TYPES = [
    { value: 'DEPOSIT', label: '💰 Deposit Bonus', icon: '💳' },
    { value: 'RELOAD', label: '♻️ Reload Bonus', icon: '🔄' },
    { value: 'WAGER', label: '⚡ Wager-Triggered FS', icon: '🎯' },
    { value: 'FSDROP', label: '✨ Free Spins Drop', icon: '🌟' },
    { value: 'CASHBACK', label: '💸 Cashback', icon: '💵' },
    { value: 'SEQ', label: '📊 Sequential', icon: '📈' },
    { value: 'COMBO', label: '🔗 Combo', icon: '🎁' },
];

const CURRENCIES = [
    'EUR', 'USD', 'GBP', 'CAD', 'AUD', 'NZD', 'BRL', 'NOK', 'PLN', 'JPY', 'CHF', 'ZAR',
    'CLP', 'MXN', 'PEN', 'AZN', 'TRY', 'KZT', 'RUB', 'UZS', 'CZK'
];

export default function BonusCreationForm() {
    const [formData, setFormData] = useState<BonusFormData>({
        id: '',
        bonusType: 'DEPOSIT',
        provider: 'PRAGMATIC',
        schedule_type: 'period',
        schedule_from: '',
        schedule_to: '',
        trigger_type: 'deposit',
        category: 'GAMES',
        brand: 'PRAGMATIC',
        percentage: 100,
        wagering_multiplier: 15,
        minimum_amount: 25,
        cost_eur: 0.2,
        trigger_name: 'Bonus',
        trigger_description: 'Casino Bonus',
        iterations: 1,
        duration: '7d',
        // WAGER specific
        wager_amount: Object.fromEntries(CURRENCIES.map(c => [c, 200])),
        free_spins_count: 500,
        cost_per_wager: Object.fromEntries(CURRENCIES.map(c => [c, 0.2])),
        maximum_bets: Object.fromEntries(CURRENCIES.map(c => [c, 500])),
        wager_game_title: 'Sweet Rush Bonanza',
        wager_expiry: '7d',
        wager_maximum_withdraw: Object.fromEntries(CURRENCIES.map(c => [c, 100])),
        // CASHBACK specific
        cashback_percentage: 10,
        minimum_loss_amount: 50,
        maximum_cashback: Object.fromEntries(CURRENCIES.map(c => [c, 100])),
        maximum_withdraw: Object.fromEntries(CURRENCIES.map(c => [c, 500])),
        withdraw_active: true,
        restricted_countries: [],
        // FSDROP specific
        fsdrop_game_title: 'Olympus Wins',
        fsdrop_expiry: '1d',
        fsdrop_maximum_bets: Object.fromEntries(CURRENCIES.map(c => [c, 50])),
        fsdrop_maximum_withdraw: Object.fromEntries(CURRENCIES.map(c => [c, 100])),
    });

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [selectedProvider, setSelectedProvider] = useState('PRAGMATIC');
    const [pricingTable, setPricingTable] = useState<any>(null);

    // Fetch pricing table when provider changes
    useEffect(() => {
        const fetchPricingTable = async () => {
            try {
                const response = await axios.get(
                    `${API_ENDPOINTS.BASE_URL}/api/stable-config/${selectedProvider}`
                );

                if (response.data?.maximum_withdraw && Array.isArray(response.data.maximum_withdraw)) {
                    const withdrawTable = response.data.maximum_withdraw[0];
                    if (withdrawTable?.values) {
                        setPricingTable(withdrawTable.values);
                    }
                }
            } catch (error) {
                console.log('Could not fetch pricing table');
            }
        };

        fetchPricingTable();
    }, [selectedProvider]);

    const handleBonusTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newType = e.target.value as BonusFormData['bonusType'];
        setFormData(prev => ({
            ...prev,
            bonusType: newType,
            trigger_type: getTriggerTypeForBonus(newType),
        }));
    };

    const getTriggerTypeForBonus = (bonusType: string): string => {
        const typeMap: Record<string, string> = {
            DEPOSIT: 'deposit',
            RELOAD: 'reload',
            WAGER: 'external',
            FSDROP: 'fsdrop',
            CASHBACK: 'external',
            SEQ: 'deposit',
            COMBO: 'deposit',
        };
        return typeMap[bonusType] || 'deposit';
    };

    const handleBasicChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const parsedValue = type === 'number' ? parseFloat(value) : value;
        setFormData(prev => ({
            ...prev,
            [name]: parsedValue
        }));

        if (name === 'provider') {
            setSelectedProvider(value);
        }
    };

    const handleCurrencyChange = (field: string, currency: string, value: number) => {
        setFormData(prev => ({
            ...prev,
            [field]: {
                ...((prev as any)[field] || {}),
                [currency]: value,
            }
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            let payload: any = {
                id: formData.id,
                provider: formData.provider,
                brand: formData.brand,
                category: formData.category,
                trigger_type: formData.trigger_type,
                trigger_name: { '*': formData.trigger_name },
                trigger_description: { '*': formData.trigger_description },
                trigger_iterations: formData.iterations,
                trigger_duration: formData.duration,
                bonus_type: formData.bonusType.toLowerCase(),
            };

            // Add schedule if both dates provided
            if (formData.schedule_from && formData.schedule_to) {
                payload.schedule_type = formData.schedule_type;
                payload.schedule_from = formData.schedule_from;
                payload.schedule_to = formData.schedule_to;
            }

            // Type-specific fields
            if (['DEPOSIT', 'RELOAD'].includes(formData.bonusType)) {
                payload.percentage = formData.percentage;
                payload.wagering_multiplier = formData.wagering_multiplier;
                payload.minimum_amount = { '*': formData.minimum_amount };
                payload.cost_eur = formData.cost_eur;
            } else if (formData.bonusType === 'WAGER') {
                payload.wager_amount = formData.wager_amount;
                payload.free_spins_count = formData.free_spins_count;
                payload.cost_per_wager = formData.cost_per_wager;
                payload.maximum_bets = formData.maximum_bets;
                payload.wager_game_title = { '*': formData.wager_game_title };
                payload.wager_expiry = formData.wager_expiry;
                payload.wager_maximum_withdraw = formData.wager_maximum_withdraw;
            } else if (formData.bonusType === 'CASHBACK') {
                payload.cashback_percentage = formData.cashback_percentage;
                payload.minimum_loss_amount = formData.minimum_loss_amount;
                payload.maximum_cashback = formData.maximum_cashback;
                payload.maximum_withdraw = formData.maximum_withdraw;
                payload.withdraw_active = formData.withdraw_active;
            } else if (formData.bonusType === 'FSDROP') {
                payload.fsdrop_game_title = { '*': formData.fsdrop_game_title };
                payload.fsdrop_expiry = formData.fsdrop_expiry;
                payload.fsdrop_maximum_bets = formData.fsdrop_maximum_bets;
                payload.fsdrop_maximum_withdraw = formData.fsdrop_maximum_withdraw;
            }

            const response = await axios.post(API_ENDPOINTS.BONUS_TEMPLATES, payload);
            setMessage(`✅ ${formData.bonusType} bonus created! ID: ${response.data.id}`);

            // Reset form
            setFormData({
                id: '',
                bonusType: 'DEPOSIT',
                provider: 'PRAGMATIC',
                schedule_type: 'period',
                schedule_from: '',
                schedule_to: '',
                trigger_type: 'deposit',
                category: 'GAMES',
                brand: 'PRAGMATIC',
                percentage: 100,
                wagering_multiplier: 15,
                minimum_amount: 25,
                cost_eur: 0.2,
                trigger_name: 'Bonus',
                trigger_description: 'Casino Bonus',
                iterations: 1,
                duration: '7d',
                wager_amount: Object.fromEntries(CURRENCIES.map(c => [c, 200])),
                free_spins_count: 500,
                cost_per_wager: Object.fromEntries(CURRENCIES.map(c => [c, 0.2])),
                maximum_bets: Object.fromEntries(CURRENCIES.map(c => [c, 500])),
                wager_game_title: 'Sweet Rush Bonanza',
                wager_expiry: '7d',
                wager_maximum_withdraw: Object.fromEntries(CURRENCIES.map(c => [c, 100])),
                // CASHBACK reset
                cashback_percentage: 10,
                minimum_loss_amount: 50,
                maximum_cashback: Object.fromEntries(CURRENCIES.map(c => [c, 100])),
                maximum_withdraw: Object.fromEntries(CURRENCIES.map(c => [c, 500])),
                withdraw_active: true,
                restricted_countries: [],
                // FSDROP reset
                fsdrop_game_title: 'Olympus Wins',
                fsdrop_expiry: '1d',
                fsdrop_maximum_bets: Object.fromEntries(CURRENCIES.map(c => [c, 50])),
                fsdrop_maximum_withdraw: Object.fromEntries(CURRENCIES.map(c => [c, 100])),
            });
        } catch (error: any) {
            setMessage(`❌ Error: ${error.response?.data?.detail || error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const isDepositOrReload = ['DEPOSIT', 'RELOAD'].includes(formData.bonusType);
    const isWager = formData.bonusType === 'WAGER';
    const isCashback = formData.bonusType === 'CASHBACK';
    const isFsdrop = formData.bonusType === 'FSDROP';

    return (
        <div className="w-full max-w-4xl mx-auto">
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Message */}
                {message && (
                    <div className={`p-4 rounded-lg ${message.includes('✅') ? 'bg-green-900/30 text-green-300' : 'bg-red-900/30 text-red-300'
                        }`}>
                        {message}
                    </div>
                )}

                {/* Bonus Type Selection */}
                <div className="bg-slate-800/40 p-6 rounded-xl border border-slate-700/50">
                    <label className="block text-sm font-semibold text-slate-200 mb-3">
                        Bonus Type
                    </label>
                    <select
                        value={formData.bonusType}
                        onChange={handleBonusTypeChange}
                        className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {BONUS_TYPES.map(bt => (
                            <option key={bt.value} value={bt.value}>
                                {bt.icon} {bt.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-800/40 p-6 rounded-xl border border-slate-700/50">
                    <div>
                        <label className="block text-sm font-semibold text-slate-200 mb-2">
                            Bonus ID <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="text"
                            name="id"
                            value={formData.id}
                            onChange={handleBasicChange}
                            required
                            placeholder="e.g., WAGER_200_500_2025-12-22"
                            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-200 mb-2">
                            Provider
                        </label>
                        <select
                            name="provider"
                            value={formData.provider}
                            onChange={handleBasicChange}
                            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="PRAGMATIC">PRAGMATIC</option>
                            <option value="BETSOFT">BETSOFT</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-200 mb-2">
                            Trigger Name
                        </label>
                        <input
                            type="text"
                            name="trigger_name"
                            value={formData.trigger_name}
                            onChange={handleBasicChange}
                            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-200 mb-2">
                            Category
                        </label>
                        <select
                            name="category"
                            value={formData.category}
                            onChange={handleBasicChange}
                            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="GAMES">GAMES</option>
                            <option value="PROMOTIONS">PROMOTIONS</option>
                            <option value="VIP">VIP</option>
                        </select>
                    </div>
                </div>

                {/* Schedule Section */}
                <div className="bg-slate-800/40 p-6 rounded-xl border border-slate-700/50">
                    <h3 className="text-sm font-semibold text-slate-200 mb-4">Schedule (Optional)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-200 mb-2">
                                Start Date & Time
                            </label>
                            <input
                                type="datetime-local"
                                name="schedule_from"
                                value={formData.schedule_from}
                                onChange={handleBasicChange}
                                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-200 mb-2">
                                End Date & Time
                            </label>
                            <input
                                type="datetime-local"
                                name="schedule_to"
                                value={formData.schedule_to}
                                onChange={handleBasicChange}
                                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                </div>

                {/* DEPOSIT/RELOAD Specific Fields */}
                {isDepositOrReload && (
                    <div className="bg-blue-900/20 p-6 rounded-xl border border-blue-700/50">
                        <h3 className="text-sm font-semibold text-blue-300 mb-4">
                            {formData.bonusType} Configuration
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-200 mb-2">
                                    Percentage (%)
                                </label>
                                <input
                                    type="number"
                                    name="percentage"
                                    value={formData.percentage}
                                    onChange={handleBasicChange}
                                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-200 mb-2">
                                    Wagering Multiplier (x)
                                </label>
                                <input
                                    type="number"
                                    name="wagering_multiplier"
                                    value={formData.wagering_multiplier}
                                    onChange={handleBasicChange}
                                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-200 mb-2">
                                    Minimum Amount (EUR)
                                </label>
                                <input
                                    type="number"
                                    name="minimum_amount"
                                    value={formData.minimum_amount}
                                    onChange={handleBasicChange}
                                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-200 mb-2">
                                    Cost (EUR)
                                </label>
                                <input
                                    type="number"
                                    name="cost_eur"
                                    value={formData.cost_eur}
                                    onChange={handleBasicChange}
                                    step="0.01"
                                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* WAGER Specific Fields */}
                {isWager && (
                    <div className="bg-amber-900/20 p-6 rounded-xl border border-amber-700/50">
                        <h3 className="text-sm font-semibold text-amber-300 mb-4">
                            Wager Configuration
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <div>
                                <label className="block text-sm font-semibold text-slate-200 mb-2">
                                    Free Spins Count
                                </label>
                                <input
                                    type="number"
                                    value={formData.free_spins_count || 500}
                                    onChange={(e) => setFormData(prev => ({ ...prev, free_spins_count: parseInt(e.target.value) }))}
                                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-200 mb-2">
                                    Game Title
                                </label>
                                <input
                                    type="text"
                                    value={formData.wager_game_title || ''}
                                    onChange={(e) => setFormData(prev => ({ ...prev, wager_game_title: e.target.value }))}
                                    placeholder="e.g., Sweet Rush Bonanza"
                                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-200 mb-2">
                                    Expiry Duration
                                </label>
                                <input
                                    type="text"
                                    value={formData.wager_expiry || '7d'}
                                    onChange={(e) => setFormData(prev => ({ ...prev, wager_expiry: e.target.value }))}
                                    placeholder="e.g., 7d"
                                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                />
                            </div>
                        </div>

                        {/* Wager Amount by Currency */}
                        <div className="mb-6">
                            <h4 className="text-sm font-semibold text-amber-300 mb-3">Wager Amount per Currency</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-h-64 overflow-y-auto p-3 bg-slate-800/50 rounded-lg">
                                {CURRENCIES.map(currency => (
                                    <div key={`wager-${currency}`}>
                                        <label className="text-xs text-slate-400 mb-1 block">{currency}</label>
                                        <input
                                            type="number"
                                            value={formData.wager_amount?.[currency] || 200}
                                            onChange={(e) => handleCurrencyChange('wager_amount', currency, parseFloat(e.target.value))}
                                            className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Cost per Wager by Currency */}
                        <div className="mb-6">
                            <h4 className="text-sm font-semibold text-amber-300 mb-3">Cost per Wager by Currency</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-h-64 overflow-y-auto p-3 bg-slate-800/50 rounded-lg">
                                {CURRENCIES.map(currency => (
                                    <div key={`cost-${currency}`}>
                                        <label className="text-xs text-slate-400 mb-1 block">{currency}</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={formData.cost_per_wager?.[currency] || 0.2}
                                            onChange={(e) => handleCurrencyChange('cost_per_wager', currency, parseFloat(e.target.value))}
                                            className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Maximum Bets by Currency */}
                        <div>
                            <h4 className="text-sm font-semibold text-amber-300 mb-3">Maximum Bets per Currency</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-h-64 overflow-y-auto p-3 bg-slate-800/50 rounded-lg">
                                {CURRENCIES.map(currency => (
                                    <div key={`maxbet-${currency}`}>
                                        <label className="text-xs text-slate-400 mb-1 block">{currency}</label>
                                        <input
                                            type="number"
                                            value={formData.maximum_bets?.[currency] || 500}
                                            onChange={(e) => handleCurrencyChange('maximum_bets', currency, parseFloat(e.target.value))}
                                            className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Maximum Withdraw by Currency */}
                        <div className="mt-6">
                            <h4 className="text-sm font-semibold text-amber-300 mb-3">Maximum Withdraw per Currency</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-h-64 overflow-y-auto p-3 bg-slate-800/50 rounded-lg">
                                {CURRENCIES.map(currency => (
                                    <div key={`wager-withdraw-${currency}`}>
                                        <label className="text-xs text-slate-400 mb-1 block">{currency}</label>
                                        <input
                                            type="number"
                                            value={formData.wager_maximum_withdraw?.[currency] || 100}
                                            onChange={(e) => handleCurrencyChange('wager_maximum_withdraw', currency, parseFloat(e.target.value))}
                                            className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* CASHBACK Specific Fields */}
                {isCashback && (
                    <div className="bg-green-900/20 p-6 rounded-xl border border-green-700/50">
                        <h3 className="text-sm font-semibold text-green-300 mb-4">
                            Cashback Configuration
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <div>
                                <label className="block text-sm font-semibold text-slate-200 mb-2">
                                    Cashback Percentage (%)
                                </label>
                                <input
                                    type="number"
                                    value={formData.cashback_percentage || 10}
                                    onChange={(e) => setFormData(prev => ({ ...prev, cashback_percentage: parseFloat(e.target.value) }))}
                                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-200 mb-2">
                                    Minimum Loss Amount
                                </label>
                                <input
                                    type="number"
                                    value={formData.minimum_loss_amount || 50}
                                    onChange={(e) => setFormData(prev => ({ ...prev, minimum_loss_amount: parseFloat(e.target.value) }))}
                                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-200 mb-2">
                                    <input
                                        type="checkbox"
                                        checked={formData.withdraw_active || false}
                                        onChange={(e) => setFormData(prev => ({ ...prev, withdraw_active: e.target.checked }))}
                                        className="mr-2"
                                    />
                                    Withdraw Active
                                </label>
                            </div>
                        </div>

                        {/* Maximum Cashback by Currency */}
                        <div className="mb-6">
                            <h4 className="text-sm font-semibold text-green-300 mb-3">Maximum Cashback per Currency</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-h-64 overflow-y-auto p-3 bg-slate-800/50 rounded-lg">
                                {CURRENCIES.map(currency => (
                                    <div key={`cashback-${currency}`}>
                                        <label className="text-xs text-slate-400 mb-1 block">{currency}</label>
                                        <input
                                            type="number"
                                            value={formData.maximum_cashback?.[currency] || 100}
                                            onChange={(e) => handleCurrencyChange('maximum_cashback', currency, parseFloat(e.target.value))}
                                            className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Maximum Withdraw by Currency */}
                        <div>
                            <h4 className="text-sm font-semibold text-green-300 mb-3">Maximum Withdraw per Currency</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-h-64 overflow-y-auto p-3 bg-slate-800/50 rounded-lg">
                                {CURRENCIES.map(currency => (
                                    <div key={`withdraw-${currency}`}>
                                        <label className="text-xs text-slate-400 mb-1 block">{currency}</label>
                                        <input
                                            type="number"
                                            value={formData.maximum_withdraw?.[currency] || 500}
                                            onChange={(e) => handleCurrencyChange('maximum_withdraw', currency, parseFloat(e.target.value))}
                                            className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* FSDROP Specific Fields */}
                {isFsdrop && (
                    <div className="bg-yellow-900/20 p-6 rounded-xl border border-yellow-700/50">
                        <h3 className="text-sm font-semibold text-yellow-300 mb-4">
                            Free Spins Drop Configuration
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <div>
                                <label className="block text-sm font-semibold text-slate-200 mb-2">
                                    Game Title
                                </label>
                                <input
                                    type="text"
                                    value={formData.fsdrop_game_title || ''}
                                    onChange={(e) => setFormData(prev => ({ ...prev, fsdrop_game_title: e.target.value }))}
                                    placeholder="e.g., Olympus Wins"
                                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-200 mb-2">
                                    Expiry Duration
                                </label>
                                <input
                                    type="text"
                                    value={formData.fsdrop_expiry || '1d'}
                                    onChange={(e) => setFormData(prev => ({ ...prev, fsdrop_expiry: e.target.value }))}
                                    placeholder="e.g., 1d, 7d"
                                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                />
                            </div>
                        </div>

                        {/* Maximum Bets by Currency */}
                        <div className="mb-6">
                            <h4 className="text-sm font-semibold text-yellow-300 mb-3">Maximum Bets per Currency</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-h-64 overflow-y-auto p-3 bg-slate-800/50 rounded-lg">
                                {CURRENCIES.map(currency => (
                                    <div key={`fsdrop-maxbet-${currency}`}>
                                        <label className="text-xs text-slate-400 mb-1 block">{currency}</label>
                                        <input
                                            type="number"
                                            value={formData.fsdrop_maximum_bets?.[currency] || 50}
                                            onChange={(e) => handleCurrencyChange('fsdrop_maximum_bets', currency, parseFloat(e.target.value))}
                                            className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Maximum Withdraw by Currency */}
                        <div>
                            <h4 className="text-sm font-semibold text-yellow-300 mb-3">Maximum Withdraw per Currency</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-h-64 overflow-y-auto p-3 bg-slate-800/50 rounded-lg">
                                {CURRENCIES.map(currency => (
                                    <div key={`fsdrop-withdraw-${currency}`}>
                                        <label className="text-xs text-slate-400 mb-1 block">{currency}</label>
                                        <input
                                            type="number"
                                            value={formData.fsdrop_maximum_withdraw?.[currency] || 100}
                                            onChange={(e) => handleCurrencyChange('fsdrop_maximum_withdraw', currency, parseFloat(e.target.value))}
                                            className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-slate-600 disabled:to-slate-700 text-white font-semibold py-3 px-4 rounded-lg transition shadow-lg shadow-blue-500/30"
                >
                    {loading ? 'Creating Bonus...' : `Create ${formData.bonusType} Bonus`}
                </button>
            </form>
        </div>
    );
}
