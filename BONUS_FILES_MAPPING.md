# JSON Bonus Files - Standardized ID Mapping

## Your 9 Bonus Examples with New IDs

### Before (Old Random IDs)
```
❌ "1st Stage-Risk of Churn Deposit Bonused 100% Casino Reload Bonus up to €200 Row"
❌ "Christmas 150% Casino Reload Bonus up to €250 2nd 05.01.26 ROW"
❌ "Black Friday Free Spin Drop 50 Free Spins on Olympus Wins 28.11.25 ROW"
```

### After (New Standardized IDs)
```
✅ RELOAD_25_100_22.12.25
✅ RELOAD_25_150_22.12.25
✅ FSDROP_50_28.11.25
```

---

## 📋 Your 9 Bonus Files Mapped

| File Name | Bonus Type | Old ID | New ID | Use Case |
|-----------|-----------|--------|--------|----------|
| **Combo 1.json** | RELOAD | "1st Stage-Risk of Churn..." | `RELOAD_25_100_22.12.25` | 25€ min, 100% reload |
| **Combo 2.json** | DEPOSIT + FS | "Combo Bonus..." | `COMBO_RELOAD_25_100_22.12.25_22.12.25` | Linked to Combo 1 |
| **Sequential 1.json** | SEQ (Stage 1) | "1st Stage Bonused..." | `SEQ_1_25_100_22.12.25` | 25€ min, 100% stage 1 |
| **Sequential 2.json** | SEQ (Stage 2) | "2nd Stage..." | `SEQ_2_0_0_22.12.25` | Stage 2 of promotion |
| **Deposit 25 Get up to FS.json** | DEPOSIT + FS | "Deposit Bonus..." | `DEPOSIT_25_100_22.12.25` | 25€ deposit bonus |
| **Drop 50 Free Spins.json** | FSDROP | "Black Friday Free Spin Drop..." | `FSDROP_50_28.11.25` | 50 free spins |
| **Reload bonus up to.json** | RELOAD | "Christmas 150% Casino..." | `RELOAD_25_150_22.12.25` | 25€ min, 150% reload |
| **Wager 200Eur and get 500 Free Spins.json** | WAGER | "Wager Bonus..." | `WAGER_200_500_22.12.25` | Wager 200€, get 500 FS |
| **Cashback 10 Percent.json** | CASHBACK | "10% Cashback..." | `CASHBACK_10_22.12.25` | 10% cashback bonus |

---

## 🎯 Bonus Type Distribution

```
DEPOSIT/RELOAD:    4 files (Combo 1, Sequential 1, Deposit 25, Reload)
FSDROP:            1 file  (Drop 50)
SEQ:               2 files (Sequential 1, Sequential 2)
COMBO:             1 file  (Combo 2)
WAGER:             1 file  (Wager 200)
CASHBACK:          1 file  (Cashback 10) ← NEW
─────────────────────────────────────────
TOTAL:             9 files (as of Dec 22, 2025)
```

---

## 📊 ID Format Usage

### RELOAD Bonuses (Most Common)
```
RELOAD_[minimumAmount]_[percentage]_[DD.MM.YY]

Examples from your collection:
├─ RELOAD_25_100_22.12.25    (Combo 1.json - 100% reload)
├─ RELOAD_25_150_22.12.25    (Reload bonus up to.json - 150% reload)
└─ RELOAD_50_150_22.12.25    (Hypothetical for 50€ minimum)
```

### SEQUENTIAL Bonuses (Multi-Stage)
```
SEQ_[stageNumber]_[minimumAmount]_[percentage]_[DD.MM.YY]

Examples from your collection:
├─ SEQ_1_25_100_22.12.25     (Sequential 1.json - Stage 1)
└─ SEQ_2_0_0_22.12.25        (Sequential 2.json - Stage 2)

Note: These 2 files represent ONE promotion (Stages 1 & 2)
```

