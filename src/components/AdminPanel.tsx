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

    const [config, setConfig] = useState<StableConfig>({
        provider: 'PRAGMATIC',
        cost: Object.fromEntries(CURRENCIES.map(c => [c, c === 'EUR' ? 0.2 : 0.2])),
        maximum_amount: Object.fromEntries(CURRENCIES.map(c => [c, c === 'EUR' ? 300 : 300])),
        minimum_amount: Object.fromEntries(CURRENCIES.map(c => [c, c === 'EUR' ? 25 : 25])),
        minimum_stake_to_wager: Object.fromEntries(CURRENCIES.map(c => [c, 0.5])),
        maximum_stake_to_wager: Object.fromEntries(CURRENCIES.map(c => [c, 5])),
        maximum_withdraw: Object.fromEntries(CURRENCIES.map(c => [c, 3])),
    });

    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const handleProviderChange = (provider: string) => {
        setSelectedProvider(provider);
        setConfig(prev => ({ ...prev, provider }));
    };

    const handleCurrencyChange = (currency: string, field: keyof Omit<StableConfig, 'provider'>, value: number) => {
        setConfig(prev => ({
            ...prev,
            [field]: {
                ...((prev[field] as Record<string, number>) || {}),
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

    const renderCurrencyTable = (field: keyof Omit<StableConfig, 'provider'>, title: string) => (
        <div className="card bg-slate-900 border-slate-700">
            <h4 className="text-lg font-semibold text-slate-300 mb-4">{title}</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {CURRENCIES.map(currency => (
                    <div key={currency}>
                        <label className="text-xs text-slate-400 uppercase tracking-wide">{currency}</label>
                        <input
                            type="number"
                            step="0.01"
                            value={(config[field] as Record<string, number>)[currency] || ''}
                            onChange={(e) => handleCurrencyChange(currency, field, parseFloat(e.target.value))}
                            className="input-field w-full text-sm"
                            placeholder="0.00"
                        />
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="card bg-gradient-to-r from-red-950/50 to-slate-800 border-red-700/50">
                <h2 className="text-2xl font-bold text-red-300 mb-2">⚙️ Admin Panel - Stable Values</h2>
                <p className="text-slate-400 text-sm">Configure default values for Pragmatic and Betsoft providers. These values will be auto-filled in the bonus template form.</p>
            </div>

            {/* Provider Selection */}
            <div className="card">
                <h3 className="text-lg font-semibold text-slate-300 mb-4">Select Provider</h3>
                <div className="flex gap-4">
                    {PROVIDERS.map(provider => (
                        <button
                            key={provider}
                            onClick={() => handleProviderChange(provider)}
                            className={`px-6 py-3 rounded-lg font-semibold transition ${selectedProvider === provider
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                }`}
                        >
                            {provider}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="card">
                <div className="flex gap-2 mb-6 overflow-x-auto">
                    {[
                        { key: 'cost', label: '💰 Cost Per Game', icon: '💰' },
                        { key: 'amounts', label: '💵 Bonus Amounts', icon: '💵' },
                        { key: 'stakes', label: '🎯 Stake Limits', icon: '🎯' },
                        { key: 'withdrawals', label: '🏦 Withdrawal Limits', icon: '🏦' }
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key as any)}
                            className={`px-4 py-2 rounded-lg font-semibold transition whitespace-nowrap ${activeTab === tab.key
                                    ? 'bg-green-600 text-white'
                                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="space-y-4">
                    {activeTab === 'cost' && renderCurrencyTable('cost', 'Cost Per Game (€)')}
                    {activeTab === 'amounts' && (
                        <div className="space-y-4">
                            {renderCurrencyTable('minimum_amount', 'Minimum Bonus Amount')}
                            {renderCurrencyTable('maximum_amount', 'Maximum Bonus Amount')}
                        </div>
                    )}
                    {activeTab === 'stakes' && (
                        <div className="space-y-4">
                            {renderCurrencyTable('minimum_stake_to_wager', 'Minimum Stake to Wager')}
                            {renderCurrencyTable('maximum_stake_to_wager', 'Maximum Stake to Wager')}
                        </div>
                    )}
                    {activeTab === 'withdrawals' && renderCurrencyTable('maximum_withdraw', 'Maximum Withdrawal')}
                </div>
            </div>

            {/* Message */}
            {message && (
                <div className={`p-4 rounded-lg ${message.includes('✅') ? 'bg-green-900/30 text-green-300' : 'bg-red-900/30 text-red-300'}`}>
                    {message}
                </div>
            )}

            {/* Save Button */}
            <button
                onClick={handleSave}
                disabled={loading}
                className="w-full button-primary py-3 text-lg font-semibold"
            >
                {loading ? '💾 Saving...' : '💾 Save Stable Values'}
            </button>
        </div>
    );
}
