/**
 * Bonus JSON Template Generators
 * Functions to build correct JSON structure for each bonus type
 */

import {
    BonusTemplate,
    ConfigCash,
    ConfigFreeBet,
    ConfigCashback,
    TriggerDeposit,
    TriggerExternal,
    TriggerOpen,
    TriggerManual,
    CurrencyMap,
    MultiLangField,
    Schedule,
    DepositBonusFormState,
    ExternalBonusFormState,
    OpenBonusFormState,
    CashbackBonusFormState,
    SUPPORTED_CURRENCIES,
} from './bonusSchemas';

// ============ UTILITY FUNCTIONS ============

/**
 * Create a currency map from a value, applying to all supported currencies
 */
export function createCurrencyMap(value: number, currencies: string[] = SUPPORTED_CURRENCIES): CurrencyMap {
    const map: CurrencyMap = { '*': value };
    currencies.forEach(currency => {
        map[currency] = value;
    });
    return map;
}

/**
 * Create a multi-language field with a default and optional localized variants
 */
export function createMultiLangField(
    defaultText: string,
    variants?: Record<string, string>
): MultiLangField {
    return {
        '*': defaultText,
        ...variants,
    };
}

/**
 * Build optional schedule if both from and to dates are provided
 */
function buildOptionalSchedule(from?: string, to?: string): Schedule | undefined {
    if (!from || !to) return undefined;
    return {
        type: 'period',
        from,
        to,
    };
}

// ============ BRANCH 1: DEPOSIT-TRIGGERED CASH RELOAD ============

export function generateDepositBonus(form: DepositBonusFormState): BonusTemplate {
    const trigger: TriggerDeposit = {
        type: 'deposit',
        duration: form.duration || '7d',
        minimumAmount: form.minimumAmount,
        iterations: form.iterations,
        segments: form.segments && form.segments.length > 0 ? form.segments : undefined,
    };

    const config: ConfigCash = {
        type: 'cash',
        category: 'games',
        percentage: form.percentage,
        wageringMultiplier: form.wageringMultiplier,
        maximumAmount: form.maximumAmount,
        minimumStakeToWager: form.minimumStakeToWager,
        maximumStakeToWager: form.maximumStakeToWager,
        includeAmountOnTargetWagerCalculation: form.includeAmountOnTargetWagerCalculation,
        capCalculationAmountToMaximumBonus: form.capCalculationAmountToMaximumBonus,
        compensateOverspending: form.compensateOverspending,
        withdrawActive: false,
        provider: 'SYSTEM',
        brand: 'SYSTEM',
    };

    const bonus: BonusTemplate = {
        id: form.id,
        trigger,
        config,
        type: 'bonus_template',
    };

    // Add optional schedule
    if (form.withSchedule && form.scheduleFrom && form.scheduleTo) {
        bonus.schedule = buildOptionalSchedule(form.scheduleFrom, form.scheduleTo);
    }

    return bonus;
}

// ============ BRANCH 2: EXTERNAL-TRIGGERED FREE SPINS / FREE BET ============

export function generateExternalBonus(form: ExternalBonusFormState): BonusTemplate {
    const trigger: TriggerExternal = {
        type: 'external',
        duration: form.duration || '7d',
        name: form.name,
    };

    const config: ConfigFreeBet = {
        type: 'free_bet',
        category: form.category,
        provider: form.provider,
        brand: form.brand,
        cost: form.cost,
        multiplier: form.multiplier,
        maximumBets: form.maximumBets,
        expiry: form.expiry || '7d',
        maximumWithdraw: form.maximumWithdraw,
        withdrawActive: false,
    };

    // Add extra.game if provided and category is games-related
    if (form.game && (form.category === 'games' || form.category === 'live_casino')) {
        config.extra = { game: form.game };
    }

    const bonus: BonusTemplate = {
        id: form.id,
        trigger,
        config,
        type: 'bonus_template',
    };

    // Add optional schedule
    if (form.withSchedule && form.scheduleFrom && form.scheduleTo) {
        bonus.schedule = buildOptionalSchedule(form.scheduleFrom, form.scheduleTo);
    }

    return bonus;
}

// ============ BRANCH 3: OPEN-TRIGGERED CHAINED BONUS ============