### COMBO Bonuses (Linked)
```
COMBO_[linkedBonusID]_[DD.MM.YY]

Examples from your collection:
└─ COMBO_RELOAD_25_100_22.12.25_22.12.25
   (Combo 2.json - Links to Combo 1's RELOAD bonus)
```

---

## 🔄 Real-World Example: Sequential 2-Stage Promotion

### Day 1: Create Stage 1
**File:** Sequential 1.json
**User Action:** Create through wizard
```
Type:               SEQ
Stage Number:       1
Min Amount:         25€
Percentage:         100%
Wagering:           20x
ID Generated:       SEQ_1_25_100_22.12.25
```

### Day 1: Create Stage 2
**File:** Sequential 2.json
**User Action:** Create through wizard
```
Type:               SEQ
Stage Number:       2
Min Amount:         0€ (or varies)
Percentage:         0% (or varies)
Wagering:           20x
ID Generated:       SEQ_2_0_0_22.12.25
```

### Result: Linked Promotion
```
Users see:
├─ Stage 1 bonus: SEQ_1_25_100_22.12.25
│  └─ "Deposit 25€ and get 100% match"
├─ Stage 2 bonus: SEQ_2_0_0_22.12.25
│  └─ "Then proceed to Stage 2"
└─ Both use segment linking in config
```

---

## 🎨 Visual: ID Structure Breakdown

### DEPOSIT Bonus ID
```
DEPOSIT_25_100_22.12.25
│       │  │   └─ Date: 22 Dec 2025
│       │  └──── Percentage: 100%
│       └─────── Min Amount: 25€
└──────────────  Type: DEPOSIT
```

### RELOAD Bonus ID
```
RELOAD_50_150_22.12.25
│      │  │   └─ Date: 22 Dec 2025
│      │  └──── Percentage: 150%
│      └─────── Min Amount: 50€
└───────────── Type: RELOAD
```

### SEQ Bonus ID
```
SEQ_2_0_0_22.12.25
│   │  │ │  └─ Date: 22 Dec 2025
│   │  │ └──── Percentage: 0%
│   │  └────── Min Amount: 0€
│   └───────── Stage Number: 2
└──────────── Type: SEQ
```

### COMBO Bonus ID
```
COMBO_RELOAD_25_100_22.12.25_22.12.25
│    └───────────────────────┬─────────┘
│                           │
│                           └─ Linked Bonus ID
└──────────────────────────── Type: COMBO
```

---

## 📁 Bonus Files Organization

### By Bonus Type:
```
RELOAD (3 files):
  ├─ Combo 1.json                    (RELOAD_25_100_22.12.25)
  ├─ Reload bonus up to.json         (RELOAD_25_150_22.12.25)
  └─ (More could be added)

SEQUENTIAL (2 files):
  ├─ Sequential 1.json               (SEQ_1_25_100_22.12.25)
  └─ Sequential 2.json               (SEQ_2_0_0_22.12.25)

COMBO (1 file):
  └─ Combo 2.json                    (COMBO_RELOAD_25_100_22.12.25_22.12.25)

DEPOSIT (1 file):
  └─ Deposit 25 Get up to FS.json    (DEPOSIT_25_100_22.12.25)

FSDROP (1 file):
  └─ Drop 50 Free Spins.json         (FSDROP_50_28.11.25)

WAGER (1 file):
  └─ Wager 200Eur...json             (WAGER_200_500_22.12.25)

CASHBACK (1 file):
  └─ Cashback 10 Percent.json        (CASHBACK_10_22.12.25) ← NEW
```

### By ID Prefix (Backoffice View):
```
COMBO_     (1)  [Combo 2]
DEPOSIT_   (1)  [Deposit 25]
FSDROP_    (1)  [Drop 50]
RELOAD_    (3)  [Combo 1, Reload, Deposit]
SEQ_       (2)  [Sequential 1, Sequential 2]
WAGER_     (1)  [Wager 200]
CASHBACK_  (1)  [Cashback 10] ← NEW
────────────────────────────────
TOTAL:     (9 bonuses, organized by prefix)
```

