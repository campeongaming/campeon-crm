═══════════════════════════════════════════════════════════════════════════════
                         BONUS STRATEGY & TAXONOMY
═══════════════════════════════════════════════════════════════════════════════

December 30, 2025 - Strategic Planning for Bonus Type Implementation

═══════════════════════════════════════════════════════════════════════════════
                      KEY INSIGHT: BONUS WORKFLOW
═══════════════════════════════════════════════════════════════════════════════

BONUS LIFECYCLE:

User Action (TRIGGER) → Reward Calculation (REWARD) → Conditions (WAGERING)

Example:
  DEPOSIT $25 (trigger) → Get 100% bonus (reward) → Wager x15 (condition)

═══════════════════════════════════════════════════════════════════════════════
                         BONUS TAXONOMY - 3 TIERS
═══════════════════════════════════════════════════════════════════════════════

TIER 1: PRIMARY BONUSES (User must take action first)
───────────────────────────────────────────────────────

1️⃣ DEPOSIT BONUS
   Trigger: User makes first deposit
   Reward: Cash bonus + Free Spins
   Example: Deposit €25 → Get 100% bonus
   JSON: "Deposit 25 Get up to FS.json"
   Trigger Type: "deposit"
   Status: ✅ IMPLEMENTED

2️⃣ RELOAD BONUS
   Trigger: User makes additional deposits (after first)
   Reward: Percentage bonus on new deposit
   Example: Deposit €100 → Get 150% bonus
   JSON: "Reload bonus up to.json"
   Trigger Type: "deposit" (same as DEPOSIT but applied to repeat deposits)
   Status: ✅ IMPLEMENTED
   
   KEY DIFFERENCE FROM DEPOSIT:
   • DEPOSIT = 1st deposit only, usually higher %
   • RELOAD = Subsequent deposits, varies by casino/timing

═══════════════════════════════════════════════════════════════════════════════

TIER 2: SECONDARY BONUSES (Triggered by gameplay or wagering)
──────────────────────────────────────────────────────────────

3️⃣ WAGER BONUS
   Trigger: User wagers minimum amount (€200)
   Reward: Free Spins in specific game
   Example: Wager €200 → Get 500 FS on Sweet Rush Bonanza
   JSON: "Wager 200Eur and get 500 Free Spins.json"
   Trigger Type: "external" (bonus is "unlocked" externally)
   Status: ✅ IMPLEMENTED
   
   KEY CHARACTERISTIC:
   • Not tied to deposit
   • Triggered by playing/wagering
   • Usually time-limited (7 days)
   • Specific game included

4️⃣ FSDROP (Free Spins Drop)
   Trigger: No action required (promotions, seasonal)
   Reward: Free Spins in specific game
   Example: Get 50 FS on Olympus Wins (no deposit needed)
   JSON: "Drop 50 Free Spins.json"
   Trigger Type: "external"
   Status: ⏳ READY TO IMPLEMENT
   
   KEY CHARACTERISTIC:
   • NO deposit required (no-deposit bonus)
   • Calendar/time-based
   • Usually limited quantity
   • Often used to attract new players

5️⃣ CASHBACK BONUS
   Trigger: User incurs losses
   Reward: Percentage of losses back to account
   Example: Lose €100 → Get 10% (€10) cashback
   JSON: "Cashback 10 Percent.json"
   Trigger Type: "external"
   Status: ⏳ READY TO IMPLEMENT
   
   KEY CHARACTERISTIC:
   • Triggered by losses, not wins
   • Percentage-based on loss amount
   • Max cashback cap per currency
   • Usually lower % (5-20%)
   • Creates player retention

═══════════════════════════════════════════════════════════════════════════════

TIER 3: COMPLEX/COMPOSITE BONUSES (Multiple stages/linked bonuses)
────────────────────────────────────────────────────────────────────

6️⃣ SEQUENTIAL BONUS
   Trigger: Multiple stages of bonuses linked together
   Reward: Stage 1 + Stage 2 + Stage 3 (cumulative)
   Example: Stage 1: 100% up to €500 + 200 FS → Complete to unlock Stage 2
   JSON: "Sequential 1.json", "Sequential 2.json"
   Trigger Type: "deposit" + "external"
   Status: ⏳ READY TO IMPLEMENT (more complex)
   
   KEY CHARACTERISTIC:
   • Multi-stage progression
   • Each stage unlocks next
   • Conditional requirements
   • Usually 2-4 stages
   • Player must complete stage 1 to get stage 2

