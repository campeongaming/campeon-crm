'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import React from 'react';
import { API_ENDPOINTS } from '@/lib/api-config';

const CURRENCIES = ['EUR', 'USD', 'CAD', 'AUD', 'BRL', 'NOK', 'NZD', 'CLP', 'MXN', 'GBP', 'PLN', 'PEN', 'ZAR', 'CHF', 'NGN', 'JPY', 'AZN', 'TRY', 'KZT', 'RUB', 'UZS'];
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
    const [activeTab, setActiveTab] = useState<'cost' | 'amounts' | 'stakes' | 'withdrawals' | 'wager' | 'proportions'>('cost');
    const [loadingData, setLoadingData] = useState(false);

    // Text-based proportions state
    const [pragmaticCasinoProportions, setPragmaticCasinoProportions] = useState('');
    const [pragmaticLiveCasinoProportions, setPragmaticLiveCasinoProportions] = useState('');
    const [betsoftCasinoProportions, setBetsoftCasinoProportions] = useState('');
    const [betsoftLiveCasinoProportions, setBetsoftLiveCasinoProportions] = useState('');

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
    const [showImportModal, setShowImportModal] = useState(false);
    const [importData, setImportData] = useState('');
    const [addingCurrency, setAddingCurrency] = useState<{ field: string; tableId: string } | null>(null);
    const [newCurrencyName, setNewCurrencyName] = useState('');
    const [newCurrencyValue, setNewCurrencyValue] = useState<number>(0);

    const config = selectedProvider === 'PRAGMATIC' ? pragmaticConfig : betsoftConfig;
    const setConfig = selectedProvider === 'PRAGMATIC' ? setPragmaticConfig : setBetsoftConfig;

    // Fetch saved config from backend when provider changes
    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const response = await axios.get(
                    `${API_ENDPOINTS.BASE_URL}/api/stable-config/${selectedProvider}`
                );
                if (response.data) {
                    const newConfig: StableConfigWithVariations = {
                        provider: response.data.provider,
                        cost: response.data.cost || [defaultTable],
                        maximum_amount: response.data.maximum_amount || [defaultTable],
                        minimum_amount: response.data.minimum_amount || [defaultTable],
                        minimum_stake_to_wager: response.data.minimum_stake_to_wager || [defaultTable],
                        maximum_stake_to_wager: response.data.maximum_stake_to_wager || [defaultTable],
                        maximum_withdraw: response.data.maximum_withdraw || [defaultTable],
                    };
                    if (selectedProvider === 'PRAGMATIC') {
                        setPragmaticConfig(newConfig);
                        setPragmaticCasinoProportions(response.data.casino_proportions || '');
                        setPragmaticLiveCasinoProportions(response.data.live_casino_proportions || '');
                    } else {
                        setBetsoftConfig(newConfig);
                        setBetsoftCasinoProportions(response.data.casino_proportions || '');
                        setBetsoftLiveCasinoProportions(response.data.live_casino_proportions || '');
                    }
                }
            } catch (error: any) {
                // No saved config yet, keep defaults
                console.log(`No saved config for ${selectedProvider}`, error.response?.status);
            }
        };

        fetchConfig();
    }, [selectedProvider]);

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
            values: Object.fromEntries(CURRENCIES.map(c => [c, 0.25]))
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
            const payload = {
                ...config,
                casino_proportions: selectedProvider === 'PRAGMATIC' ? pragmaticCasinoProportions : betsoftCasinoProportions,
                live_casino_proportions: selectedProvider === 'PRAGMATIC' ? pragmaticLiveCasinoProportions : betsoftLiveCasinoProportions,
            };
            await axios.post(`${API_ENDPOINTS.BASE_URL}/api/stable-config`, payload);

            // Show tab-specific message
            let successMessage = '';
            if (activeTab === 'cost') {
                successMessage = `✅ ${selectedProvider} cost tables saved successfully!`;
            } else if (activeTab === 'amounts') {
                successMessage = '✅ Minimum & maximum bonus amounts saved successfully!';
            } else if (activeTab === 'stakes') {
                successMessage = '✅ Minimum & maximum stake values saved successfully!';
            } else if (activeTab === 'withdrawals') {
                successMessage = '✅ Maximum withdrawal amounts saved successfully!';
            } else if (activeTab === 'wager') {
                successMessage = '✅ Wager values saved successfully!';
            } else if (activeTab === 'proportions') {
                successMessage = '✅ Proportions saved successfully!';
            }

            setMessage(successMessage);
            setTimeout(() => setMessage(''), 4000);
        } catch (error: any) {
            setMessage(`❌ Error: ${error.response?.data?.detail || error.message}`);
        } finally {
            setLoading(false);
        }
    };


    const handleBulkImport = () => {
        try {
            const lines = importData.trim().split('\n');
            if (lines.length < 2) {
                setMessage('❌ Invalid format: need at least headers and 1 data row');
                return;
            }

            const currencyHeaders = lines[0].split('\t').map(c => c.trim()).filter(c => c);
            const newTables: CurrencyTable[] = [];

            for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split('\t').map(v => v.trim()).filter(v => v);
                if (values.length === 0) continue;

                const tableData: Record<string, number> = {};
                currencyHeaders.forEach((currency, idx) => {
                    tableData[currency] = parseFloat(values[idx]) || 0;
                });

                newTables.push({
                    id: String(i),
                    name: `Table ${i}`,
                    values: tableData
                });
            }

            if (newTables.length === 0) {
                setMessage('❌ No valid data rows found');
                return;
            }

            setConfig(prev => ({
                ...prev,
                cost: newTables,
            }));

            setMessage(`✅ Imported ${newTables.length} pricing tables!`);
            setShowImportModal(false);
            setImportData('');
        } catch (error: any) {
            setMessage(`❌ Import error: ${error.message}`);
        }
    };

    const renderSettingTable = (field: string, title: string, description: string) => {
        let tables = (config[field as keyof StableConfigWithVariations] as CurrencyTable[]);
        tables = [...tables].sort((a, b) => (a.values['EUR'] || 0) - (b.values['EUR'] || 0));

        return (
            <div>
                <div className="mb-6">
                    <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
                    <p className="text-sm text-slate-400">{description}</p>
                </div>

                {/* Add Table Button - Top */}
                <button
                    onClick={() => handleAddTable(field)}
                    className="w-full px-4 py-2.5 text-sm font-medium bg-slate-700 hover:bg-slate-600 text-white rounded-lg border border-slate-600 hover:border-slate-500 transition-colors mb-6"
                >
                    + Add Pricing Table
                </button>

                {/* Tables displayed side-by-side - horizontal scroll */}
                <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'nowrap', gap: '1.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                    {tables.map((table) => {
                        const usedCurrencies = Object.keys(table.values).sort();
                        const eurValue = table.values['EUR'] || 0;

                        return (
                            <div
                                key={table.id}
                                style={{ flexShrink: 0 }}
                                className="bg-slate-800/60 border border-slate-700 rounded-xl p-5 hover:border-slate-600 transition-all duration-200"
                            >
                                {/* Card Header */}
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-white text-sm mb-1">{table.name}</h4>
                                        <div className="text-2xl font-bold text-cyan-400">€{eurValue.toFixed(2)}</div>
                                    </div>
                                    {tables.length > 1 && (
                                        <button
                                            onClick={() => handleRemoveTable(field, table.id)}
                                            className="p-1 hover:bg-red-600/20 rounded text-red-400 hover:text-red-300 transition-colors"
                                            title="Delete table"
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>

                                {/* Currency List */}
                                <div className="space-y-2 mb-4">
                                    {usedCurrencies.map((currency) => (
                                        <div key={currency} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ width: '52px', textAlign: 'left' }} className="text-slate-400 text-xs font-medium uppercase">{currency}</span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={table.values[currency] || ''}
                                                onChange={(e) => handleCurrencyChange(field, table.id, currency, parseFloat(e.target.value) || 0)}
                                                style={{ width: '70px' }}
                                                className="bg-slate-700 text-white text-xs px-2.5 py-1.5 rounded border border-slate-600 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all text-right"
                                                placeholder="0"
                                            />
                                            <button
                                                onClick={() => handleRemoveCurrency(field, table.id, currency)}
                                                style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                className="hover:bg-red-600/20 rounded text-slate-500 hover:text-red-400 transition-colors text-sm flex-shrink-0"
                                                title="Remove currency"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                {usedCurrencies.length === 0 && (
                                    <div className="text-center py-4 text-slate-500 text-xs">
                                        No currencies configured
                                    </div>
                                )}

                                {/* Add Currency Form */}
                                {addingCurrency?.field === field && addingCurrency?.tableId === table.id ? (
                                    <div className="p-3 bg-slate-700/50 border border-slate-600 rounded-lg mt-3 space-y-2">
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                placeholder="Currency (e.g., USD)"
                                                value={newCurrencyName}
                                                onChange={(e) => setNewCurrencyName(e.target.value.toUpperCase())}
                                                maxLength={3}
                                                className="flex-1 px-2 py-1.5 text-xs bg-slate-700 text-white rounded border border-slate-600 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
                                            />
                                            <input
                                                type="number"
                                                step="0.01"
                                                placeholder="Value"
                                                value={newCurrencyValue}
                                                onChange={(e) => setNewCurrencyValue(parseFloat(e.target.value) || 0)}
                                                className="w-20 px-2 py-1.5 text-xs bg-slate-700 text-white rounded border border-slate-600 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 text-right"
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => {
                                                    if (newCurrencyName.trim()) {
                                                        setConfig(prev => ({
                                                            ...prev,
                                                            [field]: (prev[field as keyof StableConfigWithVariations] as CurrencyTable[]).map(t =>
                                                                t.id === table.id
                                                                    ? { ...t, values: { ...t.values, [newCurrencyName]: newCurrencyValue } }
                                                                    : t
                                                            )
                                                        }));
                                                        setAddingCurrency(null);
                                                        setNewCurrencyName('');
                                                        setNewCurrencyValue(0);
                                                    }
                                                }}
                                                className="flex-1 px-2 py-1.5 text-xs font-medium bg-cyan-600 hover:bg-cyan-700 text-white rounded transition-colors"
                                            >
                                                ✓ Add
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setAddingCurrency(null);
                                                    setNewCurrencyName('');
                                                    setNewCurrencyValue(0);
                                                }}
                                                className="flex-1 px-2 py-1.5 text-xs font-medium bg-slate-600 hover:bg-slate-500 text-white rounded transition-colors"
                                            >
                                                ✕ Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setAddingCurrency({ field, tableId: table.id })}
                                        className="w-full px-3 py-2 text-xs font-medium bg-slate-700 hover:bg-slate-600 text-white rounded-lg border border-slate-600 hover:border-slate-500 transition-colors mt-3"
                                    >
                                        + Add Currency
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-slate-950">
            {/* Main Container - Centered with max-width */}
            <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">

                {/* Header Section */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2">Configuration Center</h1>
                    <p className="text-slate-400">Manage pricing tables and currency configurations</p>
                </div>

                {/* Configuration Tabs - Card Grid */}
                <div className="mb-8">
                    <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Select Configuration</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                        {[
                            { id: 'cost', label: 'Cost', icon: '💰' },
                            { id: 'amounts', label: 'Amounts', icon: '💵' },
                            { id: 'stakes', label: 'Stakes', icon: '🎯' },
                            { id: 'withdrawals', label: 'Withdrawals', icon: '🏦' },
                            { id: 'wager', label: 'Wager', icon: '🎰' },
                            { id: 'proportions', label: 'Proportions', icon: '📊' },
                        ].map(({ id, label, icon }) => (
                            <button
                                key={id}
                                onClick={() => setActiveTab(id as any)}
                                className={`p-3 rounded-lg border-2 transition-all duration-300 text-center ${activeTab === id
                                    ? 'border-cyan-500 bg-cyan-950/30 text-cyan-300 shadow-lg shadow-cyan-500/20'
                                    : 'border-slate-700 bg-slate-800/40 text-slate-400 hover:border-slate-600'
                                    }`}
                            >
                                <div className="text-xl mb-1">{icon}</div>
                                <div className="text-xs font-semibold">{label}</div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content Panel */}
                <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-6 mb-8">
                    {loadingData ? (
                        <div className="text-center py-12 text-slate-400">
                            <div className="text-3xl mb-2">⏳</div>
                            <div>Loading configuration...</div>
                        </div>
                    ) : (
                        <>
                            {activeTab === 'cost' && (
                                <div className="space-y-8">
                                    {/* Provider Selection for Cost Tab */}
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-3">Select Provider</h3>
                                        <div className="grid grid-cols-2 gap-3 mb-8">
                                            {['PRAGMATIC', 'BETSOFT'].map((provider) => (
                                                <button
                                                    key={provider}
                                                    onClick={() => setSelectedProvider(provider)}
                                                    className={`p-3 rounded-lg border-2 transition-all duration-300 text-center ${selectedProvider === provider
                                                        ? provider === 'PRAGMATIC'
                                                            ? 'border-blue-500 bg-blue-950/30 text-blue-300'
                                                            : 'border-purple-500 bg-purple-950/30 text-purple-300'
                                                        : 'border-slate-700 bg-slate-800/40 text-slate-400 hover:border-slate-600 hover:bg-slate-800/60'
                                                        }`}
                                                >
                                                    <div className="text-xl mb-1">{provider === 'PRAGMATIC' ? '🎰' : '🎲'}</div>
                                                    <div className="text-xs font-semibold">{provider}</div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Cost Tables */}
                                    {renderSettingTable('cost', 'Cost Per Spin', 'Set how much you pay (in EUR) for each player receiving this bonus')}
                                </div>
                            )}
                            {activeTab === 'amounts' && (
                                <div className="space-y-8">
                                    {renderSettingTable('minimum_amount', 'Minimum Bonus Amount', 'Smallest bonus value per currency')}
                                    {renderSettingTable('maximum_amount', 'Maximum Bonus Amount', 'Largest bonus value per currency')}
                                </div>
                            )}
                            {activeTab === 'stakes' && (
                                <div className="space-y-8">
                                    {renderSettingTable('minimum_stake_to_wager', 'Minimum Stake', 'Smallest bet amount players must place')}
                                    {renderSettingTable('maximum_stake_to_wager', 'Maximum Stake', 'Largest bet amount allowed per round')}
                                </div>
                            )}
                            {activeTab === 'withdrawals' && renderSettingTable('maximum_withdraw', 'Maximum Withdrawal', 'Maximum amount players can withdraw from bonus winnings')}
                            {activeTab === 'wager' && (
                                <div className="space-y-8">
                                    {renderSettingTable('minimum_stake_to_wager', 'Minimum Stake to Wager', 'Smallest bet amount for wagering requirement')}
                                    {renderSettingTable('maximum_stake_to_wager', 'Maximum Stake to Wager', 'Largest bet amount for wagering requirement')}
                                </div>
                            )}
                            {activeTab === 'proportions' && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="p-4 bg-slate-800/40 border border-slate-700 rounded-lg">
                                            <h4 className="text-sm font-semibold text-slate-300 mb-3">🎰 Casino Proportions</h4>
                                            <p className="text-xs text-slate-400 mb-3">Enter bet distribution for casino games</p>
                                            <textarea
                                                value={selectedProvider === 'PRAGMATIC' ? pragmaticCasinoProportions : betsoftCasinoProportions}
                                                onChange={(e) => {
                                                    if (selectedProvider === 'PRAGMATIC') {
                                                        setPragmaticCasinoProportions(e.target.value);
                                                    } else {
                                                        setBetsoftCasinoProportions(e.target.value);
                                                    }
                                                }}
                                                placeholder='e.g., {"SLOT_GAMES": 100, "VIRTUAL_GAMES": 50, ...}'
                                                className="w-full px-3 py-2 border border-slate-600 rounded-lg bg-slate-700/50 text-slate-200 text-sm font-mono"
                                                rows={28}
                                            />
                                        </div>

                                        <div className="p-4 bg-slate-800/40 border border-slate-700 rounded-lg">
                                            <h4 className="text-sm font-semibold text-slate-300 mb-3">🎭 Live Casino Proportions</h4>
                                            <p className="text-xs text-slate-400 mb-3">Enter bet distribution for live casino games</p>
                                            <textarea
                                                value={selectedProvider === 'PRAGMATIC' ? pragmaticLiveCasinoProportions : betsoftLiveCasinoProportions}
                                                onChange={(e) => {
                                                    if (selectedProvider === 'PRAGMATIC') {
                                                        setPragmaticLiveCasinoProportions(e.target.value);
                                                    } else {
                                                        setBetsoftLiveCasinoProportions(e.target.value);
                                                    }
                                                }}
                                                placeholder='e.g., {"CASINO_GAMES": 20, "LUCKY_GAMES": 50, ...}'
                                                className="w-full px-3 py-2 border border-slate-600 rounded-lg bg-slate-700/50 text-slate-200 text-sm font-mono"
                                                rows={28}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Status Message */}
                {message && (
                    <div
                        className={`mb-6 p-4 rounded-lg border text-sm font-medium transition-all ${message.startsWith('✅')
                            ? 'border-green-700 bg-green-950/40 text-green-300'
                            : 'border-red-700 bg-red-950/40 text-red-300'
                            }`}
                    >
                        {message}
                    </div>
                )}

                {/* Action Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                    <button
                        onClick={() => setShowImportModal(true)}
                        className="py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-all duration-200"
                    >
                        📥 Import Custom Data
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 text-white font-semibold rounded-lg transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {loading ? '⏳ Saving...' : '✓ Save Configuration'}
                    </button>
                </div>

                {/* Import Modal */}
                {showImportModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-slate-800 border border-slate-700 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-auto p-6">
                            <h3 className="text-xl font-bold text-white mb-4">📥 Import Pricing Data</h3>

                            <div className="mb-4">
                                <p className="text-sm text-slate-400 mb-3">Paste tab-separated data with currencies as headers:</p>
                                <div className="bg-slate-900/50 border border-slate-700 rounded p-3 text-xs font-mono text-slate-300 mb-3 max-h-32 overflow-auto">
                                    <div>EUR&nbsp;&nbsp;&nbsp;&nbsp;USD&nbsp;&nbsp;&nbsp;&nbsp;GBP&nbsp;&nbsp;&nbsp;&nbsp;...</div>
                                    <div>0.10&nbsp;&nbsp;&nbsp;&nbsp;0.10&nbsp;&nbsp;&nbsp;&nbsp;0.10&nbsp;&nbsp;&nbsp;&nbsp;...</div>
                                    <div>0.20&nbsp;&nbsp;&nbsp;&nbsp;0.20&nbsp;&nbsp;&nbsp;&nbsp;0.20&nbsp;&nbsp;&nbsp;&nbsp;...</div>
                                </div>
                            </div>

                            <textarea
                                value={importData}
                                onChange={(e) => setImportData(e.target.value)}
                                placeholder="Paste tab-separated data here..."
                                className="w-full h-48 px-4 py-3 bg-slate-700 border border-slate-600 rounded text-white text-sm font-mono focus:border-cyan-500 focus:outline-none mb-4"
                            />

                            <div className="flex gap-2">
                                <button
                                    onClick={handleBulkImport}
                                    className="flex-1 py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-all"
                                >
                                    ✓ Import
                                </button>
                                <button
                                    onClick={() => {
                                        setShowImportModal(false);
                                        setImportData('');
                                    }}
                                    className="flex-1 py-2 px-4 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-all"
                                >
                                    ✕ Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