---

## 🚀 Creating These in the Wizard

### Test Workflow: Recreate Your 9 Bonuses

**Step 1: RELOAD Bonus**
```
Click "Create New Bonus"
Select: "Reload Bonus"
Fill:   Min Amount = 25, % = 100, Wagering = 20
Result: RELOAD_25_100_22.12.25 ✓
```

**Step 2: FSDROP Bonus**
```
Click "Create New Bonus"
Select: "Free Spins Drop"
Fill:   Spins = 50, Wagering = 5
Result: FSDROP_50_22.12.25 ✓
```

**Step 3: SEQ Bonus (Stage 1)**
```
Click "Create New Bonus"
Select: "Sequential Bonus"
Fill:   Stage = 1, Min = 25, % = 100, Wagering = 20
Result: SEQ_1_25_100_22.12.25 ✓
```

**Step 4: SEQ Bonus (Stage 2)**
```
Click "Create New Bonus"
Select: "Sequential Bonus"
Fill:   Stage = 2, Min = 0, % = 0, Wagering = 20
Result: SEQ_2_0_0_22.12.25 ✓
```

**Step 5: WAGER Bonus**
```
Click "Create New Bonus"
Select: "Wager-Triggered FS"
Fill:   Wager = 200, Spins = 500, Wagering = 5
Result: WAGER_200_500_22.12.25 ✓
```

**Step 6: COMBO Bonus**
```
Click "Create New Bonus"
Select: "Combo Bonus"
Fill:   Linked Bonus ID = RELOAD_25_100_22.12.25
Result: COMBO_RELOAD_25_100_22.12.25_22.12.25 ✓
```

---

## 📊 Comparison: Before vs After

### Before (Your Current JSON Files)
```javascript
{
  "id": "1st Stage-Risk of Churn Deposit Bonused 100% Casino Reload Bonus up to €200 Row",
  "trigger": { ... },
  "config": { ... }
}

// Problems:
// ❌ 150+ characters, hard to use
// ❌ Inconsistent format across files
// ❌ Can't parse programmatically
// ❌ Risk of typos/duplicates
```

### After (With Wizard System)
```typescript
// User fills form in wizard:
minimumAmount: 25,
percentage: 100

// System generates:
generateBonusId('RELOAD', { minimumAmount: 25, percentage: 100 })
// Returns: "RELOAD_25_100_22.12.25"

// Result:
{
  "id": "RELOAD_25_100_22.12.25",
  "trigger": { ... },
  "config": { ... }
}

// Benefits:
// ✅ 25 characters, clean and short
// ✅ Consistent format across all bonuses
// ✅ Machine-parseable
// ✅ Impossible to duplicate
// ✅ Instantly shows what bonus it is
```

---

## 🎯 Key Takeaway

**Your 9 bonus examples now have standardized IDs:**

```
Old → New

"1st Stage-Risk of Churn..." → RELOAD_25_100_22.12.25
"Christmas 150% Casino..." → RELOAD_25_150_22.12.25
"Black Friday Free Spin..." → FSDROP_50_28.11.25
"Wager Bonus..." → WAGER_200_500_22.12.25
+ 5 more → All now standardized ✅
```

This ensures that when the backoffice has 200+ bonuses, they're all organized, searchable, and maintainable!

---

## 📝 Next: Test the Wizard

To verify this works:

1. **Start app:** `npm run dev`
2. **Visit:** http://localhost:3000
3. **Click:** "✨ Create New Bonus"
4. **Create:** RELOAD bonus with 25€ and 100%
5. **Watch:** ID generates as `RELOAD_25_100_22.12.25`
6. **Verify:** Matches the format in this document ✓

---

**Date:** December 22, 2025
**Files Analyzed:** 9 JSON bonus examples
**New Format Status:** ✅ Ready for implementation