7️⃣ COMBO BONUS
   Trigger: Combination of other bonus types
   Reward: "Pack" of bonuses used together
   Example: 100% Deposit + 200 FS + 150% Reload
   JSON: "combo 1.json", "combo 2.json"
   Trigger Type: Multiple (deposit + free spins)
   Status: ⏳ READY TO IMPLEMENT (complex linking)
   
   KEY CHARACTERISTIC:
   • Links multiple bonuses
   • Marketed as "package"
   • Usually includes base bonus + extras
   • May have version for "Bonused" vs "Non-Bonused" players

═══════════════════════════════════════════════════════════════════════════════
                      JSON STRUCTURE COMPARISON
═══════════════════════════════════════════════════════════════════════════════

SIMPLE BONUSES (DEPOSIT, RELOAD, WAGER, FSDROP):
  ├─ id: string
  ├─ schedule: { type, from, to }
  ├─ trigger: { type, name, description, minimumAmount }
  └─ config: { cost, multiplier, maximumBets, ... }

MEDIUM BONUSES (CASHBACK):
  ├─ id: string
  ├─ trigger:
  │  ├─ name, description
  │  ├─ type: "external"
  │  ├─ minimumAmount (min loss to trigger)
  │  └─ minimumLossAmount (specific requirement)
  └─ config: 
     ├─ percentage (10%)
     ├─ maximumCashback (per currency)
     └─ cost (usually 0)

COMPLEX BONUSES (SEQUENTIAL):
  ├─ id: string
  ├─ trigger: { name, description, type }
  ├─ config: { ... }
  └─ stages: [
     { stage: 1, reward: "100% up to €500", ... },
     { stage: 2, reward: "150% up to €250", ... },
     ...
  ]

COMPOSITE BONUSES (COMBO):
  ├─ id: string
  ├─ trigger: { name, description }
  ├─ bonuses: [
  │  { id: "DEPOSIT_1", type: "deposit", ... },
  │  { id: "FSDROP_1", type: "fsdrop", ... },
  │  { id: "RELOAD_1", type: "reload", ... }
  ]
  └─ relationships: [
     { primary: "DEPOSIT_1", secondary: "FSDROP_1", trigger: "after" }
  ]

═══════════════════════════════════════════════════════════════════════════════
                       IMPLEMENTATION STRATEGY
═══════════════════════════════════════════════════════════════════════════════

PHASE 1: Foundation (COMPLETE ✅)
────────────────────────────────────
Status: DONE
  ✅ DEPOSIT (basic percentage bonus)
  ✅ RELOAD (variation of DEPOSIT)
  ✅ WAGER (wager-triggered rewards)

PHASE 2: Immediate Extensions (30-90 mins)
──────────────────────────────────────────
Difficulty: LOW (minimal new concepts)

Next: FSDROP
  • Time: 30-45 mins
  • Complexity: LOW (similar structure to WAGER)
  • New Concepts: None (just no deposit requirement)
  • Prerequisites: None

Then: CASHBACK
  • Time: 45-60 mins
  • Complexity: MEDIUM (loss-based, not deposit-based)
  • New Concepts: Loss calculation, min loss amount, percentage-based
  • Prerequisites: New fields in form

PHASE 3: Complex Types (2-3 hours)
─────────────────────────────────────
Difficulty: MEDIUM-HIGH (new architecture needed)

Then: SEQUENTIAL
  • Time: 60-90 mins
  • Complexity: HIGH (stage management)
  • New Concepts: Multi-stage form, conditional display
  • Prerequisites: Stage builder UI

Finally: COMBO
  • Time: 60-90 mins
  • Complexity: HIGH (bonus linking)
  • New Concepts: Bonus selection, dependency mapping
  • Prerequisites: Bonus picker/selector component

═══════════════════════════════════════════════════════════════════════════════
                    RECOMMENDED PRIORITY ORDER
═══════════════════════════════════════════════════════════════════════════════

PHASE 1: NOW ✅
  1. ✅ DEPOSIT
  2. ✅ RELOAD  
  3. ✅ WAGER

PHASE 2: Next Session (Today or tomorrow)
  4. → FSDROP (simplest to add, 30 mins)
  5. → CASHBACK (adds loss concept, 45 mins)

