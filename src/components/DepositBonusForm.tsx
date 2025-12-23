'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_ENDPOINTS } from '@/lib/api-config';

const CURRENCIES = ['EUR', 'USD', 'CAD', 'AUD', 'BRL', 'NOK', 'NZD', 'CLP', 'MXN', 'GBP', 'PLN', 'PEN', 'ZAR', 'CHF', 'NGN', 'JPY', 'AZN', 'TRY', 'KZT', 'RUB', 'UZS'];
const BONUS_TYPES_OPTIONS = ['cost', 'free_bet', 'cash'];

interface DepositBonusData {
    id: string;
    provider: string;
    brand: string;
    bonusType: string;
    gameName: string;
    eurCostInput: string;
    freeSpins: string;
    duration: string;
    scheduleFrom: string;
    scheduleTo: string;
    eurMaxWithdraw: string;
    cost: Record<string, number>;
    multipliers: Record<string, number>;
    maximumBets: Record<string, number>;
    maximumWithdraw: Record<string, number>;
}

interface CurrencyTable {
    id: string;
    name: string;
    values: Record<string, number>;
}

export default function DepositBonusForm() {
    const [formData, setFormData] = useState<DepositBonusData>({
        id: '',
        provider: 'PRAGMATIC',
        brand: 'PRAGMATIC',
        bonusType: 'cost',
        gameName: '',
        eurCostInput: '',
        freeSpins: '',
        duration: '7d',
        scheduleFrom: '',
        scheduleTo: '',
        eurMaxWithdraw: '100',
        cost: Object.fromEntries(CURRENCIES.map(c => [c, 0])),
        multipliers: Object.fromEntries(CURRENCIES.map(c => [c, 0])),
        maximumBets: Object.fromEntries(CURRENCIES.map(c => [c, 0])),
        maximumWithdraw: Object.fromEntries(CURRENCIES.map(c => [c, 100])),
    });

    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [costTables, setCostTables] = useState<CurrencyTable[]>([]);
    const [withdrawalValues, setWithdrawalValues] = useState<Record<string, number>>(
        Object.fromEntries(CURRENCIES.map(c => [c, 100]))
    );
    const [loadingCosts, setLoadingCosts] = useState(false);

    // Fetch cost and withdrawal tables when provider changes
    useEffect(() => {
        const fetchTables = async () => {
            setLoadingCosts(true);
            try {
                const response = await axios.get(
                    `${API_ENDPOINTS.BASE_URL}/api/stable-config/${formData.provider}`
                );
                if (response.data?.cost) {
                    setCostTables(response.data.cost);
                }
                // Maximum withdraw is a single table with all currencies
                if (response.data?.maximum_withdraw && response.data.maximum_withdraw.values) {
                    setWithdrawalValues(response.data.maximum_withdraw.values);
                }
            } catch (error) {
                console.log('Error fetching tables:', error);
            } finally {
                setLoadingCosts(false);
            }
        };

        fetchTables();
    }, [formData.provider]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Auto-match cost table when EUR value is entered
        if (name === 'eurCostInput') {
            const eurValue = parseFloat(value);
            const matchingTable = costTables.find(t => Math.abs((t.values['EUR'] || 0) - eurValue) < 0.001);
            if (matchingTable) {
                // Fetch admin config to get maximum bets data
                const fetchAdminData = async () => {
                    try {
                        const response = await axios.get(
                            `${API_ENDPOINTS.BASE_URL}/api/stable-config/${formData.provider}`
                        );
                        const adminConfig = response.data;

                        // Build maximum bets from admin setup
                        const maxBets: Record<string, number> = {};

                        CURRENCIES.forEach(curr => {
                            // Maximum Bets from admin setup
                            if (adminConfig?.maximum_stake_to_wager) {
                                const adminBets = adminConfig.maximum_stake_to_wager.find(
                                    (item: any) => {
                                        return item.currency === curr ||
                                            item.code === curr ||
                                            (item.name && item.name.includes(curr));
                                    }
                                );
                                maxBets[curr] = adminBets?.value || adminBets?.cap || 0;
                            } else {
                                maxBets[curr] = 0;
                            }
                        });

                        setFormData(prev => ({
                            ...prev,
                            eurCostInput: value,
                            cost: matchingTable.values,
                            multipliers: { ...matchingTable.values },
                            maximumWithdraw: withdrawalValues,
                            maximumBets: maxBets
                        }));
                    } catch (error) {
                        console.log('Error fetching admin data:', error);
                        setFormData(prev => ({
                            ...prev,
                            eurCostInput: value,
                            cost: matchingTable.values,
                            multipliers: { ...matchingTable.values },
                            maximumWithdraw: withdrawalValues
                        }));
                    }
                };

                fetchAdminData();
                setMessage(`✅ Cost matched: ${matchingTable.name}`);
                setTimeout(() => setMessage(''), 2000);
            }
        }

        // Update maximum withdraw when EUR value changes
        if (name === 'eurMaxWithdraw') {
            const eurValue = parseFloat(value) || 100;
            // Update EUR value in the withdrawal values
            const updatedWithdrawalValues = {
                ...withdrawalValues,
                EUR: eurValue
            };
            setFormData(prev => ({
                ...prev,
                eurMaxWithdraw: value,
                maximumWithdraw: updatedWithdrawalValues
            }));
            setMessage(`✅ EUR withdrawal cap set to ${eurValue}`);
            setTimeout(() => setMessage(''), 2000);
        }
    };

    // When free spins is changed, update all maximumBets to same value
    const handleFreeSpinsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseFloat(e.target.value) || 0;
        setFormData(prev => ({
            ...prev,
            freeSpins: e.target.value,
            maximumBets: Object.fromEntries(CURRENCIES.map(c => [c, value]))
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (!formData.gameName.trim()) {
                setMessage('❌ Game name is required');
                setLoading(false);
                return;
            }

            if (!formData.eurCostInput || parseFloat(formData.eurCostInput) <= 0) {
                setMessage('❌ Please enter a valid EUR cost value');
                setLoading(false);
                return;
            }

            if (!formData.freeSpins || parseFloat(formData.freeSpins) <= 0) {
                setMessage('❌ Please enter number of free spins');
                setLoading(false);
                return;
            }

            if (Object.values(formData.cost).every(v => v === 0)) {
                setMessage('❌ Cost table not found. Please select a valid EUR cost from admin setup.');
                setLoading(false);
                return;
            }

            // Ensure maximumBets gets free spins value
            const freeSpinsValue = parseFloat(formData.freeSpins) || 0;
            const maximumBetsWithFreeSpin = Object.fromEntries(
                CURRENCIES.map(c => [c, freeSpinsValue])
            );

            const payload: any = {
                id: formData.id || `DEPOSIT_${Date.now()}`,
                trigger: {
                    type: 'deposit',
                    duration: formData.duration,
                },
                config: {
                    cost: formData.cost,
                    multiplier: formData.multipliers,
                    maximumBets: maximumBetsWithFreeSpin,
                    maximumWithdraw: Object.fromEntries(
                        Object.entries(formData.maximumWithdraw).map(([curr, val]) => [
                            curr,
                            { cap: val }
                        ])
                    ),
                    provider: formData.provider,
                    brand: formData.brand,
                    type: formData.bonusType,
                    withdrawActive: false,
                    expiry: formData.duration,
                    extra: {
                        game: formData.gameName
                    }
                },
                type: 'bonus_template'
            };

            if (formData.scheduleFrom && formData.scheduleTo) {
                payload.trigger.schedule = {
                    from: formData.scheduleFrom,
                    to: formData.scheduleTo,
                };
            }

            const response = await axios.post(`${API_ENDPOINTS.BASE_URL}/api/bonus-templates/simple`, payload);
            setMessage(`✅ Deposit bonus "${response.data.id}" created successfully!`);

            // Reset form
            setFormData({
                id: '',
                provider: 'PRAGMATIC',
                brand: 'PRAGMATIC',
                bonusType: 'cost',
                gameName: '',
                eurCostInput: '',
                freeSpins: '',
                duration: '7d',
                scheduleFrom: '',
                scheduleTo: '',
                eurMaxWithdraw: '100',
                cost: Object.fromEntries(CURRENCIES.map(c => [c, 0])),
                multipliers: Object.fromEntries(CURRENCIES.map(c => [c, 0])),
                maximumBets: Object.fromEntries(CURRENCIES.map(c => [c, 0])),
                maximumWithdraw: Object.fromEntries(CURRENCIES.map(c => [c, c === 'EUR' ? 100 : 100])),
            });

            setTimeout(() => setMessage(''), 5000);
        } catch (error: any) {
            let errorMsg = error.message;
            if (error.response?.data?.detail) {
                errorMsg = typeof error.response.data.detail === 'string'
                    ? error.response.data.detail
                    : JSON.stringify(error.response.data.detail, null, 2);
            }
            setMessage(`❌ Error: ${errorMsg}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-gray-900 rounded-lg p-8 border border-gray-700 space-y-6">
            <h2 className="text-2xl font-bold text-white mb-6">🎁 Create Deposit Bonus</h2>

            {message && (
                <div className={`p-4 rounded ${message.includes('✅') ? 'bg-green-900 border border-green-700' : 'bg-red-900 border border-red-700'}`}>
                    <p className={message.includes('✅') ? 'text-green-400' : 'text-red-400'}>{message}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* EUR Cost Value */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">EUR Cost *</label>
                    <input
                        type="number"
                        name="eurCostInput"
                        value={formData.eurCostInput}
                        onChange={handleChange}
                        step="0.01"
                        placeholder="e.g., 0.12"
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:border-blue-500 focus:outline-none"
                    />
                    <p className="text-xs text-gray-400 mt-1">Enter EUR cost from admin setup (auto-populates all currencies)</p>
                </div>

                {/* Free Spins */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Free Spins Count *</label>
                    <input
                        type="number"
                        name="freeSpins"
                        value={formData.freeSpins}
                        onChange={handleFreeSpinsChange}
                        step="1"
                        placeholder="e.g., 200"
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:border-blue-500 focus:outline-none"
                    />
                    <p className="text-xs text-gray-400 mt-1">Same for all currencies</p>
                </div>

                {/* Maximum Withdraw EUR Only */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Maximum Withdraw - EUR (cap)</label>
                    <input
                        type="number"
                        name="eurMaxWithdraw"
                        value={formData.eurMaxWithdraw}
                        onChange={handleChange}
                        step="1"
                        placeholder="e.g., 100"
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:border-blue-500 focus:outline-none"
                    />
                    <p className="text-xs text-gray-400 mt-1">Other currencies fetched from admin setup</p>
                </div>

                {/* Game Name */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Game Name *</label>
                    <input
                        type="text"
                        name="gameName"
                        value={formData.gameName}
                        onChange={handleChange}
                        placeholder="e.g., Bigger Bass Bonanza"
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:border-blue-500 focus:outline-none"
                    />
                </div>

                {/* Bonus Type */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Bonus Type</label>
                        <select
                            name="bonusType"
                            value={formData.bonusType}
                            onChange={handleChange}
                            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:border-blue-500 focus:outline-none"
                        >
                            {BONUS_TYPES_OPTIONS.map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Duration</label>
                        <select
                            name="duration"
                            value={formData.duration}
                            onChange={handleChange}
                            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:border-blue-500 focus:outline-none"
                        >
                            <option value="7d">7 Days</option>
                            <option value="14d">14 Days</option>
                            <option value="30d">30 Days</option>
                            <option value="1y">1 Year</option>
                        </select>
                    </div>
                </div>

                {/* Schedule - Start Date */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Schedule From (Optional)</label>
                        <input
                            type="datetime-local"
                            name="scheduleFrom"
                            value={formData.scheduleFrom}
                            onChange={handleChange}
                            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:border-blue-500 focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Schedule To (Optional)</label>
                        <input
                            type="datetime-local"
                            name="scheduleTo"
                            value={formData.scheduleTo}
                            onChange={handleChange}
                            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:border-blue-500 focus:outline-none"
                        />
                    </div>
                </div>

                {/* Provider */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Provider</label>
                    <select
                        name="provider"
                        value={formData.provider}
                        onChange={handleChange}
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:border-blue-500 focus:outline-none"
                    >
                        <option value="PRAGMATIC">PRAGMATIC</option>
                        <option value="BETSOFT">BETSOFT</option>
                    </select>
                </div>

                {/* Submit */}
                <button
                    type="submit"
                    disabled={loading}
                    className={`w-full py-3 px-6 rounded font-semibold transition ${loading
                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:shadow-lg hover:shadow-green-500/50'
                        }`}
                >
                    {loading ? '⏳ Creating...' : '✅ Create Deposit Bonus'}
                </button>
            </form>
        </div>
    );
}
