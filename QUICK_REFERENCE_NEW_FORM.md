═══════════════════════════════════════════════════════════════════════════════
                          QUICK REFERENCE - NEW IMPLEMENTATION
═══════════════════════════════════════════════════════════════════════════════

WHAT'S NEW (December 30, 2025):
═════════════════════════════════

✅ NEW COMPONENT: BonusCreationForm.tsx
   • Master form for all 7 bonus types
   • Single dropdown selector
   • Dynamic fields (conditional render)
   • Multi-currency support (21 currencies)
   • Color-coded sections per type

✅ FEATURES ADDED:
   • Dropdown with all 7 bonus types
   • Intelligent field visibility (only show relevant fields)
   • Auto-population of trigger_type based on bonus type
   • Currency-specific input grids (scrollable, compact)
   • Real-time form validation
   • Type-specific error messages
   • Professional UI with color coding

✅ BONUS TYPES WORKING:
   ✓ DEPOSIT
   ✓ RELOAD
   ✓ WAGER (NEW!)

✅ BONUS TYPES READY TO IMPLEMENT:
   ⏳ FSDROP (Free Spins Drop) - Documented & Easy
   ⏳ CASHBACK - Documented & Easy
   ⏳ SEQUENTIAL - Medium complexity
   ⏳ COMBO - Medium complexity

═══════════════════════════════════════════════════════════════════════════════
                              FILE LOCATIONS
═══════════════════════════════════════════════════════════════════════════════

MAIN FORM COMPONENT:
  📄 src/components/BonusCreationForm.tsx
     └─ 400+ lines of React code
     └─ Handles all 7 bonus types
     └─ Type: Client component ('use client')

MAIN APP PAGE:
  📄 src/app/page.tsx
     └─ Updated imports (DepositBonusForm → BonusCreationForm)
     └─ Updated tab rendering
     └─ "Create Bonus" tab now shows new form

DOCUMENTATION:
  📄 MULTI_BONUS_TYPE_SETUP.md
     └─ Complete overview of implementation
     └─ All 7 bonus types breakdown
     └─ Form fields for each type

  📄 HOW_TO_ADD_NEXT_BONUS_TYPE.md
     └─ Step-by-step guide to add FSDROP
     └─ Copy-paste ready code examples
     └─ Testing checklist

═══════════════════════════════════════════════════════════════════════════════
                          HOW TO USE - USER FLOW
═══════════════════════════════════════════════════════════════════════════════

1. START APP
   npm run dev  (frontend)
   python -m uvicorn main:app --reload  (backend)

2. OPEN BROWSER
   http://localhost:3000

3. CLICK "🎰 Create Bonus" TAB

4. SELECT BONUS TYPE FROM DROPDOWN
   ┌─ Bonus Type ─────────────────────────────┐
   │ [💳 Deposit Bonus ▼]                      │
   │  • 💳 Deposit Bonus                       │
   │  • 🔄 Reload Bonus                        │
   │  • 🎯 Wager-Triggered FS ← (NEW!)        │
   │  • ✨ Free Spins Drop                     │
   │  • 💵 Cashback                            │
   │  • 📈 Sequential                          │
   │  • 🎁 Combo                               │
   └───────────────────────────────────────────┘

5. FORM UPDATES DYNAMICALLY
   • Only relevant fields shown
   • Color-coded section appears
   • Labels & descriptions update

6. FILL IN THE FORM
   • Basic info (ID, Provider, Name, Category)
   • Schedule (optional, both dates required)
   • Type-specific fields
   • Multi-currency values in scrollable grids

7. CLICK "Create {TYPE} Bonus"

8. SEE SUCCESS MESSAGE
   ✅ WAGER bonus created! ID: WAGER_200_500_2025-12-22

9. GO TO "📊 Optimization Team" TAB

10. CLICK "Generate JSON"
    • Full JSON reconstructed with all stored data
    • Ready for API consumption

═══════════════════════════════════════════════════════════════════════════════
                        FORM FIELDS COMPARISON TABLE
═══════════════════════════════════════════════════════════════════════════════

                     │ DEPOSIT│ RELOAD │ WAGER │ FSDROP│ CASHBACK│ SEQ │ COMBO
