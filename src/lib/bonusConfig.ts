// Bonus type definitions and ID generation logic

export type BonusType = 'DEPOSIT' | 'RELOAD' | 'FSDROP' | 'WAGER' | 'SEQ' | 'COMBO' | 'CASHBACK';

export interface BonusTypeConfig {
    type: BonusType;
    label: string;
    description: string;
    fields: string[]; // Field names specific to this bonus type
}

export const BONUS_TYPES: Record<BonusType, BonusTypeConfig> = {
    DEPOSIT: {
        type: 'DEPOSIT',
        label: 'Deposit Bonus',
        description: 'Percentage bonus on deposit',
        fields: ['minimumAmount', 'percentage', 'wageringMultiplier'],
    },
    RELOAD: {
        type: 'RELOAD',
        label: 'Reload Bonus',
        description: 'Percentage bonus on reload deposit',
        fields: ['minimumAmount', 'percentage', 'wageringMultiplier'],
    },
    FSDROP: {
        type: 'FSDROP',
        label: 'Free Spins Drop',
        description: 'No-deposit free spins',
        fields: ['spinCount', 'wagering'],
    },
    WAGER: {
        type: 'WAGER',
        label: 'Wager-Triggered FS',
        description: 'Free spins triggered by wagering amount',
        fields: ['wagerAmount', 'spinCount', 'wagering'],
    },
    SEQ: {
        type: 'SEQ',
        label: 'Sequential Bonus',
        description: 'Multi-stage bonus with segments',
        fields: ['stageNumber', 'minimumAmount', 'percentage', 'wageringMultiplier'],
    },
    COMBO: {
        type: 'COMBO',
        label: 'Combo Bonus',
        description: 'Linked bonuses (primary + secondary)',
        fields: ['linkedBonusId'],
    },
    CASHBACK: {
        type: 'CASHBACK',
        label: 'Cashback Bonus',
        description: 'Percentage cashback on losses',
        fields: ['percentage'],
    },
};

/**
 * Generate a standardized bonus ID based on bonus type and specs
 * Format examples:
 * - DEPOSIT_25_100_22.12.25
 * - RELOAD_25_150_22.12.25
 * - FSDROP_50_22.12.25
 * - WAGER_200_500_22.12.25
 * - SEQ_1_25_100_22.12.25
 * - COMBO_DEPOSIT_25_100_22.12.25_22.12.25
 * - CASHBACK_10_22.12.25
 */
export function generateBonusId(
    type: BonusType,
    params: Record<string, any>,
    date?: Date
): string {
    const dateStr = formatDate(date || new Date());

    switch (type) {
        case 'DEPOSIT':
            return `DEPOSIT_${params.minimumAmount}_${params.percentage}_${dateStr}`;

        case 'RELOAD':
            return `RELOAD_${params.minimumAmount}_${params.percentage}_${dateStr}`;

        case 'FSDROP':
            return `FSDROP_${params.spinCount}_${dateStr}`;

        case 'WAGER':
            return `WAGER_${params.wagerAmount}_${params.spinCount}_${dateStr}`;

        case 'SEQ':
            return `SEQ_${params.stageNumber}_${params.minimumAmount}_${params.percentage}_${dateStr}`;

        case 'COMBO':
            return `COMBO_${params.linkedBonusId}_${dateStr}`;

        case 'CASHBACK':
            return `CASHBACK_${params.percentage}_${dateStr}`;

        default:
            throw new Error(`Unknown bonus type: ${type}`);
    }
}

/**
 * Format date as DD.MM.YY
 */
export function formatDate(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return `${day}.${month}.${year}`;
}

/**
 * Parse a standardized bonus ID back into its components
 */
export function parseBonusId(id: string): { type: BonusType; params: Record<string, any>; date: string } {
    const parts = id.split('_');
    const type = parts[0] as BonusType;
    const date = parts[parts.length - 1]; // Last part is always the date

    let params: Record<string, any> = {};

    switch (type) {
        case 'DEPOSIT':
            params = { minimumAmount: parts[1], percentage: parts[2] };
            break;
        case 'RELOAD':
            params = { minimumAmount: parts[1], percentage: parts[2] };
            break;
        case 'FSDROP':
            params = { spinCount: parts[1] };
            break;
        case 'WAGER':
            params = { wagerAmount: parts[1], spinCount: parts[2] };
            break;
        case 'SEQ':
            params = { stageNumber: parts[1], minimumAmount: parts[2], percentage: parts[3] };
            break;
        case 'COMBO':
            // Reconstruct linked bonus ID (everything except first and last part)
            const linkedParts = parts.slice(1, -1);
            params = { linkedBonusId: linkedParts.join('_') };
            break;
        case 'CASHBACK':
            params = { percentage: parts[1] };
            break;
    }

    return { type, params, date };
}
