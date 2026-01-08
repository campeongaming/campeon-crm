/**
 * Bonus JSON Schema Definitions
 * Defines the structure for all 5 bonus template branches
 */

// Supported currencies
export const SUPPORTED_CURRENCIES = [
    'EUR', 'USD', 'GBP', 'NOK', 'SEK', 'DKK', 'CHF', 'AUD',
    'CAD', 'NZD', 'JPY', 'CNY', 'INR', 'BRL', 'ZAR', 'MXN',
    'RUB', 'TRY', 'PLN', 'CZK', 'HUF'
];

// Currency presets
export const CURRENCY_PRESETS = {
    EU: ['EUR', 'GBP', 'NOK', 'SEK', 'DKK', 'CHF'],
    GLOBAL: SUPPORTED_CURRENCIES,
};

// Supported locales
export const SUPPORTED_LOCALES = ['en', 'de', 'fi', 'no', 'it', 'fr', 'es', 'pt'];

// Multi-language text field structure
export interface MultiLangField {
    '*': string; // Default fallback
    [locale: string]: string; // Language-specific variants
}

// Currency map for numeric fields
export interface CurrencyMap {
    '*': number; // Default fallback
    [currency: string]: number;
}

// Schedule for time-boxed promos
export interface Schedule {
    type: 'period';
    from: string; // ISO timestamp
    to: string; // ISO timestamp
    timezone?: string;
}

// ============ TRIGGER VARIANTS ============

export interface TriggerDeposit {
    type: 'deposit';
    duration: string; // e.g., "7d", "30d"
    minimumAmount: CurrencyMap;
    iterations?: number;
    minimumDepositCount?: number;
    segments?: string[]; // Fast Track segment IDs
    allowedCountries?: string[];
    restrictedCountries?: string[];
}

export interface TriggerExternal {
    type: 'external';
    duration: string;
    name: MultiLangField;
    description?: MultiLangField;
    minimumLossAmount?: CurrencyMap;
}

export interface TriggerOpen {
    type: 'open';
    ids: string[]; // References to other bonus IDs
    duration: string;
    minimumAmount?: CurrencyMap;
    name: MultiLangField;
}

export interface TriggerManual {
    type: 'manual';
    duration: string;
    name?: MultiLangField;
}

export type Trigger = TriggerDeposit | TriggerExternal | TriggerOpen | TriggerManual;

// ============ CONFIG VARIANTS ============

export interface ConfigCash {
    type: 'cash';
    category: 'games' | 'live_casino';
    percentage: number;
    wageringMultiplier: number;
    maximumAmount: CurrencyMap;
    minimumStakeToWager: CurrencyMap;
    maximumStakeToWager: CurrencyMap;
    includeAmountOnTargetWagerCalculation: boolean;
    capCalculationAmountToMaximumBonus: boolean;
    compensateOverspending: boolean;
    withdrawActive: boolean;
    provider: string;
    brand: string;
    extra?: {
        proportions?: Record<string, number>; // Game/category weights
    };
}

export interface ConfigFreeBet {
    type: 'free_bet';
    category: 'games' | 'live_casino' | 'sports_book';
    provider: string;
    brand: string;
    cost: CurrencyMap;
    multiplier: CurrencyMap;
    maximumBets: CurrencyMap;
    expiry: string; // e.g., "2d", "7d"
    maximumWithdraw: CurrencyMap | {
        cap: CurrencyMap;
        multiplier: CurrencyMap;
    };
    withdrawActive: boolean;
    extra?: {
        game?: string; // For casino free spins
        planId?: string; // For sportsbook freebet
    };
}

export interface ConfigCashback {
    type: 'cashback';
    percentage: number;
    maximumCashback: CurrencyMap;
    withdrawActive: boolean;
    restrictedCountries?: string[];
    provider: string;
    brand: string;
}

export type Config = ConfigCash | ConfigFreeBet | ConfigCashback;

// ============ TOP-LEVEL BONUS TEMPLATE ============

export interface BonusTemplate {
    id: string;
    trigger: Trigger;
    config: Config;
    type: 'bonus_template';
    schedule?: Schedule;
}

// ============ FORM STATE TYPES ============

export interface DepositBonusFormState {
    id: string;
    minimumAmount: CurrencyMap;
    percentage: number;
    wageringMultiplier: number;
    maximumAmount: CurrencyMap;
    minimumStakeToWager: CurrencyMap;
    maximumStakeToWager: CurrencyMap;
    duration: string;
    iterations?: number;
    segments?: string[];
    includeAmountOnTargetWagerCalculation: boolean;
    capCalculationAmountToMaximumBonus: boolean;
    compensateOverspending: boolean;
    withSchedule: boolean;
    scheduleFrom?: string;
    scheduleTo?: string;
}

export interface ExternalBonusFormState {
    id: string;
    name: MultiLangField;
    duration: string;
    provider: string;
    brand: string;
    category: 'games' | 'live_casino' | 'sports_book';
    cost: CurrencyMap;
    multiplier: CurrencyMap;
    maximumBets: CurrencyMap;
    expiry: string;
    maximumWithdraw: CurrencyMap;
    game?: string;
    withSchedule: boolean;
    scheduleFrom?: string;
    scheduleTo?: string;
}

export interface OpenBonusFormState {
    id: string;
    chainedBonusIds: string[]; // IDs of bonuses this depends on
    name: MultiLangField;
    duration: string;
    provider: string;
    brand: string;
    category: 'games' | 'live_casino' | 'sports_book';
    cost: CurrencyMap;
    multiplier: CurrencyMap;
    maximumBets: CurrencyMap;
    expiry: string;
    maximumWithdraw: CurrencyMap;
    game?: string;
}

export interface CashbackBonusFormState {
    id: string;
    percentage: number;
    maximumCashback: CurrencyMap;
    provider: string;
    brand: string;
}

export type BonusFormState = DepositBonusFormState | ExternalBonusFormState | OpenBonusFormState | CashbackBonusFormState;

// ============ FORM UI STATE ============

export type TriggerType = 'deposit' | 'external' | 'open' | 'manual' | 'cashback';
export type ConfigType = 'cash' | 'free_bet' | 'cashback';
export type ConfigCategory = 'games' | 'live_casino' | 'sports_book';

export interface BonusCreatorUIState {
    triggerType: TriggerType;
    configType: ConfigType;
    configCategory: ConfigCategory;
    currencyPreset: keyof typeof CURRENCY_PRESETS;
}
