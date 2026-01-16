'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import React from 'react';
import { API_ENDPOINTS } from '@/lib/api-config';

const CURRENCIES = ['EUR', 'USD', 'CAD', 'AUD', 'BRL', 'NOK', 'NZD', 'CLP', 'MXN', 'GBP', 'PLN', 'PEN', 'ZAR', 'CHF', 'NGN', 'JPY', 'AZN', 'TRY', 'KZT', 'RUB', 'UZS'];

interface CurrencyTable {
    id: string;
    name: string;
    values: Record<string, number>;
}

interface AdminConfig {
    cost?: CurrencyTable[];
    minimum_amount?: CurrencyTable[];
    maximum_amount?: CurrencyTable[];
    maximum_withdraw?: CurrencyTable[];
}

interface BonusFormData {
    id: string;
    provider: string;
    cost_eur: number;
    minimum_deposit_eur: number;
    maximum_amount_eur: number;
    percentage: number;
    wagering_multiplier: number;
    schedule_type: string;
    schedule_from: string;
    schedule_to: string;
    trigger_type: string;
    category: string;
    bonus_type: string;
    notes: string;
}

export default function SimpleBonusForm() {
    const [formData, setFormData] = useState<BonusFormData>({
        id: '',
        provider: 'PRAGMATIC',
        cost_eur: 0.2,
        minimum_deposit_eur: 25,
        maximum_amount_eur: 100,
        percentage: 200,
        wagering_multiplier: 15,
        schedule_type: 'period',
        schedule_from: '',
        schedule_to: '',
        trigger_type: 'reload',
        category: 'GAMES',
        bonus_type: 'cash',
        notes: '',
    });

    const [adminConfig, setAdminConfig] = useState<AdminConfig | null>(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [showWizard, setShowWizard] = useState(true);

    // ============ FETCH ADMIN CONFIG TABLES ============
    useEffect(() => {
        const fetchAdminConfig = async () => {
            try {
                console.log(`🔍 Fetching admin config from ${formData.provider}...`);
                const response = await axios.get(`http://localhost:8000/api/stable-config/${formData.provider}/with-tables`);
                console.log('📦 Admin config response:', response.data);
                setAdminConfig(response.data as AdminConfig);
            } catch (error) {
                console.error('❌ Error fetching admin config:', error);
            }
        };
        fetchAdminConfig();
    }, [formData.provider]);

    // ============ MULTI-CURRENCY LOOKUP FUNCTION ============
    const buildCurrencyMap = (eurValue: number, fieldName: 'cost' | 'minimum_amount' | 'maximum_amount' | 'maximum_withdraw'): Record<string, number> => {
        if (!adminConfig) {
            console.warn(`⚠️ Admin config not loaded yet`);
            return Object.fromEntries(CURRENCIES.map(c => [c, eurValue]));
        }

        const tables = adminConfig[fieldName];
        if (!tables || !Array.isArray(tables)) {
            console.warn(`⚠️ No ${fieldName} tables found in admin config`);
            return Object.fromEntries(CURRENCIES.map(c => [c, eurValue]));
        }

        const tolerance = 0.001;
        for (const table of tables) {
            if (Math.abs(table.values.EUR - eurValue) < tolerance) {
                console.log(`✅ Found matching ${fieldName} table for EUR = ${eurValue}:`, table.values);
                return { '*': table.values.EUR, ...table.values };
            }
        }

        console.warn(`⚠️ No matching ${fieldName} table found for EUR = ${eurValue}`);
        return Object.fromEntries(CURRENCIES.map(c => [c, eurValue]));
    };

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
            // Build payload using multi-currency lookups from admin config
            const cost = buildCurrencyMap(formData.cost_eur, 'cost');
            const minimum_amount = buildCurrencyMap(formData.minimum_deposit_eur, 'minimum_amount');
            const maximum_amount = buildCurrencyMap(formData.maximum_amount_eur, 'maximum_amount');
            const maximum_withdraw = buildCurrencyMap(100, 'maximum_withdraw'); // Default to 100

            const payload: any = {
                id: formData.id,
                trigger_name: { '*': `${formData.provider} Bonus` },
                trigger_description: { '*': `${formData.provider} ${formData.bonus_type} bonus` },
                trigger_type: formData.trigger_type,
                trigger_iterations: 3,
                trigger_duration: '7d',
                percentage: formData.percentage,
                wagering_multiplier: formData.wagering_multiplier,
                minimum_amount: minimum_amount,
                maximum_amount: maximum_amount,
                cost: cost,
                minimum_stake_to_wager: { '*': 0.5 },
                maximum_stake_to_wager: { '*': 5 },
                maximum_withdraw: maximum_withdraw,
                include_amount_on_target_wager: true,
                compensate_overspending: true,
                withdraw_active: false,
                category: formData.category,
                provider: formData.provider,
                brand: formData.provider,
                bonus_type: formData.bonus_type,
                notes: formData.notes || undefined,
            };

            // Only add schedule fields if both start and end dates are provided
            if (formData.schedule_from && formData.schedule_to) {
                payload.schedule_type = formData.schedule_type;
                payload.schedule_from = formData.schedule_from;
                payload.schedule_to = formData.schedule_to;
            }

            console.log('🚀 Submitting payload:', payload);

            const response = await axios.post(API_ENDPOINTS.BONUS_TEMPLATES, payload);
            setMessage(`✅ Bonus created! ID: ${response.data.id}`);
            setFormData({
                id: '',
                provider: 'PRAGMATIC',
                cost_eur: 0.2,
                minimum_deposit_eur: 25,
                maximum_amount_eur: 100,
                percentage: 200,
                wagering_multiplier: 15,
                schedule_type: 'period',
                schedule_from: '',
                schedule_to: '',
                trigger_type: 'reload',
                category: 'GAMES',
                bonus_type: 'cash',
                notes: '',
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
            {/* New Bonus Builder - Always Visible */}
            <div>
                <h2 className="text-2xl font-bold text-blue-300 mb-4">✨ Bonus Builder (Auto-Generate ID)</h2>
                <BonusWizard
                    inline={true}
                    onBonusCreated={(bonusData) => {
                        console.log('Bonus created:', bonusData);
                        // Auto-fill the classic form with the generated ID
                        setFormData(prev => ({
                            ...prev,
                            id: bonusData.id
                        }));
                        setMessage(`✅ Bonus ID "${bonusData.id}" generated! It's been auto-filled in the form below.`);
                        setTimeout(() => setMessage(''), 4000);
                    }}
                />
            </div>

            {/* Divider */}
            <div className="border-t-2 border-gray-700 my-8"></div>

            {/* Classic Casino Bonus Form - Always Visible */}
            <div>
                <h2 className="text-2xl font-bold text-blue-300 mb-4">🎰 Classic Casino Bonus Form</h2>
                <p className="text-sm text-gray-400 mb-4">💡 The Bonus ID from the builder above will auto-fill here. Adjust other settings and submit to complete creation.</p>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Row 1: Name & Provider */}
                    <div className="card">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="label-text">Bonus Name (Auto-filled from Builder)</label>
                                <input
                                    type="text"
                                    name="id"
                                    value={formData.id}
                                    onChange={handleChange}
                                    required
                                    className="input-field bg-gray-700"
                                    placeholder="Auto-generated from Bonus Builder above"
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
                                <p className="text-xs text-slate-400 mt-2">💡 Other currencies auto-filled from admin config</p>
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

                    {/* Row 2.5: Min Deposit & Max Amount */}
                    <div className="card">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="label-text">Min Deposit Amount (EUR)</label>
                                <input
                                    type="number"
                                    step="1"
                                    name="minimum_deposit_eur"
                                    value={formData.minimum_deposit_eur}
                                    onChange={handleChange}
                                    className="input-field"
                                    placeholder="25"
                                />
                                <p className="text-xs text-slate-400 mt-2">💡 Loads all currencies from admin config</p>
                            </div>
                            <div>
                                <label className="label-text">Maximum Amount (EUR)</label>
                                <input
                                    type="number"
                                    step="1"
                                    name="maximum_amount_eur"
                                    value={formData.maximum_amount_eur}
                                    onChange={handleChange}
                                    className="input-field"
                                    placeholder="100"
                                />
                                <p className="text-xs text-slate-400 mt-2">💡 Loads all currencies from admin config</p>
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
                                <label className="label-text">Start Date (Optional)</label>
                                <input
                                    type="datetime-local"
                                    name="schedule_from"
                                    value={formData.schedule_from}
                                    onChange={handleChange}
                                    className="input-field"
                                />
                            </div>
                            <div>
                                <label className="label-text">End Date (Optional)</label>
                                <input
                                    type="datetime-local"
                                    name="schedule_to"
                                    value={formData.schedule_to}
                                    onChange={handleChange}
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

                    {/* Notes */}
                    <div className="card-base">
                        <h3 className="text-xl font-semibold text-white mb-4">📝 Notes (Optional)</h3>
                        <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                            className="input-field w-full"
                            rows={4}
                            placeholder="Add any notes about this bonus template..."
                        />
                    </div>
                    {/* Notes */}
                    <div className="form-section">
                        <h3 className="section-title">📝 Notes (Optional)</h3>
                        <div>
                            <label className="label-text">Internal Notes</label>
                            <textarea
                                name="notes"
                                value={formData.notes}
                                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                className="input-field"
                                rows={4}
                                placeholder="Add any internal notes about this bonus..."
                            />
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
        </div>
    );
}
