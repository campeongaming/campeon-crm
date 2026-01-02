═══════════════════════════════════════════════════════════════════════════════
                 HOW TO ADD THE NEXT BONUS TYPE - STEP BY STEP GUIDE
═══════════════════════════════════════════════════════════════════════════════

RECOMMENDED: Add FSDROP (Free Spins Drop) Next
═════════════════════════════════════════════

Why FSDROP?
  • Simplest to implement (similar to WAGER but simpler)
  • Only ~4-5 new form fields needed
  • No complex relationships
  • From JSON: "Drop 50 Free Spins.json"

═══════════════════════════════════════════════════════════════════════════════
                         STEP 1: ANALYZE THE JSON
═══════════════════════════════════════════════════════════════════════════════

JSON File: "Drop 50 Free Spins.json"

Key fields to extract:

✓ trigger.type: "external"  ← trigger_type value
✓ trigger.duration: "1d"    ← duration value
✓ trigger.name: { "*": "50 No Deposit FS..." }  ← trigger_name
✓ config.cost: { EUR: 0.2, USD: 0.2, ... }  ← cost per currency
✓ config.multiplier: { EUR: 0.2, USD: 0.2, ... }  ← wagering multiplier
✓ config.maximumBets: { EUR: 50, USD: 50, ... }  ← max bets per currency

