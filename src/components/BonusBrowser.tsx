'use client';

import { useState, useEffect } from 'react';
import React from 'react';
import axios from 'axios';
import { API_ENDPOINTS } from '@/lib/api-config';
import BonusWizard from './BonusWizard';

interface BonusItem {
    id: string;
    name: string;
    provider: string;
    brand: string;
    category: string;
    trigger_type: string;
    percentage: number;
    created_at: string;
}

export default function BonusBrowser() {
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedDay, setSelectedDay] = useState<number | null>(null);
    const [searchId, setSearchId] = useState('');
    const [bonuses, setBonuses] = useState<BonusItem[]>([]);
    const [selectedBonusId, setSelectedBonusId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [showWizard, setShowWizard] = useState(false);

    // Translation Team state
    const [translationAction, setTranslationAction] = useState('view');
    const [translationLang, setTranslationLang] = useState('en');
    const [translationJson, setTranslationJson] = useState('');

    // CRM Ops Team state
    const [opsAction, setOpsAction] = useState('view');
    const [opsFormat, setOpsFormat] = useState('json');
    const [opsJson, setOpsJson] = useState('');

    const months = [
        { num: 1, name: 'January' },
        { num: 2, name: 'February' },
        { num: 3, name: 'March' },
        { num: 4, name: 'April' },
        { num: 5, name: 'May' },
        { num: 6, name: 'June' },
        { num: 7, name: 'July' },
        { num: 8, name: 'August' },
        { num: 9, name: 'September' },
        { num: 10, name: 'October' },
        { num: 11, name: 'November' },
        { num: 12, name: 'December' },
    ];

    const currentMonth = months.find(m => m.num === selectedMonth);

    // Generate days (1-31)
    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    const handleBrowse = async () => {
        setLoading(true);
        setMessage('');
        try {
            const response = await axios.get(`${API_ENDPOINTS.BASE_URL}/api/bonus-templates/dates/${selectedYear}/${selectedMonth}`);

            // Filter by day if a specific day is selected, otherwise show all for the month
            let bonusesForDisplay = response.data;

            if (selectedDay && selectedDay !== 0) {
                // Show bonuses for specific day
                bonusesForDisplay = response.data.filter((bonus: any) => {
                    const bonusDate = new Date(bonus.created_at);
                    return bonusDate.getDate() === selectedDay;
                });

                if (bonusesForDisplay.length === 0) {
                    setMessage(`📭 No bonuses found for ${currentMonth?.name} ${selectedDay}, ${selectedYear}`);
                } else {
                    setMessage(`✅ Found ${bonusesForDisplay.length} bonus(es) on ${currentMonth?.name} ${selectedDay}`);
                }
            } else {
                // Show all bonuses for the month
                if (bonusesForDisplay.length === 0) {
                    setMessage(`📭 No bonuses found in ${currentMonth?.name} ${selectedYear}`);
                } else {
                    setMessage(`✅ Found ${bonusesForDisplay.length} bonus(es) in ${currentMonth?.name} ${selectedYear}`);
                }
            }

            setBonuses(bonusesForDisplay);
        } catch (error: any) {
            setMessage(`❌ Error: ${error.response?.data?.detail || error.message}`);
            setBonuses([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        if (!searchId.trim()) {
            setMessage('❌ Please enter a bonus ID');
            return;
        }

        setLoading(true);
        setMessage('');
        try {
            const response = await axios.get(`${API_ENDPOINTS.BASE_URL}/api/bonus-templates/search`, {
                params: { id: searchId }
            });
            setBonuses([response.data]);
            setSelectedBonusId(response.data.id);
            setMessage(`✅ Found bonus: ${searchId}`);
        } catch (error: any) {
            const errorMsg = error.response?.data?.detail || error.message;
            setMessage(`❌ Bonus not found: ${errorMsg}`);
            setBonuses([]);
            setSelectedBonusId(null);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteBonus = async (bonusId: string) => {
        if (!window.confirm(`⚠️ Are you sure you want to delete bonus "${bonusId}"? This cannot be undone.`)) {
            return;
        }

        setLoading(true);
        try {
            await axios.delete(`${API_ENDPOINTS.BASE_URL}/api/bonus-templates/${bonusId}`);
            setMessage(`✅ Bonus "${bonusId}" deleted successfully`);
            setBonuses(bonuses.filter(b => b.id !== bonusId));
            if (selectedBonusId === bonusId) {
                setSelectedBonusId(null);
            }
        } catch (error: any) {
            const errorMsg = error.response?.data?.detail || error.message;
            setMessage(`❌ Error deleting bonus: ${errorMsg}`);
        } finally {
            setLoading(false);
        }
    };

    const handleTranslationAction = async () => {
        if (!selectedBonusId) {
            setMessage('❌ Please select a bonus first');
            return;
        }

        if (translationAction === 'fetch') {
            try {
                // API call to fetch translation data
                const json = {
                    bonus_id: selectedBonusId,
                    language: translationLang,
                    action: 'fetch_for_translation',
                    timestamp: new Date().toISOString()
                };
                setTranslationJson(JSON.stringify(json, null, 2));
                setMessage(`✅ Fetched translation data for ${selectedBonusId}`);
            } catch (error: any) {
                setMessage(`❌ Error: ${error.message}`);
            }
        } else if (translationAction === 'submit') {
            try {
                const json = {
                    bonus_id: selectedBonusId,
                    language: translationLang,
                    action: 'submit_translation',
                    translated_content: 'TRANSLATION_DATA_HERE',
                    timestamp: new Date().toISOString()
                };
                setTranslationJson(JSON.stringify(json, null, 2));
                setMessage(`✅ Ready to submit translation for ${selectedBonusId}`);
            } catch (error: any) {
                setMessage(`❌ Error: ${error.message}`);
            }
        }
    };

    const handleOpsAction = async () => {
        if (!selectedBonusId) {
            setMessage('❌ Please select a bonus first');
            return;
        }

        if (opsAction === 'fetch') {
            try {
                // API call to fetch bonus data for operations
                const json = {
                    bonus_id: selectedBonusId,
                    action: 'fetch_for_operations',
                    format: opsFormat,
                    timestamp: new Date().toISOString()
                };
                setOpsJson(JSON.stringify(json, null, 2));
                setMessage(`✅ Fetched bonus data for ${selectedBonusId}`);
            } catch (error: any) {
                setMessage(`❌ Error: ${error.message}`);
            }
        } else if (opsAction === 'create') {
            try {
                const json = {
                    bonus_id: selectedBonusId,
                    action: 'create_bonus_json',
                    format: opsFormat,
                    bonus_data: {
                        name: 'BONUS_NAME',
                        provider: 'PROVIDER',
                        percentage: 0,
                        category: 'CATEGORY'
                    },
                    timestamp: new Date().toISOString()
                };
                setOpsJson(JSON.stringify(json, null, 2));
                setMessage(`✅ Created JSON template for ${selectedBonusId}`);
            } catch (error: any) {
                setMessage(`❌ Error: ${error.message}`);
            }
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setMessage('✅ Copied to clipboard!');
    };

    const handleBonusCreated = (bonusData: any) => {
        console.log('New bonus created:', bonusData);
        setMessage(`✅ Bonus created with ID: ${bonusData.id}`);
        setShowWizard(false);
        // You can add API call here to save the bonus to the backend
    };

    // Show wizard if toggled
    if (showWizard) {
        return (
            <BonusWizard
                onBonusCreated={handleBonusCreated}
                onCancel={() => setShowWizard(false)}
            />
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8 flex justify-between items-start">
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-2">📅 Bonus Browser</h1>
                        <p className="text-slate-400">Browse and manage bonuses by date or search by ID</p>
                    </div>
                    <button
                        onClick={() => setShowWizard(true)}
                        className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition"
                    >
                        ✨ Create New Bonus
                    </button>
                </div>

                {/* Two Sections */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Section 1: Browse by Date */}
                    <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-6">
                        <h2 className="text-xl font-bold text-white mb-6">📆 Browse by Date</h2>

                        {/* Year Selector */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-slate-300 mb-2">Year</label>
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                            >
                                {[2023, 2024, 2025, 2026].map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                        </div>

                        {/* Month Selector */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-slate-300 mb-2">Month</label>
                            <select
                                value={selectedMonth}
                                onChange={(e) => {
                                    setSelectedMonth(parseInt(e.target.value));
                                    setSelectedDay(null);
                                }}
                                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                            >
                                {months.map(month => (
                                    <option key={month.num} value={month.num}>{month.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Day Selector */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Day ({currentMonth?.name} {selectedYear})
                            </label>
                            <select
                                value={selectedDay || ''}
                                onChange={(e) => setSelectedDay(e.target.value ? parseInt(e.target.value) : 0)}
                                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                            >
                                <option value="0">📅 All Days in {currentMonth?.name}</option>
                                {days.map(day => (
                                    <option key={day} value={day}>{day}</option>
                                ))}
                            </select>
                        </div>

                        <button
                            onClick={handleBrowse}
                            disabled={loading}
                            className="w-full px-4 py-2.5 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-700 text-white font-semibold rounded-lg transition-all disabled:cursor-not-allowed"
                        >
                            {loading ? '⏳ Loading...' : '🔍 Browse Bonuses'}
                        </button>
                    </div>

                    {/* Section 2: Search by ID */}
                    <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-6">
                        <h2 className="text-xl font-bold text-white mb-6">🔎 Search by ID</h2>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-slate-300 mb-2">Bonus ID</label>
                            <input
                                type="text"
                                value={searchId}
                                onChange={(e) => setSearchId(e.target.value)}
                                placeholder="e.g., Black Friday: Casino Reload 200%..."
                                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            />
                        </div>

                        <button
                            onClick={handleSearch}
                            disabled={loading || !searchId.trim()}
                            className="w-full px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 text-white font-semibold rounded-lg transition-all disabled:cursor-not-allowed"
                        >
                            {loading ? '⏳ Searching...' : '🔍 Search'}
                        </button>
                    </div>
                </div>

                {/* Message */}
                {message && (
                    <div className="mt-6 p-4 rounded-lg border text-sm font-medium transition-all"
                        style={{
                            borderColor: message.includes('❌') ? '#7f1d1d' : '#155e75',
                            backgroundColor: message.includes('❌') ? '#7f1d1d20' : '#155e7520',
                            color: message.includes('❌') ? '#fca5a5' : '#67e8f9'
                        }}
                    >
                        {message}
                    </div>
                )}

                {bonuses.length > 0 && (
                    <div className="mt-8">
                        <h3 className="text-xl font-bold text-white mb-4">📋 Results ({bonuses.length})</h3>

                        <div className="grid grid-cols-1 gap-4">
                            {bonuses.map((bonus) => (
                                <div
                                    key={bonus.id}
                                    onClick={() => setSelectedBonusId(bonus.id)}
                                    className={`cursor-pointer bg-slate-800/60 border rounded-xl p-4 transition-all ${selectedBonusId === bonus.id
                                        ? 'border-cyan-500 bg-slate-800/80'
                                        : 'border-slate-700 hover:border-slate-600'
                                        }`}
                                >
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex-1">
                                            <h4 className="font-bold text-white mb-1">{bonus.name}</h4>
                                            <div className="text-xs text-slate-400 space-y-1">
                                                <div><span className="font-medium">ID:</span> {bonus.id}</div>
                                                <div><span className="font-medium">Provider:</span> {bonus.provider} | <span className="font-medium">Brand:</span> {bonus.brand}</div>
                                                <div><span className="font-medium">Category:</span> {bonus.category} | <span className="font-medium">Type:</span> {bonus.trigger_type}</div>
                                                <div><span className="font-medium">Bonus:</span> {bonus.percentage}% | <span className="font-medium">Created:</span> {new Date(bonus.created_at).toLocaleString()}</div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-all">
                                                👁️ View
                                            </button>
                                            <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-all">
                                                ✏️ Edit
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteBonus(bonus.id);
                                                }}
                                                disabled={loading}
                                                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-slate-700 text-white text-sm rounded-lg transition-all"
                                            >
                                                🗑️ Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {bonuses.length === 0 && !message && (
                    <div className="mt-8 text-center py-12 text-slate-400">
                        <div className="text-4xl mb-2">📭</div>
                        <div>No bonuses selected yet</div>
                    </div>
                )}

                {/* Team Actions - Only show if bonus is selected */}
                {selectedBonusId && (
                    <div className="mt-12 border-t border-slate-700 pt-8">
                        <h2 className="text-2xl font-bold text-white mb-8">🤝 Team Actions</h2>
                        <div className="text-sm text-slate-400 mb-6 p-4 bg-slate-800/40 rounded-lg border border-slate-700">
                            📌 <span className="font-medium text-cyan-400">Selected Bonus ID:</span> <span className="font-mono">{selectedBonusId}</span>
                        </div>

                        {/* Translation Team Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                            <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-6">
                                <h3 className="text-xl font-bold text-white mb-6">🌐 Translation Team</h3>

                                {/* Action Dropdown */}
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Action</label>
                                    <select
                                        value={translationAction}
                                        onChange={(e) => {
                                            setTranslationAction(e.target.value);
                                            setTranslationJson('');
                                        }}
                                        className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                                    >
                                        <option value="view">👁️ View Bonus</option>
                                        <option value="fetch">📥 Fetch for Translation</option>
                                        <option value="submit">📤 Submit Translation</option>
                                    </select>
                                </div>

                                {/* Language Dropdown (for Fetch/Submit) */}
                                {(translationAction === 'fetch' || translationAction === 'submit') && (
                                    <div className="mb-6">
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Language</label>
                                        <select
                                            value={translationLang}
                                            onChange={(e) => setTranslationLang(e.target.value)}
                                            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                                        >
                                            <option value="en">English</option>
                                            <option value="es">Spanish</option>
                                            <option value="fr">French</option>
                                            <option value="de">German</option>
                                            <option value="it">Italian</option>
                                            <option value="pt">Portuguese</option>
                                        </select>
                                    </div>
                                )}

                                <button
                                    onClick={handleTranslationAction}
                                    disabled={loading}
                                    className="w-full px-4 py-2.5 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-700 text-white font-semibold rounded-lg transition-all disabled:cursor-not-allowed"
                                >
                                    {loading ? '⏳ Processing...' : '✨ Execute Action'}
                                </button>

                                {/* JSON Output */}
                                {translationJson && (
                                    <div className="mt-6">
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="text-sm font-medium text-slate-300">JSON Output</label>
                                            <button
                                                onClick={() => copyToClipboard(translationJson)}
                                                className="text-xs px-2 py-1 bg-slate-700 hover:bg-slate-600 text-cyan-400 rounded transition-all"
                                            >
                                                📋 Copy
                                            </button>
                                        </div>
                                        <textarea
                                            readOnly
                                            value={translationJson}
                                            className="w-full h-48 px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-slate-300 text-xs font-mono"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* CRM Ops Team Section */}
                            <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-6">
                                <h3 className="text-xl font-bold text-white mb-6">⚙️ CRM Ops Team</h3>

                                {/* Action Dropdown */}
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Action</label>
                                    <select
                                        value={opsAction}
                                        onChange={(e) => {
                                            setOpsAction(e.target.value);
                                            setOpsJson('');
                                        }}
                                        className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                                    >
                                        <option value="view">👁️ View Bonus</option>
                                        <option value="fetch">📥 Fetch Bonus Data</option>
                                        <option value="create">🆕 Create Bonus JSON</option>
                                    </select>
                                </div>

                                {/* Format Dropdown (for Fetch/Create) */}
                                {(opsAction === 'fetch' || opsAction === 'create') && (
                                    <div className="mb-6">
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Format</label>
                                        <select
                                            value={opsFormat}
                                            onChange={(e) => setOpsFormat(e.target.value)}
                                            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                                        >
                                            <option value="json">JSON</option>
                                            <option value="csv">CSV</option>
                                            <option value="xml">XML</option>
                                        </select>
                                    </div>
                                )}

                                <button
                                    onClick={handleOpsAction}
                                    disabled={loading}
                                    className="w-full px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 text-white font-semibold rounded-lg transition-all disabled:cursor-not-allowed"
                                >
                                    {loading ? '⏳ Processing...' : '✨ Execute Action'}
                                </button>

                                {/* JSON Output */}
                                {opsJson && (
                                    <div className="mt-6">
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="text-sm font-medium text-slate-300">JSON Output</label>
                                            <button
                                                onClick={() => copyToClipboard(opsJson)}
                                                className="text-xs px-2 py-1 bg-slate-700 hover:bg-slate-600 text-emerald-400 rounded transition-all"
                                            >
                                                📋 Copy
                                            </button>
                                        </div>
                                        <textarea
                                            readOnly
                                            value={opsJson}
                                            className="w-full h-48 px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-slate-300 text-xs font-mono"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
