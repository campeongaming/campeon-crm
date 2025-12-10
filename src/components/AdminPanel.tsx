'use client';

import { useState } from 'react';
import axios from 'axios';
import React from 'react';
import { API_ENDPOINTS } from '@/lib/api-config';

const CURRENCIES = ['EUR', 'USD', 'CAD', 'AUD', 'NZD', 'GBP', 'BRL', 'NOK', 'PEN', 'CLP', 'MXN', 'CHF', 'ZAR', 'PLN', 'AZN', 'TRY', 'JPY', 'KZT', 'RUB', 'HUF', 'UZS'];
const PROVIDERS = ['PRAGMATIC', 'BETSOFT'];

interface CurrencyTable {
    id: string;
    name: string;
    values: Record<string, number>;
}

interface StableConfigWithVariations {
    provider: string;
    cost: CurrencyTable[];
    maximum_amount: CurrencyTable[];
    minimum_amount: CurrencyTable[];
    minimum_stake_to_wager: CurrencyTable[];
    maximum_stake_to_wager: CurrencyTable[];
    maximum_withdraw: CurrencyTable[];
}

export default function AdminPanel() {
    const [selectedProvider, setSelectedProvider] = useState('PRAGMATIC');
    const [activeTab, setActiveTab] = useState<'cost' | 'amounts' | 'stakes' | 'withdrawals'>('cost');

    const defaultTable: CurrencyTable = {
        id: '1',
        name: 'Table 1',
        values: Object.fromEntries(CURRENCIES.map(c => [c, 0.2]))
    };

    const [pragmaticConfig, setPragmaticConfig] = useState<StableConfigWithVariations>({
        provider: 'PRAGMATIC',
        cost: [defaultTable],
        maximum_amount: [defaultTable],
        minimum_amount: [defaultTable],
        minimum_stake_to_wager: [defaultTable],
        maximum_stake_to_wager: [defaultTable],
        maximum_withdraw: [defaultTable],
    });

    const [betsoftConfig, setBetsoftConfig] = useState<StableConfigWithVariations>({
        provider: 'BETSOFT',
        cost: [defaultTable],
        maximum_amount: [defaultTable],
        minimum_amount: [defaultTable],
        minimum_stake_to_wager: [defaultTable],
        maximum_stake_to_wager: [defaultTable],
        maximum_withdraw: [defaultTable],
    });

    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const config = selectedProvider === 'PRAGMATIC' ? pragmaticConfig : betsoftConfig;
    const setConfig = selectedProvider === 'PRAGMATIC' ? setPragmaticConfig : setBetsoftConfig;

    const handleCurrencyChange = (field: string, tableId: string, currency: string, value: number) => {
        setConfig(prev => ({
            ...prev,
            [field]: (prev[field as keyof StableConfigWithVariations] as CurrencyTable[]).map(table =>
                table.id === tableId
                    ? { ...table, values: { ...table.values, [currency]: value } }
                    : table
            )
        }));
    };

    const handleRemoveCurrency = (field: string, tableId: string, currency: string) => {
        setConfig(prev => ({
            ...prev,
            [field]: (prev[field as keyof StableConfigWithVariations] as CurrencyTable[]).map(table =>
                table.id === tableId
                    ? { ...table, values: Object.fromEntries(Object.entries(table.values).filter(([k]) => k !== currency)) }
                    : table
            )
        }));
    };

    const handleAddCurrency = (field: string, tableId: string) => {
        const tables = (config[field as keyof StableConfigWithVariations] as CurrencyTable[]);
        const currentTable = tables.find(t => t.id === tableId);
        if (!currentTable) return;

        const unusedCurrencies = CURRENCIES.filter(c => !(c in currentTable.values));
        if (unusedCurrencies.length > 0) {
            setConfig(prev => ({
                ...prev,
                [field]: (prev[field as keyof StableConfigWithVariations] as CurrencyTable[]).map(table =>
                    table.id === tableId
                        ? { ...table, values: { ...table.values, [unusedCurrencies[0]]: 0 } }
                        : table
                )
            }));
        }
    };

    const handleAddTable = (field: string) => {
        const tables = (config[field as keyof StableConfigWithVariations] as CurrencyTable[]);
        const newId = String(Math.max(0, ...tables.map(t => parseInt(t.id))) + 1);
        const newTable: CurrencyTable = {
            id: newId,
            name: `Table ${newId}`,
            values: { 'EUR': 0.25 }
        };
        setConfig(prev => ({
            ...prev,
            [field]: [...(prev[field as keyof StableConfigWithVariations] as CurrencyTable[]), newTable]
        }));
    };

    const handleRemoveTable = (field: string, tableId: string) => {
        setConfig(prev => ({
            ...prev,
            [field]: (prev[field as keyof StableConfigWithVariations] as CurrencyTable[]).filter(t => t.id !== tableId)
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

    const renderSettingTable = (field: string, title: string, description: string) => {
        const tables = (config[field as keyof StableConfigWithVariations] as CurrencyTable[]);

        return (
            <div className="space-y-4">
                <div className="bg-slate-800 p-3 rounded flex justify-between items-start">
                    <div>
                        <h4 className="font-semibold text-slate-300 mb-1">{title}</h4>
                        <p className="text-xs text-slate-400">{description}</p>
                    </div>
                    <button
                        onClick={() => handleAddTable(field)}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded font-semibold whitespace-nowrap ml-4"
                    >
                        + Add Table
                    </button>
                </div>

                {/* Tables displayed side-by-side */}
                <div className="flex gap-6 overflow-x-auto pb-2 w-full">
                    {tables.map((table, tableIdx) => {
                        const usedCurrencies = Object.keys(table.values).sort();
                        const unusedCurrencies = CURRENCIES.filter(c => !(c in table.values));

                        return (
                            <div key={table.id} className="flex-shrink-0 border-t-4 border-blue-500 pt-3 bg-slate-850 rounded p-4">
                                <div className="flex justify-between items-center mb-3 gap-4 whitespace-nowrap">
                                    <h5 className="font-semibold text-slate-200 text-sm">{table.name}</h5>
                                    {tables.length > 1 && (
                                        <button
                                            onClick={() => handleRemoveTable(field, table.id)}
                                            className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded font-semibold flex-shrink-0"
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>

                                <table className="border-collapse bg-slate-900 text-xs whitespace-nowrap">
                                    <thead>
                                        <tr className="bg-slate-800 border-b border-slate-700">
                                            <th className="px-3 py-1 text-left font-semibold text-blue-300 border-r border-slate-700">Currency</th>
                                            <th className="px-3 py-1 text-center font-semibold text-green-300">Value</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {usedCurrencies.map((currency, idx) => (
                                            <tr key={currency} className={`border-b border-slate-700 ${idx % 2 === 0 ? 'bg-slate-900' : 'bg-slate-850'}`}>
                                                <td className="px-3 py-1 text-xs font-bold text-blue-300 border-r border-slate-700 bg-slate-800 w-20">
                                                    {currency}
                                                </td>
                                                <td className="px-3 py-1">
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        value={table.values[currency] || ''}
                                                        onChange={(e) => handleCurrencyChange(field, table.id, currency, parseFloat(e.target.value) || 0)}
                                                        className="w-16 bg-slate-700 text-white text-center px-2 py-1 rounded text-xs border border-slate-600 focus:border-blue-500 focus:outline-none"
                                                        placeholder="0"
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                <div className="flex gap-2 mt-3">
                                    <button
                                        onClick={() => handleAddCurrency(field, table.id)}
                                        disabled={unusedCurrencies.length === 0}
                                        className="flex-1 px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        + Add
                                    </button>
                                    {usedCurrencies.length > 0 && (
                                        <button
                                            onClick={() => handleRemoveCurrency(field, table.id, usedCurrencies[usedCurrencies.length - 1])}
                                            className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded font-semibold"
                                        >
                                            ✕ Remove
                                        </button>
                                    )}
                                </div>

                                {usedCurrencies.length === 0 && (
                                    <div className="text-center py-2 text-slate-400 text-xs">
                                        No currencies
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
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
