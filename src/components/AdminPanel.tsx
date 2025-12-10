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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card bg-gradient-to-r from-red-950/50 to-slate-800 border-red-700/50">
        <h2 className="text-2xl font-bold text-red-300 mb-2">⚙️ Admin Panel - Stable Values</h2>
        <p className="text-slate-400 text-sm">Configure all default values for each provider in one table. These values will auto-fill in the bonus creation form.</p>
      </div>

      {/* Provider Selection */}
      <div className="card">
        <h3 className="text-lg font-semibold text-slate-300 mb-4">Select Provider</h3>
        <div className="flex gap-4">
          {PROVIDERS.map(provider => (
            <button
              key={provider}
              onClick={() => setSelectedProvider(provider)}
              className={`px-6 py-3 rounded-lg font-semibold transition ${
                selectedProvider === provider
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {provider === 'PRAGMATIC' ? '🎰 Pragmatic' : '🎲 Betsoft'}
            </button>
          ))}
        </div>
      </div>

      {/* Comprehensive Excel-like Table */}
      <div className="card overflow-x-auto">
        <h3 className="text-lg font-semibold text-slate-300 mb-4">{selectedProvider} - All Settings</h3>
        <table className="w-full border-collapse bg-slate-900">
          <thead>
            <tr className="bg-slate-800 border-b border-slate-700">
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300 border-r border-slate-700">Setting</th>
              {CURRENCIES.map(currency => (
                <th key={currency} className="px-2 py-3 text-center text-sm font-semibold text-blue-300 border-r border-slate-700 min-w-24">
                  {currency}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              { key: 'cost', label: '💰 Cost Per Game', unit: '' },
              { key: 'minimum_amount', label: '💵 Min Bonus Amount', unit: '' },
              { key: 'maximum_amount', label: '💵 Max Bonus Amount', unit: '' },
              { key: 'minimum_stake_to_wager', label: '🎯 Min Stake', unit: '' },
              { key: 'maximum_stake_to_wager', label: '🎯 Max Stake', unit: '' },
              { key: 'maximum_withdraw', label: '🏦 Max Withdraw', unit: '' },
            ].map((row, rowIdx) => (
              <tr key={row.key} className={`border-b border-slate-700 ${rowIdx % 2 === 0 ? 'bg-slate-850' : 'bg-slate-900'}`}>
                <td className="px-4 py-3 text-sm font-medium text-slate-300 border-r border-slate-700 whitespace-nowrap bg-slate-800">
                  {row.label}
                </td>
                {CURRENCIES.map(currency => (
                  <td key={`${row.key}-${currency}`} className="px-2 py-2 border-r border-slate-700">
                    <input
                      type="number"
                      step="0.01"
                      value={((config as any)[row.key] as Record<string, number>)[currency] || ''}
                      onChange={(e) => handleCurrencyChange(currency, row.key, parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-700 text-white text-center px-2 py-1 rounded text-sm border border-slate-600 focus:border-blue-500 focus:outline-none"
                      placeholder="0"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-xs text-slate-400 mt-3">💡 Edit any cell and click Save. Separate tables for Pragmatic and Betsoft.</p>
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
        {loading ? '💾 Saving...' : `💾 Save ${selectedProvider} Values`}
      </button>
    </div>
  );
}
