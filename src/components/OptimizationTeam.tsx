'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

interface BonusTemplate {
    id: string;
    category: string;
    provider: string;
    brand: string;
    created_at: string;
}

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

export default function OptimizationTeam() {
    const today = new Date();
    const [selectedYear, setSelectedYear] = useState(today.getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(today.getMonth());

    const [searchId, setSearchId] = useState('');
    const [selectedBonusId, setSelectedBonusId] = useState('');
    const [bonusData, setBonusData] = useState<BonusTemplate | null>(null);
    const [bonuses, setBonuses] = useState<BonusTemplate[]>([]);
    const [jsonOutput, setJsonOutput] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchBonusesForMonth();
    }, [selectedYear, selectedMonth]);

    const fetchBonusesForMonth = async () => {
        try {
            setLoading(true);
            const response = await axios.get(
                `http://localhost:8000/api/bonus-templates/dates/${selectedYear}/${selectedMonth + 1}`
            );
            setBonuses(response.data);
        } catch (error) {
            console.error('Error fetching bonuses:', error);
            setBonuses([]);
        } finally {
            setLoading(false);
        }
    };

    const handlePreviousMonth = () => {
        if (selectedMonth === 0) {
            setSelectedMonth(11);
            setSelectedYear(selectedYear - 1);
        } else {
            setSelectedMonth(selectedMonth - 1);
        }
    };

    const handleNextMonth = () => {
        if (selectedMonth === 11) {
            setSelectedMonth(0);
            setSelectedYear(selectedYear + 1);
        } else {
            setSelectedMonth(selectedMonth + 1);
        }
    };

    const handleSearchBonus = async () => {
        if (!searchId.trim()) {
            setMessage('❌ Please enter a bonus ID');
            return;
        }

        setLoading(true);
        setMessage('');
        try {
            const response = await axios.get(
                `http://localhost:8000/api/bonus-templates/search?id=${searchId}`
            );
            setBonusData(response.data);
            setSelectedBonusId(response.data.id);
            setMessage(`✅ Found bonus: ${searchId}`);
        } catch (error) {
            setMessage(`❌ Bonus not found: ${searchId}`);
            setBonusData(null);
            setSelectedBonusId('');
            setJsonOutput('');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectBonus = async (bonus: BonusTemplate) => {
        setSelectedBonusId(bonus.id);
        setBonusData(bonus);
        setJsonOutput('');
        setMessage('');
    };

    const generateJSON = async () => {
        if (!selectedBonusId) {
            setMessage('❌ Please search for a bonus first');
            return;
        }

        setLoading(true);
        try {
            const response = await axios.get(
                `http://localhost:8000/api/bonus-templates/${selectedBonusId}/json`
            );
            setJsonOutput(JSON.stringify(response.data, null, 2));
            setMessage('✅ JSON generated successfully!');
        } catch (error) {
            console.error('Error generating JSON:', error);
            setMessage('❌ Error generating JSON');
        } finally {
            setLoading(false);
        }
    };

    const downloadAsZip = async () => {
        if (!jsonOutput) {
            setMessage('❌ No JSON to download');
            return;
        }

        try {
            const zip = new JSZip();
            zip.file('config.json', jsonOutput);
            const blob = await zip.generateAsync({ type: 'blob' });
            saveAs(blob, `bonus_${selectedBonusId}.zip`);
            setMessage('✅ ZIP file downloaded successfully!');
        } catch (error) {
            console.error('Error creating ZIP:', error);
            setMessage('❌ Error creating ZIP file');
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(jsonOutput);
        setMessage('✅ Copied to clipboard!');
    };

    return (
        <div className="space-y-6">
            <div className="bg-slate-700/50 border border-slate-600 rounded p-4">
                <h2 className="text-xl font-bold text-purple-400 mb-4">📊 Optimization Team - JSON Generator</h2>
                <p className="text-slate-300 text-sm">Search or browse bonuses by month, preview the JSON, and download as a ZIP file with config.json.</p>
            </div>

            {/* Search by Bonus ID */}
            <div className="bg-slate-700/30 border border-slate-600 rounded p-4">
                <h3 className="text-lg font-semibold text-blue-400 mb-3">🔍 Search by Bonus ID</h3>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={searchId}
                        onChange={(e) => setSearchId(e.target.value)}
                        placeholder="Enter bonus ID..."
                        className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:border-blue-500"
                        onKeyPress={(e) => e.key === 'Enter' && handleSearchBonus()}
                    />
                    <button
                        onClick={handleSearchBonus}
                        disabled={loading}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-semibold rounded transition-colors"
                    >
                        {loading ? 'Searching...' : 'Search'}
                    </button>
                </div>
            </div>

            {/* Month Navigation */}
            <div className="bg-gradient-to-r from-slate-700/40 to-slate-600/40 border border-slate-500 rounded-lg p-6 shadow-lg">
                <h3 className="text-lg font-semibold text-purple-400 mb-6">📅 Browse by Month</h3>
                <div className="flex items-center justify-between gap-8">
                    <button
                        onClick={handlePreviousMonth}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105 transform"
                    >
                        ← Previous Month
                    </button>
                    <div className="flex-shrink-0 text-center">
                        <div className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                            {MONTHS[selectedMonth]}
                        </div>
                        <div className="text-lg font-semibold text-purple-300">
                            {selectedYear}
                        </div>
                    </div>
                    <button
                        onClick={handleNextMonth}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105 transform"
                    >
                        Next Month →
                    </button>
                </div>
            </div>

            {/* Bonuses List for Selected Month */}
            <div className="bg-slate-700/30 border border-slate-600 rounded p-4">
                <h3 className="text-lg font-semibold text-yellow-400 mb-3">
                    📋 Bonuses Created in {MONTHS[selectedMonth]} {selectedYear}
                </h3>

                {loading ? (
                    <div className="text-center text-slate-300">Loading bonuses...</div>
                ) : bonuses.length === 0 ? (
                    <div className="text-center text-slate-400">No bonuses found for this month</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-80 overflow-y-auto">
                        {bonuses.map(bonus => (
                            <button
                                key={bonus.id}
                                onClick={() => handleSelectBonus(bonus)}
                                className={`p-3 rounded border text-left transition-all ${selectedBonusId === bonus.id
                                    ? 'bg-purple-700/40 border-purple-500 text-purple-300'
                                    : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'
                                    }`}
                            >
                                <div className="font-semibold text-sm">{bonus.id}</div>
                                <div className="text-xs text-slate-400">
                                    {bonus.provider} • {bonus.brand} • {bonus.category}
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Bonus Info */}
            {bonusData && (
                <div className="bg-slate-700/20 border border-slate-600 rounded p-3">
                    <p className="text-slate-300">
                        <span className="font-semibold text-cyan-400">ID:</span> {bonusData.id}<br />
                        <span className="font-semibold text-cyan-400">Provider:</span> {bonusData.provider} • {bonusData.brand}<br />
                        <span className="font-semibold text-cyan-400">Category:</span> {bonusData.category}
                    </p>
                </div>
            )}

            {/* Generate JSON Button */}
            {selectedBonusId && (
                <button
                    onClick={generateJSON}
                    disabled={loading}
                    className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 text-white font-semibold rounded transition-colors"
                >
                    {loading ? 'Generating JSON...' : '📄 Generate JSON'}
                </button>
            )}

            {/* JSON Output Section */}
            {jsonOutput && (
                <div className="space-y-3">
                    <div className="bg-slate-700 border border-slate-600 rounded p-4">
                        <h3 className="font-semibold text-slate-300 mb-3">Generated JSON Output</h3>
                        <pre className="bg-slate-800 p-4 rounded text-sm text-slate-300 overflow-auto max-h-96 border border-slate-700">
                            {jsonOutput}
                        </pre>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={copyToClipboard}
                            className="flex-1 px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded font-semibold transition-colors"
                        >
                            📋 Copy to Clipboard
                        </button>
                        <button
                            onClick={downloadAsZip}
                            className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-semibold transition-colors"
                        >
                            📦 Download as ZIP
                        </button>
                    </div>
                </div>
            )}

            {/* Messages */}
            {message && (
                <div className={`p-4 rounded text-center border ${message.includes('✅')
                    ? 'bg-green-700/20 border-green-600 text-green-300'
                    : 'bg-slate-700 border-slate-600 text-slate-300'
                    }`}>
                    {message}
                </div>
            )}
        </div>
    );
}
