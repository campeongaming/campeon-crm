═══════════════════════════════════════════════════════════════════════════════
                    BONUS FIELDS MAPPING - USER INPUT ONLY
═══════════════════════════════════════════════════════════════════════════════

This maps EXACTLY what fields each bonus type needs (from JSON analysis).
NOT what's auto-generated or hardcoded—only user inputs.

═══════════════════════════════════════════════════════════════════════════════
                            COMMON FIELDS (All Bonuses)
═══════════════════════════════════════════════════════════════════════════════

trigger.name (Multilingual)
trigger.description (Multilingual)
schedule.from (optional)
schedule.to (optional)
trigger.type (dropdown: "deposit", "external")
trigger.duration (e.g., "7d")
trigger.restrictedCountries (multi-select)

HARDCODED:
  • type: "bonus_template"
  • provider: User will choose (PRAGMATIC, BETSOFT, etc.)
  • brand: User will input
  • category: User will input
  • segments: (optional, skip for now)

═══════════════════════════════════════════════════════════════════════════════
                        REWARD TYPE 1: CASH PERCENTAGE
═══════════════════════════════════════════════════════════════════════════════

Examples: DEPOSIT (cash %), RELOAD (cash %), COMBO with cash

TRIGGER FIELDS:
  • minimumAmount (grid by currency)
  • iterations (usually 1)

CONFIG FIELDS:
  • percentage (e.g., 100)
  • maximumAmount (grid by currency)
  • minimumStakeToWager (grid by currency)
  • maximumStakeToWager (grid by currency)
  • wageringMultiplier (e.g., 15, 20)
  • compensateOverspending (toggle: true/false)
  • includeAmountOnTargetWagerCalculation (toggle)
  • capCalculationAmountToMaximumBonus (toggle)
  • maximumWithdraw (grid by currency)
  • withdrawActive (toggle)
  • maximumBets (grid by currency)
  • extra → proportions (game list with values - SKIP FOR NOW, copy from existing)

═══════════════════════════════════════════════════════════════════════════════
                        REWARD TYPE 2: FREE SPINS
═══════════════════════════════════════════════════════════════════════════════

Examples: DEPOSIT with FS reward, WAGER with FS, FSDROP

TRIGGER FIELDS:
  • minimumAmount (grid by currency) - NOT needed for FSDROP (no deposit)
  • iterations (usually varies)

CONFIG FIELDS:
  • maximumBets (grid by currency)
  • maximumWithdraw (grid by currency)
  • expiry (e.g., "7d")
  • extra → game (e.g., "Big Bass Christmas Bash")

AUTO-POPULATED FROM ADMIN SETUP:
  • cost (grid by currency)
  • multiplier (grid by currency - same as cost)

═══════════════════════════════════════════════════════════════════════════════
                        REWARD TYPE 3: CASHBACK
═══════════════════════════════════════════════════════════════════════════════

Example: Cashback 10%

TRIGGER FIELDS:
  • minimumAmount (e.g., 10)
  • minimumLossAmount (e.g., 50)

CONFIG FIELDS:
  • percentage (e.g., 10)
  • maximumCashback (grid by currency)
  • maximumWithdraw (grid by currency)
  • withdrawActive (toggle)

HARDCODED/IGNORED:
  • cost: (all 0)
  • multiplier: (0)
  • maximumBets: (all 0)
  • type: "cashback"

═══════════════════════════════════════════════════════════════════════════════
                        REWARD TYPE 4: SEQUENTIAL
═══════════════════════════════════════════════════════════════════════════════

Example: 4 stages, each with different reward

TRIGGER FIELDS (per stage):
  • name, description, minimumAmount, duration, type, restrictedCountries

CONFIG FIELDS (per stage):
  • Same as CASH PERCENTAGE (percentage, maximumAmount, etc.)

SPECIAL:
  • This is MULTIPLE bonuses in sequence
  • Need to repeat CASH fields for each stage
  • minimumDepositCount (e.g., 1)
  • segments (array - SKIP FOR NOW)

═══════════════════════════════════════════════════════════════════════════════
                        REWARD TYPE 5: COMBO
═══════════════════════════════════════════════════════════════════════════════

Example: 100% deposit + 200 FS on specific game

TRIGGER FIELDS:
  • name, description, minimumAmount, duration, type, restrictedCountries
  • minimumDepositCount

CONFIG FIELDS:
  • Combines CASH PERCENTAGE fields + FREE SPINS fields
  • Same as Sequential (multiple components)
  • extra → proportions (large game list - COPY FROM EXISTING)

═══════════════════════════════════════════════════════════════════════════════
                          START HERE RECOMMENDATION
═══════════════════════════════════════════════════════════════════════════════

Phase 1 (Already done - working):
  ✅ CASH PERCENTAGE form
     • Can be used for: DEPOSIT (cash %), RELOAD (cash %), COMBO (cash part)

Phase 2 (Start next):
  1. FREE SPINS form
     • Can be used for: DEPOSIT (FS), WAGER (FS), FSDROP

  2. CASHBACK form
     • Can be used for: CASHBACK

Phase 3 (Complex):
  1. SEQUENTIAL form
     • Need to allow multiple stages
     • Each stage is essentially a CASH PERCENTAGE sub-form

  2. COMBO form
     • Mix of CASH + FREE SPINS
     • Need component selection

═══════════════════════════════════════════════════════════════════════════════
                       FORM ORGANIZATION SUGGESTION
═══════════════════════════════════════════════════════════════════════════════

For each bonus:

1. BASIC INFO
   ├─ Trigger name (multilingual)
   ├─ Trigger description (multilingual)
   ├─ Trigger type (dropdown: deposit / external)
   └─ Schedule (optional: from/to dates)

2. TRIGGER-SPECIFIC FIELDS
   ├─ minimumAmount (grid)
   ├─ minimumLossAmount (if cashback)
   ├─ iterations (if applicable)
   └─ minimumDepositCount (if sequential/combo)

3. REWARD-SPECIFIC FIELDS
   ├─ For Cash: percentage, maximumAmount, wageringMultiplier, etc.
   ├─ For FS: maximumBets, game, expiry
   ├─ For Cashback: percentage, maximumCashback, maximumWithdraw
   └─ For Sequential/Combo: repeat above per stage

4. META FIELDS
   ├─ Brand
   ├─ Category
   ├─ Withdraw active
   ├─ Provider
   └─ Restricted countries

═══════════════════════════════════════════════════════════════════════════════
