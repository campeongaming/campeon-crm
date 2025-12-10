'use client';

import { useState } from 'react';
import axios from 'axios';
import React from 'react';
import { API_ENDPOINTS } from '@/lib/api-config';

const CURRENCIES = ['EUR', 'USD', 'CAD', 'AUD', 'NZD', 'GBP', 'BRL', 'NOK', 'PEN', 'CLP', 'MXN', 'CHF', 'ZAR', 'PLN', 'AZN', 'TRY', 'JPY', 'KZT', 'RUB', 'HUF', 'UZS'];
const PROVIDERS = ['PRAGMATIC', 'BETSOFT'];

interface StableConfig {
    provider: string;
    cost: Record<string, number>;
    maximum_amount: Record<string, number>;
    minimum_amount: Record<string, number>;
    minimum_stake_to_wager: Record<string, number>;
    maximum_stake_to_wager: Record<string, number>;
    maximum_withdraw: Record<string, number>;
}

export default function AdminPanel() {
    const [selectedProvider, setSelectedProvider] = useState('PRAGMATIC');
    const [activeTab, setActiveTab] = useState<'cost' | 'amounts' | 'stakes' | 'withdrawals'>('cost');

    const [pragmaticConfig, setPragmaticConfig] = useState<StableConfig>({
        provider: 'PRAGMATIC',
        cost: Object.fromEntries(CURRENCIES.map(c => [c, 0.2])),
        maximum_amount: Object.fromEntries(CURRENCIES.map(c => [c, 300])),
        minimum_amount: Object.fromEntries(CURRENCIES.map(c => [c, 25])),
        minimum_stake_to_wager: Object.fromEntries(CURRENCIES.map(c => [c, 0.5])),
        maximum_stake_to_wager: Object.fromEntries(CURRENCIES.map(c => [c, 5])),
        maximum_withdraw: Object.fromEntries(CURRENCIES.map(c => [c, 100])),
    });

    const [betsoftConfig, setBetsoftConfig] = useState<StableConfig>({
        provider: 'BETSOFT',
        cost: Object.fromEntries(CURRENCIES.map(c => [c, 0.2])),
        maximum_amount: Object.fromEntries(CURRENCIES.map(c => [c, 300])),
        minimum_amount: Object.fromEntries(CURRENCIES.map(c => [c, 25])),
        minimum_stake_to_wager: Object.fromEntries(CURRENCIES.map(c => [c, 0.5])),
        maximum_stake_to_wager: Object.fromEntries(CURRENCIES.map(c => [c, 5])),
        maximum_withdraw: Object.fromEntries(CURRENCIES.map(c => [c, 100])),
    });

    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const config = selectedProvider === 'PRAGMATIC' ? pragmaticConfig : betsoftConfig;
    const setConfig = selectedProvider === 'PRAGMATIC' ? setPragmaticConfig : setBetsoftConfig;

    const handleCurrencyChange = (currency: string, field: string, value: number) => {
        setConfig(prev => ({
            ...prev,
            [field]: {
                ...((prev[field as keyof StableConfig] as Record<string, number>) || {}),
                [currency]: value
            }
        }));
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            await axios.post(`${API_ENDPOINTS.BASE_URL}/api/stable-config`, config);
            setMessage(`✅ ${selectedProvider} stable values saved successfully!`);
            setTimeout(() => setMessage(''), 4000);
        } catch (error: any) {
            setMessage(`❌ Error: ${error.response?.data?.detail || error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveCurrency = (currency: string, field: string) => {
        setConfig(prev => {
            const fieldData = { ...(prev[field as keyof StableConfig] as Record<string, number>) };
            delete fieldData[currency];
            return {
                ...prev,
                [field]: fieldData
            };
        });
    };

    const handleAddCurrency = (field: string) => {
        const fieldData = (config as any)[field] as Record<string, number>;
        const unusedCurrencies = CURRENCIES.filter(c => !(c in fieldData));
        if (unusedCurrencies.length > 0) {
            const newCurrency = unusedCurrencies[0];
            setConfig(prev => ({
                ...prev,
                [field]: {
                    ...(prev[field as keyof StableConfig] as Record<string, number>),
                    [newCurrency]: 0
                }
            }));
        }
    };

    const renderSettingTable = (field: string, title: string, description: string) => {
        const fieldData = (config as any)[field] as Record<string, number>;
        const usedCurrencies = Object.keys(fieldData).sort();
        const unusedCurrencies = CURRENCIES.filter(c => !(c in fieldData));

        return (
            <div className="space-y-4">
                <div className="bg-slate-800 p-3 rounded flex justify-between items-start">
                    <div>
                        <h4 className="font-semibold text-slate-300 mb-1">{title}</h4>
                        <p className="text-xs text-slate-400">{description}</p>
                    </div>
                    <button
                        onClick={() => handleAddCurrency(field)}
                        disabled={unusedCurrencies.length === 0}
                        className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded font-semibold disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap ml-4"
                    >
                        + Add Currency
                    </button>
                </div>
                <table className="w-full border-collapse bg-slate-900 text-sm">
                    <thead>
                        <tr className="bg-slate-800 border-b border-slate-700">
                            <th className="px-4 py-2 text-left font-semibold text-blue-300 border-r border-slate-700">Currency</th>
                            <th className="px-4 py-2 text-center font-semibold text-green-300">Value</th>
                            <th className="px-4 py-2 text-center font-semibold text-red-300 w-20">Remove</th>
                        </tr>
                    </thead>
                    <tbody>
                        {usedCurrencies.map((currency, idx) => (
                            <tr key={currency} className={`border-b border-slate-700 ${idx % 2 === 0 ? 'bg-slate-900' : 'bg-slate-850'}`}>
                                <td className="px-4 py-2 text-sm font-bold text-blue-300 border-r border-slate-700 bg-slate-800 w-24">
                                    {currency}
                                </td>
                                <td className="px-4 py-2">
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={fieldData[currency] || ''}
                                        onChange={(e) => handleCurrencyChange(currency, field, parseFloat(e.target.value) || 0)}
                                        className="w-full bg-slate-700 text-white text-center px-3 py-2 rounded text-sm border border-slate-600 focus:border-blue-500 focus:outline-none"
                                        placeholder="0"
                                    />
                                </td>
                                <td className="px-4 py-2 text-center">
                                    <button
                                        onClick={() => handleRemoveCurrency(currency, field)}
                                        className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded font-semibold"
                                    >
                                        ✕
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {usedCurrencies.length === 0 && (
                    <div className="text-center py-4 text-slate-400 text-sm">
                        No currencies added yet. Click "+ Add Currency" to get started.
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Provider Selection */}
            <div className="flex gap-2">
                <button
                    onClick={() => setSelectedProvider('PRAGMATIC')}
                    className={`px-6 py-2 rounded font-semibold transition ${selectedProvider === 'PRAGMATIC'
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                >
                    🎰 PRAGMATIC
                </button>
                <button
                    onClick={() => setSelectedProvider('BETSOFT')}
                    className={`px-6 py-2 rounded font-semibold transition ${selectedProvider === 'BETSOFT'
                        ? 'bg-purple-600 text-white shadow-lg'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                >
                    🎲 BETSOFT
                </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 border-b border-slate-700 overflow-x-auto">
                <button
                    onClick={() => setActiveTab('cost')}
                    className={`px-4 py-3 font-medium text-sm whitespace-nowrap border-b-2 transition ${activeTab === 'cost'
                        ? 'border-blue-500 text-blue-400 bg-slate-800'
                        : 'border-transparent text-slate-400 hover:text-slate-300'
                        }`}
                >
                    💰 Cost (EUR, USD, etc)
                </button>
                <button
                    onClick={() => setActiveTab('amounts')}
                    className={`px-4 py-3 font-medium text-sm whitespace-nowrap border-b-2 transition ${activeTab === 'amounts'
                        ? 'border-blue-500 text-blue-400 bg-slate-800'
                        : 'border-transparent text-slate-400 hover:text-slate-300'
                        }`}
                >
                    💵 Bonus Amounts
                </button>
                <button
                    onClick={() => setActiveTab('stakes')}
                    className={`px-4 py-3 font-medium text-sm whitespace-nowrap border-b-2 transition ${activeTab === 'stakes'
                        ? 'border-blue-500 text-blue-400 bg-slate-800'
                        : 'border-transparent text-slate-400 hover:text-slate-300'
                        }`}
                >
                    🎯 Stake Limits
                </button>
                <button
                    onClick={() => setActiveTab('withdrawals')}
                    className={`px-4 py-3 font-medium text-sm whitespace-nowrap border-b-2 transition ${activeTab === 'withdrawals'
                        ? 'border-blue-500 text-blue-400 bg-slate-800'
                        : 'border-transparent text-slate-400 hover:text-slate-300'
                        }`}
                >
                    🏦 Withdrawal Limits
                </button>
            </div>

            {/* Tab Content */}
            <div className="bg-slate-800 rounded-lg p-6 space-y-4 min-h-96">
                {activeTab === 'cost' && renderSettingTable('cost', 'Cost Per Player', 'How much you pay (in EUR) for each player receiving this bonus')}
                {activeTab === 'amounts' && (
                    <div className="space-y-6">
                        {renderSettingTable('minimum_amount', 'Minimum Bonus Amount', 'Smallest bonus value per currency')}
                        {renderSettingTable('maximum_amount', 'Maximum Bonus Amount', 'Largest bonus value per currency')}
                    </div>
                )}
                {activeTab === 'stakes' && (
                    <div className="space-y-6">
                        {renderSettingTable('minimum_stake_to_wager', 'Minimum Stake', 'Smallest bet amount allowed')}
                        {renderSettingTable('maximum_stake_to_wager', 'Maximum Stake', 'Largest bet amount allowed')}
                    </div>
                )}
                {activeTab === 'withdrawals' && renderSettingTable('maximum_withdraw', 'Maximum Withdrawal Amount', 'Max amount player can withdraw from bonus winnings')}
            </div>

            {/* Status Message */}
            {message && (
                <div className={`p-4 rounded text-center font-semibold ${message.startsWith('✅') ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'
                    }`}>
                    {message}
                </div>
            )}

            {/* Save Button */}
            <button
                onClick={handleSave}
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-bold py-3 px-4 rounded-lg transition disabled:opacity-50"
            >
                {loading ? '💾 Saving...' : `✅ Save ${selectedProvider} Values`}
            </button>
        </div>
    );
}