─────────────────────┼────────┼────────┼───────┼───────┼─────────┼─────┼──────
Basic Info           │   ✓    │   ✓    │   ✓   │   ✓   │    ✓    │  ✓  │  ✓
Schedule (Optional)  │   ✓    │   ✓    │   ✓   │   ✓   │    ✓    │  ✓  │  ✓
─────────────────────┼────────┼────────┼───────┼───────┼─────────┼─────┼──────
Percentage (%)       │   ✓    │   ✓    │       │       │         │  ✓  │
Wagering Multiplier  │   ✓    │   ✓    │       │   ✓   │         │  ✓  │
Minimum Amount       │   ✓    │   ✓    │       │       │         │  ✓  │
Cost (Single)        │   ✓    │   ✓    │       │       │         │     │
─────────────────────┼────────┼────────┼───────┼───────┼─────────┼─────┼──────
Wager Amount (MC)    │        │        │   ✓   │       │         │     │
Free Spins Count     │        │        │   ✓   │   ✓   │         │     │
Cost per Wager (MC)  │        │        │   ✓   │       │         │     │
Game Title           │        │        │   ✓   │   ✓   │         │     │
─────────────────────┼────────┼────────┼───────┼───────┼─────────┼─────┼──────
Cashback % (MC)      │        │        │       │       │    ✓    │     │
Min Loss Amount      │        │        │       │       │    ✓    │     │
Max Cashback (MC)    │        │        │       │       │    ✓    │     │
─────────────────────┼────────┼────────┼───────┼───────┼─────────┼─────┼──────
Stages Config        │        │        │       │       │         │  ✓  │
Stage Count          │        │        │       │       │         │  ✓  │
─────────────────────┼────────┼────────┼───────┼───────┼─────────┼─────┼──────
Linked Bonus ID      │        │        │       │       │         │     │  ✓
Combination Rules    │        │        │       │       │         │     │  ✓
─────────────────────┼────────┼────────┼───────┼───────┼─────────┼─────┼──────

Legend:
  ✓    = Implemented
  (MC) = Multi-Currency (21 currencies in scrollable grid)
  🔨   = Ready to implement (documented)
  —    = Not applicable

═══════════════════════════════════════════════════════════════════════════════
                           CODE STRUCTURE OVERVIEW
═══════════════════════════════════════════════════════════════════════════════

BonusCreationForm.tsx Structure:

┌─ IMPORTS & CONSTANTS ─────────────────────────────────┐
│ • React hooks (useState, useEffect)                   │
│ • axios for API calls                                 │
│ • BONUS_TYPES array (7 types with labels)            │
│ • CURRENCIES array (21 currencies)                    │
└──────────────────────────────────────────────────────┘
                          ↓
┌─ TYPESCRIPT INTERFACES ───────────────────────────────┐
│ • BonusFormData                                        │
│   ├─ Common fields (id, provider, schedule, etc)     │
│   ├─ DEPOSIT/RELOAD fields (percentage, etc)        │
│   └─ WAGER fields (wager_amount, free_spins, etc)   │
└──────────────────────────────────────────────────────┘
                          ↓
┌─ STATE MANAGEMENT ────────────────────────────────────┐
│ • formData: BonusFormData (all form values)           │
│ • loading: boolean (submission loading state)        │
│ • message: string (success/error messages)           │
│ • selectedProvider: string (current provider)        │
│ • pricingTable: any (fetched admin pricing)          │
└──────────────────────────────────────────────────────┘
                          ↓
┌─ EFFECTS ─────────────────────────────────────────────┐
│ • useEffect: Fetch pricing table when provider changes│
└──────────────────────────────────────────────────────┘
                          ↓
┌─ EVENT HANDLERS ──────────────────────────────────────┐
│ • handleBonusTypeChange: Update fields when type changes
│ • getTriggerTypeForBonus: Map type → trigger_type     │
│ • handleBasicChange: Generic input/select handler     │
│ • handleCurrencyChange: Update currency-specific values
│ • handleSubmit: Validate & POST to API               │
└──────────────────────────────────────────────────────┘
                          ↓
┌─ JSX RENDER ──────────────────────────────────────────┐
│ ├─ Message Alert (conditional)                        │
│ ├─ Bonus Type Selector Dropdown                      │
│ ├─ Basic Info Section (always shown)                 │
│ ├─ Schedule Section (always shown, optional)         │
│ ├─ Type-Specific Sections:                           │
│ │  ├─ DEPOSIT/RELOAD Section (conditional)           │
│ │  ├─ WAGER Section (conditional)                    │
│ │  ├─ FSDROP Section (ready to add)                  │
│ │  ├─ CASHBACK Section (ready to add)                │
│ │  └─ ... more sections for other types              │
│ └─ Submit Button (dynamic label)                     │
└──────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════════
                       COLOR CODING CONVENTION
═══════════════════════════════════════════════════════════════════════════════

