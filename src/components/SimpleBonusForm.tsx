'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import React from 'react';
import { API_ENDPOINTS } from '@/lib/api-config';

interface BonusFormData {
    id: string;
    provider: string;
    cost_eur: number;
    percentage: number;
    wagering_multiplier: number;
    schedule_type: string;
    schedule_from: string;
    schedule_to: string;
    trigger_type: string;
    category: string;
    bonus_type: string;
}

export default function SimpleBonusForm() {
    const [formData, setFormData] = useState<BonusFormData>({
        id: '',
        provider: 'PRAGMATIC',
        cost_eur: 0.2,
        percentage: 200,
        wagering_multiplier: 15,
        schedule_type: 'period',
        schedule_from: '',
        schedule_to: '',
        trigger_type: 'reload',
        category: 'GAMES',
        bonus_type: 'cash',
    });

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const parsedValue = type === 'number' ? parseFloat(value) : value;
        setFormData(prev => ({
            ...prev,
            [name]: parsedValue
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await axios.post(API_ENDPOINTS.BONUS_TEMPLATES, {
                id: formData.id,
                schedule_type: formData.schedule_type,
                schedule_from: formData.schedule_from,
                schedule_to: formData.schedule_to,
                trigger_name: { '*': `${formData.provider} Bonus` },
                trigger_description: { '*': `${formData.provider} ${formData.bonus_type} bonus` },
                trigger_type: formData.trigger_type,
                trigger_iterations: 3,
                trigger_duration: '7d',
                percentage: formData.percentage,
                wagering_multiplier: formData.wagering_multiplier,
                minimum_amount: { '*': 25 },
                maximum_amount: { '*': 300 },
                minimum_stake_to_wager: { '*': 0.5 },
                maximum_stake_to_wager: { '*': 5 },
                maximum_withdraw: { '*': 3 },
                include_amount_on_target_wager: true,
                compensate_overspending: true,
                withdraw_active: false,
                category: formData.category,
                provider: formData.provider,
                brand: formData.provider,
                bonus_type: formData.bonus_type,
            });
            setMessage(`✅ Bonus created! ID: ${response.data.id}`);
            setFormData({
                id: '',
                provider: 'PRAGMATIC',
                cost_eur: 0.2,
                percentage: 200,
                wagering_multiplier: 15,
                schedule_type: 'period',
                schedule_from: '',
                schedule_to: '',
                trigger_type: 'reload',
                category: 'GAMES',
                bonus_type: 'cash',
            });
            setTimeout(() => setMessage(''), 4000);
        } catch (error: any) {
            setMessage(`❌ Error: ${error.response?.data?.detail || error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="card bg-gradient-to-r from-blue-950/50 to-slate-800 border-blue-700/50">
                <h2 className="text-2xl font-bold text-blue-300 mb-2">🎰 Create Bonus Template</h2>
                <p className="text-slate-400 text-sm">Quick form with pre-configured values. Go to Admin Panel to customize stable values.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Row 1: Name & Provider */}
                <div className="card">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="label-text">Bonus Name</label>
                            <input
                                type="text"
                                name="id"
                                value={formData.id}
                                onChange={handleChange}
                                required
                                className="input-field"
                                placeholder="e.g., Black Friday Reload"
                            />
                        </div>
                        <div>
                            <label className="label-text">Provider</label>
                            <select
                                name="provider"
                                value={formData.provider}
                                onChange={handleChange}
                                className="input-field"
                            >
                                <option value="PRAGMATIC">Pragmatic</option>
                                <option value="BETSOFT">Betsoft</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Row 2: Cost & Percentage */}
                <div className="card">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="label-text">Cost (EUR)</label>
                            <input
                                type="number"
                                step="0.01"
                                name="cost_eur"
                                value={formData.cost_eur}
                                onChange={handleChange}
                                className="input-field"
                            />
                            <p className="text-xs text-slate-400 mt-2">💡 Other currencies auto-filled from stable values</p>
                        </div>
                        <div>
                            <label className="label-text">Bonus %</label>
                            <input
                                type="number"
                                name="percentage"
                                value={formData.percentage}
                                onChange={handleChange}
                                className="input-field"
                                placeholder="200"
                            />
                        </div>
                    </div>
                </div>

                {/* Row 3: Schedule */}
                <div className="card">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="label-text">Schedule Type</label>
                            <select
                                name="schedule_type"
                                value={formData.schedule_type}
                                onChange={handleChange}
                                className="input-field"
                            >
                                <option value="period">Period</option>
                                <option value="weekly">Weekly</option>
                                <option value="daily">Daily</option>
                            </select>
                        </div>
                        <div>
                            <label className="label-text">Start Date</label>
                            <input
                                type="datetime-local"
                                name="schedule_from"
                                value={formData.schedule_from}
                                onChange={handleChange}
                                required
                                className="input-field"
                            />
                        </div>
                        <div>
                            <label className="label-text">End Date</label>
                            <input
                                type="datetime-local"
                                name="schedule_to"
                                value={formData.schedule_to}
                                onChange={handleChange}
                                required
                                className="input-field"
                            />
                        </div>
                    </div>
                </div>

                {/* Row 4: Bonus Details */}
                <div className="card">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="label-text">Wagering Multiplier</label>
                            <input
                                type="number"
                                name="wagering_multiplier"
                                value={formData.wagering_multiplier}
                                onChange={handleChange}
                                className="input-field"
                                placeholder="15"
                            />
                        </div>
                        <div>
                            <label className="label-text">Bonus Type</label>
                            <select
                                name="bonus_type"
                                value={formData.bonus_type}
                                onChange={handleChange}
                                className="input-field"
                            >
                                <option value="cash">Cash</option>
                                <option value="bonus">Bonus Points</option>
                                <option value="free_spins">Free Spins</option>
                            </select>
                        </div>
                        <div>
                            <label className="label-text">Trigger Type</label>
                            <select
                                name="trigger_type"
                                value={formData.trigger_type}
                                onChange={handleChange}
                                className="input-field"
                            >
                                <option value="reload">Reload</option>
                                <option value="deposit">Deposit</option>
                                <option value="first_deposit">First Deposit</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Message */}
                {message && (
                    <div className={`p-4 rounded-lg ${message.includes('✅') ? 'bg-green-900/30 text-green-300' : 'bg-red-900/30 text-red-300'}`}>
                        {message}
                    </div>
                )}

                {/* Submit */}
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full button-primary py-3 text-lg font-semibold"
                >
                    {loading ? '⏳ Creating...' : '✅ Create Bonus Template'}
                </button>
            </form>
        </div>
    );
}
