'use client';

import { useState } from 'react';
import axios from 'axios';
import React from 'react';
import { API_ENDPOINTS } from '@/lib/api-config';

const CURRENCIES = ['EUR', 'USD', 'CAD', 'AUD', 'NZD', 'GBP', 'BRL', 'NOK', 'PEN', 'CLP', 'MXN', 'CHF', 'ZAR', 'PLN', 'AZN', 'TRY', 'JPY', 'KZT', 'RUB', 'HUF', 'UZS'];

interface BonusTemplateFormData {
    id: string;
    schedule_type: string;
    schedule_from: string;
    schedule_to: string;
    trigger_name: Record<string, string>;
    trigger_description: Record<string, string>;
    trigger_type: string;
    trigger_iterations: number;
    trigger_duration: string;
    percentage: number;
    wagering_multiplier: number;
    minimum_amount: Record<string, number>;
    maximum_amount: Record<string, number>;
    minimum_stake_to_wager: Record<string, number>;
    maximum_stake_to_wager: Record<string, number>;
    maximum_withdraw: Record<string, number>;
    include_amount_on_target_wager: boolean;
    compensate_overspending: boolean;
    withdraw_active: boolean;
    category: string;
    provider: string;
    brand: string;
    bonus_type: string;
}

export default function CasinoTeamForm() {
    const [formData, setFormData] = useState<BonusTemplateFormData>({
        id: '',
        schedule_type: 'period',
        schedule_from: '',
        schedule_to: '',
        trigger_name: { '*': 'Reload Bonus' },
        trigger_description: { '*': 'Weekly reload bonus offer' },
        trigger_type: 'reload',
        trigger_iterations: 3,
        trigger_duration: '7d',
        percentage: 200,
        wagering_multiplier: 15,
        minimum_amount: Object.fromEntries(CURRENCIES.map(c => [c, c === 'EUR' ? 25 : 25])),
        maximum_amount: Object.fromEntries(CURRENCIES.map(c => [c, c === 'EUR' ? 300 : 300])),
        minimum_stake_to_wager: Object.fromEntries(CURRENCIES.map(() => ['*', 0.5])),
        maximum_stake_to_wager: Object.fromEntries(CURRENCIES.map(() => ['*', 5])),
        maximum_withdraw: Object.fromEntries(CURRENCIES.map(() => ['*', 3])),
        include_amount_on_target_wager: true,
        compensate_overspending: true,
        withdraw_active: false,
        category: 'GAMES',
        provider: 'SYSTEM',
        brand: 'SYSTEM',
        bonus_type: 'cash',
    });

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleBasicChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const parsedValue = type === 'number' ? parseFloat(value) : type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
        setFormData(prev => ({
            ...prev,
            [name]: parsedValue
        }));
    };

    const handleCurrencyChange = (currency: string, field: string, value: number) => {
        setFormData(prev => ({
            ...prev,
            [field]: {
                ...((prev[field as keyof BonusTemplateFormData]) as Record<string, number>),
                [currency]: value
            }
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await axios.post(API_ENDPOINTS.BONUS_TEMPLATES, formData);
            setMessage(`✅ Bonus Template created! ID: ${response.data.id}`);
            setTimeout(() => setMessage(''), 5000);
        } catch (error: any) {
            setMessage(`❌ Error: ${error.response?.data?.detail || error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="card bg-gradient-to-r from-blue-950/50 to-slate-800 border-blue-700/50">
                <h2 className="text-2xl font-bold text-blue-300 mb-2 flex items-center gap-2">🎰 Create Bonus Template</h2>
                <p className="text-slate-400 text-sm">Define bonus structure, schedule, and currency conversions. Translations will be added by the Translation Team.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* SECTION 1: BASIC INFO */}
                <div className="card">
                    <h3 className="section-header text-blue-400">📋 Basic Information</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <label className="label-text">Bonus Template ID / Name</label>
                            <input
                                type="text"
                                name="id"
                                value={formData.id}
                                onChange={handleBasicChange}
                                required
                                className="input-field"
                                placeholder="e.g., Black Friday: Casino Reload 200% up to €300"
                            />
                        </div>
                        <div>
                            <label className="label-text">Bonus Type</label>
                            <select
                                name="bonus_type"
                                value={formData.bonus_type}
                                onChange={handleBasicChange}
                                className="input-field"
                            >
                                <option value="cash">Cash Bonus</option>
                                <option value="bonus">Bonus Points</option>
                                <option value="free_spins">Free Spins</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* SECTION 2: SCHEDULE */}
                <div className="card">
                    <h3 className="section-header text-green-400">📅 Schedule</h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="label-text">Schedule Type</label>
                            <select
                                name="schedule_type"
                                value={formData.schedule_type}
                                onChange={handleBasicChange}
                                className="input-field"
                            >
                                <option value="period">Period</option>
                                <option value="weekly">Weekly</option>
                                <option value="daily">Daily</option>
                            </select>
                        </div>
                        <div>
                            <label className="label-text">Start Date & Time</label>
                            <input
                                type="datetime-local"
                                name="schedule_from"
                                value={formData.schedule_from}
                                onChange={handleBasicChange}
                                required
                                className="input-field"
                            />
                        </div>
                        <div>
                            <label className="label-text">End Date & Time</label>
                            <input
                                type="datetime-local"
                                name="schedule_to"
                                value={formData.schedule_to}
                                onChange={handleBasicChange}
                                required
                                className="input-field"
                            />
                        </div>
                    </div>
                </div>

                {/* SECTION 3: BONUS RULES */}
                <div className="card">
                    <h3 className="section-header text-purple-400">⚙️ Bonus Rules</h3>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                        <div>
                            <label className="label-text">Bonus %</label>
                            <input
                                type="number"
                                name="percentage"
                                value={formData.percentage}
                                onChange={handleBasicChange}
                                required
                                className="input-field"
                                placeholder="200"
                            />
                        </div>
                        <div>
                            <label className="label-text">Wagering Multiplier</label>
                            <input
                                type="number"
                                name="wagering_multiplier"
                                value={formData.wagering_multiplier}
                                onChange={handleBasicChange}
                                step="0.1"
                                required
                                className="input-field"
                                placeholder="15"
                            />
                        </div>
                        <div>
                            <label className="label-text">Trigger Type</label>
                            <select
                                name="trigger_type"
                                value={formData.trigger_type}
                                onChange={handleBasicChange}
                                className="input-field"
                            >
                                <option value="deposit">Deposit</option>
                                <option value="reload">Reload</option>
                                <option value="cashback">Cashback</option>
                            </select>
                        </div>
                        <div>
                            <label className="label-text">Valid For</label>
                            <input
                                type="text"
                                name="trigger_duration"
                                value={formData.trigger_duration}
                                onChange={handleBasicChange}
                                className="input-field"
                                placeholder="7d"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="label-text">Times Claimable</label>
                            <input
                                type="number"
                                name="trigger_iterations"
                                value={formData.trigger_iterations}
                                onChange={handleBasicChange}
                                className="input-field"
                            />
                        </div>
                        <label className="flex items-center gap-3 p-3 rounded-lg bg-slate-700/30 border border-slate-600 hover:bg-slate-700/50 cursor-pointer transition-colors">
                            <input
                                type="checkbox"
                                name="compensate_overspending"
                                checked={formData.compensate_overspending}
                                onChange={handleBasicChange}
                                className="w-5 h-5 rounded accent-blue-500 cursor-pointer"
                            />
                            <span className="text-sm text-slate-300 font-medium">Compensate Overspending</span>
                        </label>
                        <label className="flex items-center gap-3 p-3 rounded-lg bg-slate-700/30 border border-slate-600 hover:bg-slate-700/50 cursor-pointer transition-colors">
                            <input
                                type="checkbox"
                                name="withdraw_active"
                                checked={formData.withdraw_active}
                                onChange={handleBasicChange}
                                className="w-5 h-5 rounded accent-blue-500 cursor-pointer"
                            />
                            <span className="text-sm text-slate-300 font-medium">Withdrawable</span>
                        </label>
                    </div>
                </div>

                {/* SECTION 4: CURRENCY TABLE */}
                <div className="card overflow-hidden">
                    <h3 className="section-header text-amber-400">💱 Currency Amounts</h3>

                    <div className="overflow-x-auto rounded-lg border border-slate-700">
                        <table className="w-full text-sm border-collapse">
                            <thead>
                                <tr className="table-header">
                                    <th className="table-cell text-left font-semibold text-slate-200">Currency</th>
                                    <th className="table-cell text-right font-semibold text-slate-200">Min Deposit</th>
                                    <th className="table-cell text-right font-semibold text-slate-200">Max Bonus</th>
                                    <th className="table-cell text-right font-semibold text-slate-200">Min Bet</th>
                                    <th className="table-cell text-right font-semibold text-slate-200">Max Bet</th>
                                </tr>
                            </thead>
                            <tbody>
                                {CURRENCIES.map((currency, idx) => (
                                    <tr key={currency} className={`table-row ${idx % 2 === 0 ? 'bg-slate-800/30' : ''}`}>
                                        <td className="table-cell font-semibold text-blue-300 w-16">{currency}</td>
                                        <td className="table-cell">
                                            <input
                                                type="number"
                                                value={formData.minimum_amount[currency] || 25}
                                                onChange={(e) => handleCurrencyChange(currency, 'minimum_amount', parseFloat(e.target.value))}
                                                className="w-full px-2 py-1.5 bg-slate-600/50 border border-slate-500 rounded text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            />
                                        </td>
                                        <td className="table-cell">
                                            <input
                                                type="number"
                                                value={formData.maximum_amount[currency] || 300}
                                                onChange={(e) => handleCurrencyChange(currency, 'maximum_amount', parseFloat(e.target.value))}
                                                className="w-full px-2 py-1.5 bg-slate-600/50 border border-slate-500 rounded text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            />
                                        </td>
                                        <td className="table-cell">
                                            <input
                                                type="number"
                                                value={formData.minimum_stake_to_wager['*'] || 0.5}
                                                onChange={(e) => handleCurrencyChange(currency, 'minimum_stake_to_wager', parseFloat(e.target.value))}
                                                className="w-full px-2 py-1.5 bg-slate-600/50 border border-slate-500 rounded text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                step="0.1"
                                            />
                                        </td>
                                        <td className="table-cell">
                                            <input
                                                type="number"
                                                value={formData.maximum_stake_to_wager['*'] || 5}
                                                onChange={(e) => handleCurrencyChange(currency, 'maximum_stake_to_wager', parseFloat(e.target.value))}
                                                className="w-full px-2 py-1.5 bg-slate-600/50 border border-slate-500 rounded text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                step="0.1"
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* SUBMIT BUTTON */}
                <button
                    type="submit"
                    disabled={loading}
                    className="button-danger w-full text-lg mt-8"
                >
                    {loading ? '⏳ Creating Template...' : '✅ Create Bonus Template'}
                </button>

                {message && (
                    <div className={message.includes('✅') ? 'message-success' : 'message-error'} role="alert">
                        <span className="text-lg">{message.includes('✅') ? '✅' : '❌'}</span>
                        <span>{message.replace(/[✅❌]/g, '').trim()}</span>
                    </div>
                )}
            </form>
        </div>
    );
}