Unique FSDROP characteristics:
  • NO minimum deposit (it's "No Deposit" free spins)
  • NO wager amount (user doesn't wager to get it)
  • Only: Free Spins Count, Game Title, Cost, Wagering Multiplier, Max Bets

═══════════════════════════════════════════════════════════════════════════════
                    STEP 2: ADD STATE FIELDS TO FORM DATA
═══════════════════════════════════════════════════════════════════════════════

In BonusCreationForm.tsx, find the BonusFormData interface:

CURRENT (lines 7-37):
```typescript
interface BonusFormData {
    // ... existing fields ...
    
    // WAGER fields
    wager_amount?: Record<string, number>;
    free_spins_count?: number;
    cost_per_wager?: Record<string, number>;
    maximum_bets?: Record<string, number>;
    wager_game_title?: string;
}
```

ADD THESE NEW FIELDS FOR FSDROP:
```typescript
    // FSDROP fields
    fsdrop_free_spins_count?: number;
    fsdrop_cost?: Record<string, number>;
    fsdrop_multiplier?: Record<string, number>;
    fsdrop_maximum_bets?: Record<string, number>;
    fsdrop_game_title?: string;
```

═══════════════════════════════════════════════════════════════════════════════
                   STEP 3: INITIALIZE STATE WITH DEFAULTS
═══════════════════════════════════════════════════════════════════════════════

In useState initialization (around line 62):

CURRENT:
```typescript
const [formData, setFormData] = useState<BonusFormData>({
    // ... existing defaults ...
    wager_amount: Object.fromEntries(CURRENCIES.map(c => [c, 200])),
    free_spins_count: 500,
    cost_per_wager: Object.fromEntries(CURRENCIES.map(c => [c, 0.2])),
    // ...
});
```

ADD THESE NEW DEFAULTS:
```typescript
        fsdrop_free_spins_count: 50,
        fsdrop_cost: Object.fromEntries(CURRENCIES.map(c => [c, 0.2])),
        fsdrop_multiplier: Object.fromEntries(CURRENCIES.map(c => [c, 0.2])),
        fsdrop_maximum_bets: Object.fromEntries(CURRENCIES.map(c => [c, 50])),
        fsdrop_game_title: 'Olympus Wins',
```

═══════════════════════════════════════════════════════════════════════════════
                    STEP 4: ADD CONDITIONAL RENDER SECTION
═══════════════════════════════════════════════════════════════════════════════

In BonusCreationForm.tsx, find where the WAGER section ends (around line 340).

After the closing </div> of the WAGER section, ADD THIS NEW SECTION:

```typescript
                {/* FSDROP Specific Fields */}
                {formData.bonusType === 'FSDROP' && (
                    <div className="bg-yellow-900/20 p-6 rounded-xl border border-yellow-700/50">
                        <h3 className="text-sm font-semibold text-yellow-300 mb-4">
                            Free Spins Drop Configuration
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <div>
                                <label className="block text-sm font-semibold text-slate-200 mb-2">
                                    Free Spins Count
                                </label>
                                <input
                                    type="number"
                                    value={formData.fsdrop_free_spins_count || 50}
                                    onChange={(e) => setFormData(prev => ({ ...prev, fsdrop_free_spins_count: parseInt(e.target.value) }))}
                                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-200 mb-2">
                                    Game Title
                                </label>
                                <input
                                    type="text"
                                    value={formData.fsdrop_game_title || ''}
                                    onChange={(e) => setFormData(prev => ({ ...prev, fsdrop_game_title: e.target.value }))}
                                    placeholder="e.g., Olympus Wins"
                                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                />
                            </div>
                        </div>

                        {/* Cost by Currency */}
                        <div className="mb-6">
                            <h4 className="text-sm font-semibold text-yellow-300 mb-3">Cost per Currency</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-h-64 overflow-y-auto p-3 bg-slate-800/50 rounded-lg">
                                {CURRENCIES.map(currency => (
                                    <div key={`fsdrop-cost-${currency}`}>
                                        <label className="text-xs text-slate-400 mb-1 block">{currency}</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={formData.fsdrop_cost?.[currency] || 0.2}
                                            onChange={(e) => handleCurrencyChange('fsdrop_cost', currency, parseFloat(e.target.value))}
                                            className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Multiplier by Currency */}
                        <div className="mb-6">
                            <h4 className="text-sm font-semibold text-yellow-300 mb-3">Wagering Multiplier per Currency</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-h-64 overflow-y-auto p-3 bg-slate-800/50 rounded-lg">
                                {CURRENCIES.map(currency => (
                                    <div key={`fsdrop-mult-${currency}`}>
                                        <label className="text-xs text-slate-400 mb-1 block">{currency}</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={formData.fsdrop_multiplier?.[currency] || 0.2}
                                            onChange={(e) => handleCurrencyChange('fsdrop_multiplier', currency, parseFloat(e.target.value))}
                                            className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Maximum Bets by Currency */}
                        <div>
                            <h4 className="text-sm font-semibold text-yellow-300 mb-3">Maximum Bets per Currency</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-h-64 overflow-y-auto p-3 bg-slate-800/50 rounded-lg">
                                {CURRENCIES.map(currency => (
                                    <div key={`fsdrop-maxbet-${currency}`}>
                                        <label className="text-xs text-slate-400 mb-1 block">{currency}</label>
                                        <input
                                            type="number"
                                            value={formData.fsdrop_maximum_bets?.[currency] || 50}
                                            onChange={(e) => handleCurrencyChange('fsdrop_maximum_bets', currency, parseFloat(e.target.value))}
                                            className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
```

═══════════════════════════════════════════════════════════════════════════════
                  STEP 5: ADD LOGIC TO HANDLE FSDROP IN SUBMISSION
═══════════════════════════════════════════════════════════════════════════════

In handleSubmit function (around line 200), find where type-specific fields are added:

CURRENT CODE:
```typescript
            // Type-specific fields
            if (['DEPOSIT', 'RELOAD'].includes(formData.bonusType)) {
                payload.percentage = formData.percentage;
                payload.wagering_multiplier = formData.wagering_multiplier;
                // ...
            } else if (formData.bonusType === 'WAGER') {
                payload.wager_amount = formData.wager_amount;
                payload.free_spins_count = formData.free_spins_count;
                // ...
            }
```

ADD THIS NEW CONDITION:
```typescript
            } else if (formData.bonusType === 'FSDROP') {
                payload.free_spins_count = formData.fsdrop_free_spins_count;
                payload.cost = formData.fsdrop_cost;
                payload.multiplier = formData.fsdrop_multiplier;
                payload.maximum_bets = formData.fsdrop_maximum_bets;
                payload.game_title = { '*': formData.fsdrop_game_title };
            }
```

═══════════════════════════════════════════════════════════════════════════════
                    STEP 6: ADD FSDROP TO FORM RESET LOGIC
═══════════════════════════════════════════════════════════════════════════════

In handleSubmit, after successful creation (around line 215), update the reset:

FIND:
```typescript
            // Reset form
            setFormData({
                id: '',
                bonusType: 'DEPOSIT',
                // ... existing resets ...
                wager_game_title: 'Sweet Rush Bonanza',
            });
```

ADD TO THE RESET OBJECT:
```typescript
                fsdrop_free_spins_count: 50,
                fsdrop_cost: Object.fromEntries(CURRENCIES.map(c => [c, 0.2])),
                fsdrop_multiplier: Object.fromEntries(CURRENCIES.map(c => [c, 0.2])),
                fsdrop_maximum_bets: Object.fromEntries(CURRENCIES.map(c => [c, 50])),
                fsdrop_game_title: 'Olympus Wins',
```

═══════════════════════════════════════════════════════════════════════════════
                         STEP 7: UPDATE DYNAMIC LABEL
═══════════════════════════════════════════════════════════════════════════════

Find the part where conditional renders are defined (around line 135):

CURRENT CODE:
```typescript
                const isDepositOrReload = ['DEPOSIT', 'RELOAD'].includes(formData.bonusType);
                const isWager = formData.bonusType === 'WAGER';
```

ADD NEW LINE:
```typescript
                const isFSDrop = formData.bonusType === 'FSDROP';
```

This makes it easier to use in multiple conditional renders if needed.

═══════════════════════════════════════════════════════════════════════════════
                              STEP 8: TEST
═══════════════════════════════════════════════════════════════════════════════

1. Open Create Bonus tab
2. Select "✨ Free Spins Drop" from dropdown
3. Verify these fields appear:
   ✓ Free Spins Count
   ✓ Game Title
   ✓ Cost per Currency (21 currencies)
   ✓ Wagering Multiplier per Currency (21 currencies)
   ✓ Maximum Bets per Currency (21 currencies)

4. Fill in sample values:
   - Free Spins: 50
   - Game: "Olympus Wins"
   - Leave costs/multipliers at defaults (0.2)
   - Max bets: 50

5. Click "Create FSDROP Bonus"
6. Verify success message appears
7. Check database if data was saved correctly

═══════════════════════════════════════════════════════════════════════════════
                    COMPLETE EXAMPLE - ALL CHANGES TOGETHER
═══════════════════════════════════════════════════════════════════════════════

This is what your form will look like after adding FSDROP:

┌─────────────────────────────────────────────────────────┐
│ Bonus Type: [✨ Free Spins Drop ▼]                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Basic Info:                                             │
│ ├─ Bonus ID: [FSDROP_50_2025-12-22_____________]       │
│ ├─ Provider: [PRAGMATIC▼]                              │
│ ├─ Trigger Name: [50 No Deposit FS________________]    │
│ └─ Category: [GAMES▼]                                  │
│                                                         │
│ Schedule (Optional):                                    │
│ ├─ Start: [2025-12-22 10:00]                           │
│ └─ End: [2025-12-23 23:59]                             │
│                                                         │
│ Free Spins Drop Configuration:                          │
│ ├─ Free Spins Count: [50]                              │
│ ├─ Game Title: [Olympus Wins]                          │
│ ├─ Cost per Currency: [Grid of 21 currencies]          │
│ ├─ Wagering Multiplier: [Grid of 21 currencies]        │
│ └─ Maximum Bets: [Grid of 21 currencies]               │
│                                                         │
│ [Create FSDROP Bonus]                                  │
└─────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════════
                      FUTURE BONUS TYPES PATTERN
═══════════════════════════════════════════════════════════════════════════════

Once you add FSDROP using this pattern, adding the others is straightforward:

CASHBACK:
  • New fields: percentage, maximum_cashback, minimum_loss_amount
  • Color: green (bg-green-900/20)
  • JSON: "Cashback 10 Percent.json"

SEQUENTIAL:
  • New fields: stage_count, stage_configs array
  • Color: purple (bg-purple-900/20)
  • JSON: "Sequential 1.json", "Sequential 2.json"

COMBO:
  • New fields: linked_bonus_id, combination_rules
  • Color: pink (bg-pink-900/20)
  • JSON: "combo 1.json", "combo 2.json"

Each follows the exact same pattern:
1. Add state fields
2. Initialize with defaults
3. Add conditional render section
4. Add submission logic
5. Add reset logic
6. Test

═══════════════════════════════════════════════════════════════════════════════