PHASE 3: Within 1-2 days
  6. → SEQUENTIAL (multi-stage complexity, 90 mins)
  7. → COMBO (linking complexity, 90 mins)

═══════════════════════════════════════════════════════════════════════════════
                   SUGGESTED DATABASE SCHEMA EVOLUTION
═══════════════════════════════════════════════════════════════════════════════

CURRENT (Works for all 7 types):
```sql
CREATE TABLE bonus_templates (
  id TEXT PRIMARY KEY,
  bonus_type TEXT,        -- 'deposit', 'reload', 'wager', 'fsdrop', 'cashback', 'sequential', 'combo'
  provider TEXT,
  trigger_name JSON,      -- { "*": "...", "en": "...", etc }
  trigger_description JSON,
  trigger_type TEXT,      -- 'deposit', 'external'
  config JSON,            -- Stores all type-specific data
  schedule_from DATETIME,
  schedule_to DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

FUTURE (May split if config gets too large):
```sql
-- For SEQUENTIAL and COMBO, could have:
CREATE TABLE bonus_stages (
  id INTEGER PRIMARY KEY,
  bonus_id TEXT,          -- FK to bonus_templates.id
  stage_number INTEGER,
  stage_config JSON
)

CREATE TABLE bonus_relationships (
  id INTEGER PRIMARY KEY,
  primary_bonus_id TEXT,  -- FK to bonus_templates.id
  secondary_bonus_id TEXT,
  relationship_type TEXT  -- 'sequential_stage', 'combo_part', etc
)
```

BUT FOR NOW: Keep flat schema, store stages/relationships in config JSON

═══════════════════════════════════════════════════════════════════════════════
                       FORM ARCHITECTURE STRATEGY
═══════════════════════════════════════════════════════════════════════════════

SINGLE FORM REMAINS BEST APPROACH:

```
BonusCreationForm.tsx
├─ Bonus Type Selector (dropdown)
├─ Common Fields (all types)
│  ├─ ID
│  ├─ Provider
│  ├─ Trigger Name/Description
│  └─ Schedule
│
└─ Type-Specific Sections (conditional)
   ├─ DEPOSIT/RELOAD (percentage-based)
   ├─ WAGER (wager amount grid)
   ├─ FSDROP (simple fs + game)
   ├─ CASHBACK (percentage + loss amounts)
   ├─ SEQUENTIAL (stage builder)
   └─ COMBO (bonus selector + relationships)