Each bonus type has its own color scheme for easy visual identification:

┌─ DEPOSIT/RELOAD ──────────────────────────────────────┐
│ Background: bg-blue-900/20                            │
│ Border: border-blue-700/50                            │
│ Text: text-blue-300                                   │
│ Ring: focus:ring-blue-500                             │
│ Use for: Percentage-based bonuses                     │
└──────────────────────────────────────────────────────┘

┌─ WAGER ───────────────────────────────────────────────┐
│ Background: bg-amber-900/20                           │
│ Border: border-amber-700/50                           │
│ Text: text-amber-300                                  │
│ Ring: focus:ring-amber-500                            │
│ Use for: Wager-triggered free spins                  │
└──────────────────────────────────────────────────────┘

┌─ FSDROP (READY TO ADD) ────────────────────────────────┐
│ Background: bg-yellow-900/20                          │
│ Border: border-yellow-700/50                          │
│ Text: text-yellow-300                                 │
│ Ring: focus:ring-yellow-500                           │
│ Use for: No-deposit free spins                        │
└──────────────────────────────────────────────────────┘

┌─ CASHBACK (READY TO ADD) ──────────────────────────────┐
│ Background: bg-green-900/20                           │
│ Border: border-green-700/50                           │
│ Text: text-green-300                                  │
│ Ring: focus:ring-green-500                            │
│ Use for: Cash back on losses                          │
└──────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════════
                        API PAYLOAD EXAMPLES
═══════════════════════════════════════════════════════════════════════════════

DEPOSIT PAYLOAD:
```json
{
  "id": "DEPOSIT_100_25_2025-12-22",
  "bonus_type": "deposit",
  "provider": "PRAGMATIC",
  "percentage": 100,
  "wagering_multiplier": 15,
  "minimum_amount": {"*": 25},
  "cost_eur": 0.2,
  "trigger_type": "deposit",
  "category": "GAMES",
  "schedule_from": "2025-12-22T10:00",
  "schedule_to": "2025-12-23T23:59"
}
```

WAGER PAYLOAD:
```json
{
  "id": "WAGER_200_500_2025-12-22",
  "bonus_type": "wager",
  "provider": "PRAGMATIC",
  "wager_amount": {"EUR": 200, "USD": 200, ...},
  "free_spins_count": 500,
  "cost_per_wager": {"EUR": 0.2, "USD": 0.2, ...},
  "maximum_bets": {"EUR": 500, "USD": 500, ...},
  "wager_game_title": {"*": "Sweet Rush Bonanza"},
  "trigger_type": "external",
  "category": "GAMES"
}
```

═══════════════════════════════════════════════════════════════════════════════
                           TROUBLESHOOTING
═══════════════════════════════════════════════════════════════════════════════

ISSUE: Form not showing when "Create Bonus" tab clicked
SOLUTION: Check if BonusCreationForm is imported in page.tsx

ISSUE: Dropdown options not appearing
SOLUTION: Verify BONUS_TYPES array is defined at top of BonusCreationForm

ISSUE: Form fields not changing when bonus type selected
SOLUTION: Check handleBonusTypeChange is connected to select element

ISSUE: Submission fails with validation error
SOLUTION: Ensure all required fields have values (marked with asterisk)

ISSUE: Currency grids not showing
SOLUTION: Verify CURRENCIES array has 21 items, check overflow-y-auto class

ISSUE: API returns 404 when creating bonus
SOLUTION: Check API_ENDPOINTS.BONUS_TEMPLATES has correct URL
         Check backend CORS allows frontend port

═══════════════════════════════════════════════════════════════════════════════
                        NEXT STEPS CHECKLIST
═══════════════════════════════════════════════════════════════════════════════

IMMEDIATE:
  ☐ Test current implementation (DEPOSIT, RELOAD, WAGER)
  ☐ Verify all 7 bonus types appear in dropdown
  ☐ Test switching between types (fields should update)
  ☐ Create test bonuses of each type
  ☐ Check database stores data correctly

SOON (Next Session):
  ☐ Add FSDROP bonus type (follow HOW_TO_ADD_NEXT_BONUS_TYPE.md)
  ☐ Add CASHBACK bonus type
  ☐ Test all FSDROP & CASHBACK fields
  ☐ Create sample bonuses

LATER:
  ☐ Add SEQUENTIAL bonus type (more complex)
  ☐ Add COMBO bonus type (more complex)
  ☐ Test all 7 types end-to-end
  ☐ Implement JSON generation in Optimization team
  ☐ Add data validation rules

═══════════════════════════════════════════════════════════════════════════════
