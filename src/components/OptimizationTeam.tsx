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

interface ValidationError {
    field: string;
    message: string;
}

const REQUIRED_BONUS_FIELDS = [
    'id',
    'bonus_type',
    'name',
    'description',
    'terms_conditions'
];

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
    const [bonusSearchQuery, setBonusSearchQuery] = useState('');
    const [bonusData, setBonusData] = useState<BonusTemplate | null>(null);
    const [bonuses, setBonuses] = useState<BonusTemplate[]>([]);
    const [jsonOutput, setJsonOutput] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
    const [scrollTop, setScrollTop] = useState(0);

    // Fetch bonuses when month/year changes
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

    const generateFromBonusDetails = async () => {
        if (!selectedBonusId) {
            setMessage('❌ Please search for or select a bonus first');
            return;
        }

        setLoading(true);
        setMessage('');
        try {
            // Fetch bonus details from database
            const response = await axios.get(
                `http://localhost:8000/api/bonus-templates/${selectedBonusId}`
            );

            const bonus = response.data;
            console.log('Fetched bonus:', bonus); // Debug

            // Reconstruct complete JSON structure with exact field ordering (matching your config.json)
            const bonusJson: any = {
                id: bonus.id,
            };

            // Add schedule if present
            if (bonus.schedule_from && bonus.schedule_to) {
                bonusJson.schedule = {
                    type: bonus.schedule_type || 'period',
                    from: bonus.schedule_from,
                    to: bonus.schedule_to,
                };
            }

            // Build trigger section with exact field order
            bonusJson.trigger = {};

            // Name (multilingual)
            if (bonus.trigger_name) {
                bonusJson.trigger.name = bonus.trigger_name;
            }

            // Minimum amount (per currency)
            if (bonus.minimum_amount) {
                bonusJson.trigger.minimumAmount = bonus.minimum_amount;
            }

            // Iterations
            if (bonus.trigger_iterations && bonus.trigger_iterations > 0) {
                bonusJson.trigger.iterations = bonus.trigger_iterations;
            }

            // Type, duration (required)
            bonusJson.trigger.type = bonus.bonus_type || 'deposit';
            bonusJson.trigger.duration = bonus.trigger_duration || '7d';

            // Restricted countries (optional array)
            if (bonus.restricted_countries && Array.isArray(bonus.restricted_countries) && bonus.restricted_countries.length > 0) {
                bonusJson.trigger.restrictedCountries = bonus.restricted_countries;
            }

            // Build config section with exact field order
            bonusJson.config = {};

            // Cost (per currency)
            if (bonus.cost) {
                bonusJson.config.cost = bonus.cost;
            }

            // Multiplier (per currency)
            if (bonus.multiplier) {
                bonusJson.config.multiplier = bonus.multiplier;
            }

            // Maximum bets (per currency)
            if (bonus.maximum_bets) {
                bonusJson.config.maximumBets = bonus.maximum_bets;
            }

            // Provider, brand, type
            bonusJson.config.provider = bonus.provider || 'PRAGMATIC';
            bonusJson.config.brand = bonus.brand || 'PRAGMATIC';
            bonusJson.config.type = bonus.config_type || 'free_bet';
            bonusJson.config.withdrawActive = bonus.withdraw_active !== undefined ? bonus.withdraw_active : false;
            bonusJson.config.category = bonus.category || 'games';

            // Maximum withdraw (per currency with cap)
            if (bonus.maximum_withdraw) {
                const maxWithdrawObjects: Record<string, { cap: number }> = {};
                Object.entries(bonus.maximum_withdraw).forEach(([curr, val]: any) => {
                    maxWithdrawObjects[curr] = { cap: typeof val === 'object' ? val.cap : val };
                });
                bonusJson.config.maximumWithdraw = maxWithdrawObjects;
            }

            // Extra (game info)
            bonusJson.config.extra = bonus.config_extra || { game: bonus.game };
            bonusJson.config.expiry = bonus.expiry || '7d';

            // Add type
            bonusJson.type = 'bonus_template';

            // Display in editor
            const jsonString = JSON.stringify(bonusJson, null, 2);
            setJsonOutput(jsonString);

            // Validate
            const errors = validateJSON(jsonString);
            setValidationErrors(errors);

            if (errors.length === 0) {
                setMessage('✅ JSON generated and validated successfully!');
            }
        } catch (error: any) {
            let errorMessage = 'Failed to generate JSON';

            // Handle Pydantic validation error (array of errors)
            if (error.response?.data?.detail && Array.isArray(error.response.data.detail)) {
                errorMessage = error.response.data.detail
                    .map((err: any) => `${err.loc?.join('.')}: ${err.msg}`)
                    .join(' | ');
            } else if (error.response?.data?.detail) {
                errorMessage = String(error.response.data.detail);
            } else if (error.message) {
                errorMessage = error.message;
            }

            setMessage(`❌ ${errorMessage}`);
            setValidationErrors([]);
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

    const validateJSON = (jsonString: string): ValidationError[] => {
        const errors: ValidationError[] = [];

        try {
            JSON.parse(jsonString);
            return errors;
        } catch (error) {
            let errorMsg = error instanceof Error ? error.message : 'Unknown error';

            // Extract line number from error message if available
            const positionMatch = errorMsg.match(/position (\d+)/);
            if (positionMatch) {
                const position = parseInt(positionMatch[1]);
                const lines = jsonString.substring(0, position).split('\n');
                const lineNumber = lines.length;
                const column = lines[lines.length - 1].length + 1;
                errorMsg = `Line ${lineNumber}, Column ${column}: ${errorMsg}`;
            }

            errors.push({
                field: 'JSON',
                message: errorMsg
            });
            return errors;
        }
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

                {/* Search Bonuses */}
                <div className="mb-4">
                    <input
                        type="text"
                        value={bonusSearchQuery}
                        onChange={(e) => setBonusSearchQuery(e.target.value)}
                        placeholder="🔍 Search bonus by ID..."
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:outline-none focus:border-yellow-500"
                    />
                </div>

                {loading ? (
                    <div className="text-center text-slate-300">Loading bonuses...</div>
                ) : bonuses.length === 0 ? (
                    <div className="text-center text-slate-400">No bonuses found for this month</div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-2 max-h-80 overflow-y-auto">
                        {bonuses.filter(bonus => bonus.id.toLowerCase().includes(bonusSearchQuery.toLowerCase())).map(bonus => (
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
                    onClick={generateFromBonusDetails}
                    disabled={loading}
                    className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white font-semibold rounded transition-colors"
                >
                    {loading ? 'Generating JSON...' : '✨ Generate JSON from Bonus Details'}
                </button>
            )}

            {/* JSON Output Section */}
            {jsonOutput && (
                <div className="space-y-3">
                    <div className="bg-slate-700 border border-slate-600 rounded p-4">
                        <h3 className="font-semibold text-slate-300 mb-3">Generated JSON Output (Editable)</h3>
                        <div className="border border-slate-600 rounded bg-slate-900 flex overflow-hidden" style={{ height: 'calc(100vh - 400px)', maxHeight: '90vh' }}>
                            {/* Line Numbers Column */}
                            <div
                                style={{
                                    backgroundColor: '#020617',
                                    lineHeight: '1.6',
                                    width: '50px',
                                    paddingTop: '16px',
                                    paddingRight: '12px',
                                    paddingBottom: '16px',
                                    paddingLeft: '8px',
                                    transform: `translateY(-${scrollTop}px)`,
                                    transition: 'none',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    minHeight: '100%',
                                    borderRight: '1px solid #334155',
                                    userSelect: 'none'
                                }}
                            >
                                {Array.from({ length: jsonOutput.split('\n').length }, (_, i) => (
                                    <span
                                        key={i}
                                        style={{
                                            height: '25.6px',
                                            flexShrink: 0,
                                            textAlign: 'right',
                                            fontFamily: 'monospace',
                                            fontSize: '1rem',
                                            color: '#9ca3af',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'flex-end',
                                            backgroundColor: 'transparent',
                                            background: 'transparent'
                                        } as React.CSSProperties}
                                    >
                                        {i + 1}
                                    </span>
                                ))}
                            </div>
                            {/* JSON Textarea */}
                            <textarea
                                value={jsonOutput}
                                onChange={(e) => {
                                    setJsonOutput(e.target.value);
                                    const errors = validateJSON(e.target.value);
                                    setValidationErrors(errors);
                                }}
                                onScroll={(e) => setScrollTop((e.target as HTMLTextAreaElement).scrollTop)}
                                className="flex-1 bg-slate-900 p-4 text-base text-slate-200 font-mono focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none"
                                style={{
                                    lineHeight: '1.6',
                                    tabSize: 2,
                                    WebkitTextFillColor: '#e2e8f0',
                                    border: 'none',
                                    overflowY: 'scroll',
                                    overflowX: 'auto'
                                }}
                            />
                        </div>
                    </div>

                    {/* Validation Errors */}
                    {validationErrors.length > 0 && (
                        <div className="bg-red-900/30 border border-red-600 rounded p-4">
                            <h4 className="font-semibold text-red-400 mb-3">⚠️ Validation Errors ({validationErrors.length})</h4>
                            <div className="space-y-2">
                                {validationErrors.map((error, idx) => (
                                    <div key={idx} className="text-red-300 text-sm">
                                        <span className="font-semibold">{error.field}:</span> {error.message}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {validationErrors.length === 0 && jsonOutput && (
                        <div className="bg-green-900/30 border border-green-600 rounded p-4">
                            <p className="text-green-400 font-semibold">✅ JSON is valid and ready!</p>
                        </div>
                    )}

                    <div className="flex gap-3">
                        <button
                            onClick={copyToClipboard}
                            disabled={validationErrors.length > 0}
                            className="flex-1 px-4 py-2 bg-slate-600 hover:bg-slate-700 disabled:bg-slate-700 disabled:opacity-50 text-white rounded font-semibold transition-colors"
                        >
                            📋 Copy to Clipboard
                        </button>
                        <button
                            onClick={() => {
                                const blob = new Blob([jsonOutput], { type: 'application/json' });
                                saveAs(blob, `${selectedBonusId}.json`);
                            }}
                            disabled={validationErrors.length > 0}
                            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:opacity-50 text-white rounded font-semibold transition-colors"
                        >
                            ⬇️ Download JSON
                        </button>
                        <button
                            onClick={downloadAsZip}
                            disabled={validationErrors.length > 0}
                            className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:opacity-50 text-white rounded font-semibold transition-colors"
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