```

NEW COMPONENTS MIGHT BE NEEDED:
  • StageBuilder.tsx (for SEQUENTIAL)
  • BonusSelector.tsx (for COMBO linking)
  • CurrencyGrid.tsx (reusable component for multi-currency fields)

═══════════════════════════════════════════════════════════════════════════════
                         FORM FIELDS BY TYPE
═══════════════════════════════════════════════════════════════════════════════

PHASE 1 - DONE ✅

DEPOSIT:
  ├─ Percentage (%)
  ├─ Wagering Multiplier (x)
  ├─ Minimum Amount
  └─ Cost (EUR)

RELOAD: (same as DEPOSIT)

WAGER:
  ├─ Wager Amount per Currency (grid)
  ├─ Free Spins Count
  ├─ Game Title
  ├─ Cost per Wager per Currency (grid)
  └─ Maximum Bets per Currency (grid)

PHASE 2 - READY

FSDROP:
  ├─ Free Spins Count
  ├─ Game Title
  ├─ Cost per Currency (grid)
  ├─ Wagering Multiplier per Currency (grid)
  └─ Maximum Bets per Currency (grid)
  
  FORM PATTERN: Same as WAGER but simpler
  ✓ Copy WAGER section
  ✓ Remove "Wager Amount" field
  ✓ Change color to yellow

CASHBACK:
  ├─ Percentage (%)
  ├─ Minimum Amount (min to qualify)
  ├─ Minimum Loss Amount (min loss to trigger)
  ├─ Maximum Cashback per Currency (grid)
  ├─ Cost (usually 0)
  └─ Multiplier per Currency (optional grid)
  
  FORM PATTERN: New (loss-based instead of deposit-based)
  ✓ Different logic for trigger
  ✓ New fields for loss amounts
  ✓ Percentage instead of wager amounts

PHASE 3 - COMPLEX

SEQUENTIAL:
  ├─ Stage Count (2, 3, or 4 stages)
  └─ For Each Stage:
     ├─ Stage Name/Description
     ├─ Percentage (%)
     ├─ Maximum Amount
     ├─ Wagering Multiplier
     ├─ Free Spins (if included)
     ├─ Unlock Condition (optional)
     └─ Unlock Amount (optional)
  
  FORM PATTERN: Dynamic stage builder
  ✓ "Add Stage" button
  ✓ Repeating section for each stage
  ✓ Remove stage button
  ✓ Drag to reorder (optional)

COMBO:
  ├─ Name/Description of combo
  ├─ Bonus Selection:
  │  ├─ Base Bonus (usually DEPOSIT)
  │  ├─ Secondary Bonuses (FSDROP, RELOAD, etc)
  │  └─ Link Type (sequential, concurrent)
  └─ For Each Selected Bonus:
     └─ Its form fields
  
  FORM PATTERN: Complex linking
  ✓ Bonus picker/selector
  ✓ Shows selected bonuses
  ✓ Conditional fields based on selection
  ✓ Dependency visualization

═══════════════════════════════════════════════════════════════════════════════
                      TESTING STRATEGY BY PHASE
═══════════════════════════════════════════════════════════════════════════════

PHASE 1 ✅
  Per type: 
    • Create 2-3 test bonuses
    • Verify database storage
    • Check JSON generation
    • Test form validation
    
  Milestone: All 3 types create/store without errors

PHASE 2
  FSDROP:
    • Create no-deposit FS bonus
    • Verify it doesn't require deposit amount
    • Check multi-currency grids work
    
  CASHBACK:
    • Create cashback bonus with loss trigger
    • Verify percentage calculation
    • Check max cashback per currency
    
  Milestone: Can create 5 bonus types

PHASE 3
  SEQUENTIAL:
    • Create 3-stage bonus
    • Verify stage progression UI
    • Check stage unlock conditions
    
  COMBO:
    • Create combo linking deposit + fsdrop
    • Verify both bonuses in one package
    • Check database stores relationships
    
  Milestone: All 7 bonus types working end-to-end

═══════════════════════════════════════════════════════════════════════════════
                         DECISION CHECKPOINTS
═══════════════════════════════════════════════════════════════════════════════

BEFORE IMPLEMENTING EACH PHASE:

PHASE 1 → PHASE 2 GATE:
  ☐ All 3 Phase 1 types working?
  ☐ Database schema handles config variations?
  ☐ UI pattern scalable to 7 types?
  ☐ Form validation working?
  
  DECISION: Proceed to FSDROP & CASHBACK?

PHASE 2 → PHASE 3 GATE:
  ☐ FSDROP working?
  ☐ CASHBACK working?
  ☐ Do we need sub-components (StageBuilder, BonusSelector)?
  ☐ Can current BonusCreationForm handle complexity or need refactor?
  
  DECISION: Proceed to SEQUENTIAL & COMBO?
  
  OPTION A: Keep single component (if manageable)
  OPTION B: Extract sub-components (if too large)

═══════════════════════════════════════════════════════════════════════════════
                         IMPLEMENTATION CHECKLIST
═══════════════════════════════════════════════════════════════════════════════

When implementing EACH new bonus type:

☐ 1. Read JSON variants (2-3 examples)
☐ 2. Extract field differences
☐ 3. Add state fields to BonusFormData interface
☐ 4. Add default values to useState
☐ 5. Add conditional render section (color-coded)
☐ 6. Add submission logic in handleSubmit
☐ 7. Add reset logic after success
☐ 8. Create test data set
☐ 9. Test form fields update correctly
☐ 10. Test submission creates bonus
☐ 11. Verify database has correct bonus_type
☐ 12. Check all multi-currency values stored
☐ 13. Test switching between types
☐ 14. Document in comments

═══════════════════════════════════════════════════════════════════════════════
                      NEXT IMMEDIATE ACTIONS
═══════════════════════════════════════════════════════════════════════════════

1. CONFIRM STRATEGY (You)
   ☐ Agree with PHASE approach?
   ☐ Agree with priority order?
   ☐ Any changes to taxonomy?

2. AFTER CONFIRMATION:
   ☐ Finalize BonusCreationForm for max extensibility
   ☐ Add comments explaining architecture
   ☐ Start PHASE 2: Add FSDROP
   ☐ Then: Add CASHBACK
   ☐ Finally: Plan PHASE 3 approach

═══════════════════════════════════════════════════════════════════════════════
