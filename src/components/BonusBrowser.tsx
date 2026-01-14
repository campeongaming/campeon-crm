'use client';

import { useState, useEffect } from 'react';
import React from 'react';
import axios from 'axios';
import { API_ENDPOINTS } from '@/lib/api-config';
import ViewEditBonusModal from './ViewEditBonusModal';

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

    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [modalBonusId, setModalBonusId] = useState('');
    const [modalMode, setModalMode] = useState<'view' | 'edit'>('view');

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
            setMessage('❌ Please enter a bonus ID or date');
            return;
        }

        setLoading(true);
        setMessage('');
        try {
            const response = await axios.get(`${API_ENDPOINTS.BASE_URL}/api/bonus-templates/search`, {
                params: { query: searchId }
            });

            if (Array.isArray(response.data)) {
                setBonuses(response.data);
                setSelectedBonusId(response.data.length > 0 ? response.data[0].id : null);
                if (response.data.length === 0) {
                    setMessage(`📭 No bonuses found matching: ${searchId}`);
                } else if (response.data.length === 1) {
                    setMessage(`✅ Found 1 bonus matching: ${searchId}`);
                } else {
                    setMessage(`✅ Found ${response.data.length} bonuses matching: ${searchId}`);
                }
            } else {
                setBonuses([response.data]);
                setSelectedBonusId(response.data.id);
                setMessage(`✅ Found bonus: ${searchId}`);
            }
        } catch (error: any) {
            const errorMsg = error.response?.data?.detail || error.message;
            setMessage(`❌ ${errorMsg}`);
            setBonuses([]);
            setSelectedBonusId(null);
        } finally {
            setLoading(false);
        }
    };

    const handleViewBonus = (bonusId: string) => {
        setModalBonusId(bonusId);
        setModalMode('view');
        setModalOpen(true);
    };

    const handleEditBonus = (bonusId: string) => {
        setModalBonusId(bonusId);
        setModalMode('edit');
        setModalOpen(true);
    };

    const handleModalClose = () => {
        setModalOpen(false);
        setModalBonusId('');
    };

    const handleModalSave = () => {
        // Refresh the bonus list after save
        if (selectedDay || selectedDay === 0) {
            handleBrowse();
        } else if (searchId.trim()) {
            handleSearch();
        }
        // If neither condition is met, don't refresh (avoids error message)
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

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setMessage('✅ Copied to clipboard!');
    };

    return (
        <div className="space-y-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2">📅 Bonus Browser</h1>
                    <p className="text-slate-400">Browse and manage bonuses by date or search by ID</p>
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
                        <h2 className="text-xl font-bold text-white mb-6">🔎 Search by ID or Date</h2>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-slate-300 mb-2">Search Query</label>
                            <input
                                type="text"
                                value={searchId}
                                onChange={(e) => setSearchId(e.target.value)}
                                placeholder="e.g., DEPOSIT_25 or 2025-12-23 or 2025-12"
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
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleViewBonus(bonus.id);
                                                }}
                                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-all"
                                            >
                                                👁️ View
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleEditBonus(bonus.id);
                                                }}
                                                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-all"
                                            >
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
                )
                }
            </div>

            {/* View/Edit Modal */}
            {modalOpen && (
                <ViewEditBonusModal
                    bonusId={modalBonusId}
                    mode={modalMode}
                    onClose={handleModalClose}
                    onSave={handleModalSave}
                />
            )}
        </div>
    );
}
