'use client';

import React, { useState } from 'react';
import { BonusType, BONUS_TYPES, generateBonusId } from '@/lib/bonusConfig';

interface BonusWizardProps {
    onBonusCreated?: (bonusData: any) => void;
    onCancel?: () => void;
}

export default function BonusWizard({ onBonusCreated, onCancel }: BonusWizardProps) {
    const [step, setStep] = useState<'type' | 'config'>('type');
    const [selectedType, setSelectedType] = useState<BonusType | null>(null);
    const [bonusData, setBonusData] = useState<Record<string, any>>({});
    const [generatedId, setGeneratedId] = useState<string>('');

    const handleTypeSelect = (type: BonusType) => {
        setSelectedType(type);
        setBonusData({});
        setStep('config');
    };

    const handleBack = () => {
        if (step === 'config') {
            setStep('type');
            setSelectedType(null);
            setBonusData({});
            setGeneratedId('');
        }
    };

    const handleInputChange = (field: string, value: any) => {
        const updated = { ...bonusData, [field]: value };
        setBonusData(updated);

        // Auto-generate ID when relevant fields are filled
        if (selectedType && shouldGenerateId(updated, selectedType)) {
            const newId = generateBonusId(selectedType, updated);
            setGeneratedId(newId);
        }
    };

    const shouldGenerateId = (data: Record<string, any>, type: BonusType): boolean => {
        switch (type) {
            case 'DEPOSIT':
            case 'RELOAD':
                return data.minimumAmount && data.percentage;
            case 'FSDROP':
                return data.spinCount;
            case 'WAGER':
                return data.wagerAmount && data.spinCount;
            case 'SEQ':
                return data.stageNumber && data.minimumAmount && data.percentage;
            case 'COMBO':
                return data.linkedBonusId;
            case 'CASHBACK':
                return data.percentage;
            default:
                return false;
        }
    };

    const handleFinish = () => {
        const finalBonus = {
            id: generatedId,
            type: selectedType,
            ...bonusData,
            created_at: new Date().toISOString(),
        };
        onBonusCreated?.(finalBonus);
    };

    // Step 1: Type Selection
    if (step === 'type') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-8">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-3xl font-bold text-white mb-2">Bonus Wizard</h1>
                    <p className="text-gray-400 mb-8">Step 1: Select Bonus Type</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(BONUS_TYPES).map(([key, config]) => (
                            <button
                                key={key}
                                onClick={() => handleTypeSelect(config.type)}
                                className="p-6 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-blue-500 rounded-lg transition text-left"
                            >
                                <div className="text-lg font-semibold text-white">{config.label}</div>
                                <div className="text-sm text-gray-400 mt-2">{config.description}</div>
                            </button>
                        ))}
                    </div>

                    {onCancel && (
                        <button
                            onClick={onCancel}
                            className="mt-8 px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition"
                        >
                            Cancel
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // Step 2: Configuration
    if (step === 'config' && selectedType) {
        const typeConfig = BONUS_TYPES[selectedType];

        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-8">
                <div className="max-w-2xl mx-auto">
                    <h1 className="text-3xl font-bold text-white mb-2">Bonus Wizard</h1>
                    <p className="text-gray-400 mb-8">
                        Step 2: Configure {typeConfig.label}
                    </p>

                    <div className="bg-gray-800 p-8 rounded-lg border border-gray-700">
                        {/* Generated ID Display */}
                        {generatedId && (
                            <div className="mb-6 p-4 bg-green-900 border border-green-700 rounded">
                                <div className="text-sm text-gray-300 mb-1">Generated ID:</div>
                                <div className="text-lg font-mono text-green-400 break-all">{generatedId}</div>
                            </div>
                        )}

                        {/* Type-Specific Fields */}
                        <div className="space-y-4">
                            {selectedType === 'DEPOSIT' || selectedType === 'RELOAD' ? (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-white mb-2">
                                            Minimum Amount (€)
                                        </label>
                                        <input
                                            type="number"
                                            value={bonusData.minimumAmount || ''}
                                            onChange={(e) => handleInputChange('minimumAmount', e.target.value)}
                                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                                            placeholder="e.g., 25"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-white mb-2">
                                            Percentage (%)
                                        </label>
                                        <input
                                            type="number"
                                            value={bonusData.percentage || ''}
                                            onChange={(e) => handleInputChange('percentage', e.target.value)}
                                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                                            placeholder="e.g., 100"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-white mb-2">
                                            Wagering Multiplier (x)
                                        </label>
                                        <input
                                            type="number"
                                            value={bonusData.wageringMultiplier || ''}
                                            onChange={(e) => handleInputChange('wageringMultiplier', e.target.value)}
                                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                                            placeholder="e.g., 20"
                                        />
                                    </div>
                                </>
                            ) : null}

                            {selectedType === 'FSDROP' ? (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-white mb-2">
                                            Spin Count
                                        </label>
                                        <input
                                            type="number"
                                            value={bonusData.spinCount || ''}
                                            onChange={(e) => handleInputChange('spinCount', e.target.value)}
                                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                                            placeholder="e.g., 50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-white mb-2">
                                            Wagering Multiplier (x)
                                        </label>
                                        <input
                                            type="number"
                                            value={bonusData.wagering || ''}
                                            onChange={(e) => handleInputChange('wagering', e.target.value)}
                                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                                            placeholder="e.g., 5"
                                        />
                                    </div>
                                </>
                            ) : null}

                            {selectedType === 'WAGER' ? (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-white mb-2">
                                            Wager Amount (€)
                                        </label>
                                        <input
                                            type="number"
                                            value={bonusData.wagerAmount || ''}
                                            onChange={(e) => handleInputChange('wagerAmount', e.target.value)}
                                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                                            placeholder="e.g., 200"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-white mb-2">
                                            Spin Count
                                        </label>
                                        <input
                                            type="number"
                                            value={bonusData.spinCount || ''}
                                            onChange={(e) => handleInputChange('spinCount', e.target.value)}
                                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                                            placeholder="e.g., 500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-white mb-2">
                                            Wagering Multiplier (x)
                                        </label>
                                        <input
                                            type="number"
                                            value={bonusData.wagering || ''}
                                            onChange={(e) => handleInputChange('wagering', e.target.value)}
                                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                                            placeholder="e.g., 5"
                                        />
                                    </div>
                                </>
                            ) : null}

                            {selectedType === 'SEQ' ? (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-white mb-2">
                                            Stage Number
                                        </label>
                                        <input
                                            type="number"
                                            value={bonusData.stageNumber || ''}
                                            onChange={(e) => handleInputChange('stageNumber', e.target.value)}
                                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                                            placeholder="e.g., 1"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-white mb-2">
                                            Minimum Amount (€)
                                        </label>
                                        <input
                                            type="number"
                                            value={bonusData.minimumAmount || ''}
                                            onChange={(e) => handleInputChange('minimumAmount', e.target.value)}
                                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                                            placeholder="e.g., 25"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-white mb-2">
                                            Percentage (%)
                                        </label>
                                        <input
                                            type="number"
                                            value={bonusData.percentage || ''}
                                            onChange={(e) => handleInputChange('percentage', e.target.value)}
                                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                                            placeholder="e.g., 100"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-white mb-2">
                                            Wagering Multiplier (x)
                                        </label>
                                        <input
                                            type="number"
                                            value={bonusData.wageringMultiplier || ''}
                                            onChange={(e) => handleInputChange('wageringMultiplier', e.target.value)}
                                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                                            placeholder="e.g., 20"
                                        />
                                    </div>
                                </>
                            ) : null}

                            {selectedType === 'COMBO' ? (
                                <div>
                                    <label className="block text-sm font-medium text-white mb-2">
                                        Linked Bonus ID
                                    </label>
                                    <input
                                        type="text"
                                        value={bonusData.linkedBonusId || ''}
                                        onChange={(e) => handleInputChange('linkedBonusId', e.target.value)}
                                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white font-mono text-sm"
                                        placeholder="e.g., DEPOSIT_25_100_22.12.25"
                                    />
                                </div>
                            ) : null}

                            {selectedType === 'CASHBACK' ? (
                                <div>
                                    <label className="block text-sm font-medium text-white mb-2">
                                        Cashback Percentage (%)
                                    </label>
                                    <input
                                        type="number"
                                        value={bonusData.percentage || ''}
                                        onChange={(e) => handleInputChange('percentage', e.target.value)}
                                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                                        placeholder="e.g., 10"
                                    />
                                </div>
                            ) : null}
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-8 flex gap-4">
                            <button
                                onClick={handleBack}
                                className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition"
                            >
                                Back
                            </button>
                            <button
                                onClick={handleFinish}
                                disabled={!generatedId}
                                className={`px-6 py-2 rounded transition ${generatedId
                                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                    }`}
                            >
                                Create Bonus
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return null;
}