export function generateOpenBonus(form: OpenBonusFormState): BonusTemplate {
    const trigger: TriggerOpen = {
        type: 'open',
        ids: form.chainedBonusIds,
        duration: form.duration || '7d',
        name: form.name,
    };

    const config: ConfigFreeBet = {
        type: 'free_bet',
        category: form.category,
        provider: form.provider,
        brand: form.brand,
        cost: form.cost,
        multiplier: form.multiplier,
        maximumBets: form.maximumBets,
        expiry: form.expiry || '7d',
        maximumWithdraw: form.maximumWithdraw,
        withdrawActive: false,
    };

    // Add extra.game if provided
    if (form.game && (form.category === 'games' || form.category === 'live_casino')) {
        config.extra = { game: form.game };
    }

    const bonus: BonusTemplate = {
        id: form.id,
        trigger,
        config,
        type: 'bonus_template',
    };

    return bonus;
}

// ============ BRANCH 4: MANUAL-TRIGGERED ============

export function generateManualBonus(
    id: string,
    name: MultiLangField,
    duration: string,
    configType: 'cash' | 'free_bet',
    configData: ConfigCash | ConfigFreeBet
): BonusTemplate {
    const trigger: TriggerManual = {
        type: 'manual',
        duration: duration || '7d',
        name,
    };

    return {
        id,
        trigger,
        config: configData,
        type: 'bonus_template',
    };
}

// ============ BRANCH 5: CASHBACK ============

export function generateCashbackBonus(form: CashbackBonusFormState): BonusTemplate {
    // Cashback might not include type: 'bonus_template' in some systems
    // But we'll include it for consistency
    const config: ConfigCashback = {
        type: 'cashback',
        percentage: form.percentage,
        maximumCashback: form.maximumCashback,
        withdrawActive: true, // Cashback is typically withdrawable
        provider: form.provider,
        brand: form.brand,
    };

    return {
        id: form.id,
        trigger: {
            type: 'manual',
            duration: '7d',
            name: createMultiLangField('Cashback'),
        },
        config,
        type: 'bonus_template',
    };
}

// ============ MAIN GENERATOR ============

/**
 * Main entry point: generates bonus JSON based on form state
 * Dispatches to appropriate template builder
 */
export function generateBonusJson(
    triggerType: 'deposit' | 'external' | 'open' | 'manual' | 'cashback',
    formState: any
): BonusTemplate {
    switch (triggerType) {
        case 'deposit':
            return generateDepositBonus(formState as DepositBonusFormState);
        case 'external':
            return generateExternalBonus(formState as ExternalBonusFormState);
        case 'open':
            return generateOpenBonus(formState as OpenBonusFormState);
        case 'cashback':
            return generateCashbackBonus(formState as CashbackBonusFormState);
        default:
            throw new Error(`Unknown trigger type: ${triggerType}`);
    }
}

/**
 * Validate that all required fields are populated
 */
export function validateBonusForm(triggerType: string, formState: any): string[] {
    const errors: string[] = [];

    if (!formState.id || formState.id.trim() === '') {
        errors.push('Bonus ID is required');
    }

    switch (triggerType) {
        case 'deposit':
            if (!formState.percentage || formState.percentage <= 0) {
                errors.push('Percentage must be greater than 0');
            }
            if (!formState.wageringMultiplier || formState.wageringMultiplier <= 0) {
                errors.push('Wageringultiplier must be greater than 0');
            }
            if (!formState.duration) {
                errors.push('Duration is required');
            }
            break;

        case 'external':
            if (!formState.name || !formState.name['*']) {
                errors.push('Bonus name is required');
            }
            if (!formState.provider) {
                errors.push('Provider is required');
            }
            if (!formState.category) {
                errors.push('Category is required');
            }
            break;

        case 'open':
            if (!formState.chainedBonusIds || formState.chainedBonusIds.length === 0) {
                errors.push('At least one chained bonus ID is required');
            }
            if (!formState.name || !formState.name['*']) {
                errors.push('Bonus name is required');
            }
            break;

        case 'cashback':
            if (!formState.percentage || formState.percentage <= 0) {
                errors.push('Cashback percentage must be greater than 0');
            }
            if (!formState.provider) {
                errors.push('Provider is required');
            }
            break;
    }

    return errors;
}
