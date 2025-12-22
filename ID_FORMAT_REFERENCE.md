# Bonus ID Format Reference

## Quick ID Generator Cheat Sheet

### DEPOSIT Bonus
```
Format: DEPOSIT_[minimumAmount]_[percentage]_[DD.MM.YY]
Example: DEPOSIT_25_100_22.12.25
Wizard Fields: Min Amount, Percentage, Wagering Multiplier
Description: 25€ minimum, 100% bonus, created 22 Dec 2025
```

### RELOAD Bonus
```
Format: RELOAD_[minimumAmount]_[percentage]_[DD.MM.YY]
Example: RELOAD_50_150_22.12.25
Wizard Fields: Min Amount, Percentage, Wagering Multiplier
Description: 50€ minimum, 150% bonus, created 22 Dec 2025
```

### Free Spins Drop (No-Deposit)
```
Format: FSDROP_[spinCount]_[DD.MM.YY]
Example: FSDROP_50_28.11.25
Wizard Fields: Spin Count, Wagering Multiplier
Description: 50 free spins, created 28 Nov 2025
```

### Wager-Triggered FS
```
Format: WAGER_[euroAmount]_[spinCount]_[DD.MM.YY]
Example: WAGER_200_500_22.12.25
Wizard Fields: Wager Amount, Spin Count, Wagering Multiplier
Description: Wager 200€, get 500 spins, created 22 Dec 2025
```

### Sequential (Multi-Stage)
```
Format: SEQ_[stageNumber]_[minimumAmount]_[percentage]_[DD.MM.YY]
Examples: 
  - SEQ_1_25_100_22.12.25 (Stage 1: 25€ at 100%)
  - SEQ_2_50_75_22.12.25  (Stage 2: 50€ at 75%)
Wizard Fields: Stage Number, Min Amount, Percentage, Wagering Multiplier
Description: Multi-stage bonus with different specs per stage
```

### Combo (Linked Bonuses)
```
Format: COMBO_[linkedBonusID]_[DD.MM.YY]
Example: COMBO_DEPOSIT_25_100_22.12.25_22.12.25
Wizard Fields: Linked Bonus ID (copy from another bonus)
Description: Secondary bonus linked to primary bonus
Usage: First create primary bonus, then create COMBO referencing its ID
```

---

## Decision Tree: Which Bonus Type?

```
Is it triggered on deposit? 
  └─ YES with %?          → DEPOSIT (or RELOAD if reload-only)
  └─ YES with free spins? → DEPOSIT with FS
  └─ NO (no-deposit)?     → FSDROP

Is it percentage-based?
  └─ YES                  → DEPOSIT or RELOAD
  └─ NO                   → FSDROP or WAGER

Is it multi-stage?
  └─ YES                  → SEQ_1, SEQ_2, etc.
  └─ NO                   → Individual type

Is it linked to another bonus?
  └─ YES                  → COMBO_[linkedID]
  └─ NO                   → Stand-alone type

Is it wager-triggered?
  └─ YES                  → WAGER_[amount]_[spins]
  └─ NO                   → Other type
```

---

## Examples from Your Bonus Collection

| Bonus File | Type | ID Format | Example ID |
|-----------|------|-----------|-----------|
| Combo 1.json | Deposit (Reload) | RELOAD_25_100_22.12.25 | `RELOAD_25_100_22.12.25` |
| Sequential 1.json | Sequential | SEQ_1_25_100_22.12.25 | `SEQ_1_25_100_22.12.25` |
| Sequential 2.json | Sequential | SEQ_2_0_0_22.12.25 | `SEQ_2_0_0_22.12.25` |
| Drop 50 Free Spins.json | FS Drop | FSDROP_50_28.11.25 | `FSDROP_50_28.11.25` |
| Wager 200Eur.json | Wager-Triggered | WAGER_200_500_22.12.25 | `WAGER_200_500_22.12.25` |
| Cashback 10 Percent.json | Cashback | CASHBACK_10_22.12.25 | `CASHBACK_10_22.12.25` |

---

## ID Validation Rules

✅ **Valid IDs:**
- `DEPOSIT_25_100_22.12.25` - All required fields
- `SEQ_1_25_100_22.12.25` - Stage number included
- `FSDROP_50_22.12.25` - Minimal but complete

❌ **Invalid IDs:**
- `DEPOSIT_25_22.12.25` - Missing percentage
- `RELOAD_100_22.12.25` - Missing minimum amount
- `SEQ_25_100_22.12.25` - Missing stage number

---

## How Dates Work

All IDs include today's date in `DD.MM.YY` format:
- Created on 22 Dec 2025 → `22.12.25`
- Created on 28 Nov 2025 → `28.11.25`
- Created on 01 Jan 2026 → `01.01.26`

The date is **auto-filled** by the wizard based on system date.

---

## Real-World Scenario

**Your Backoffice Setup:**

```
December 22, 2025

Morning Session:
✓ Create DEPOSIT_25_100_22.12.25  (25€ deposit, 100% match)
✓ Create RELOAD_50_150_22.12.25   (50€ reload, 150% match)
✓ Create SEQ_1_25_100_22.12.25    (Stage 1 of promotion)
✓ Create SEQ_2_50_75_22.12.25     (Stage 2 of promotion)

Afternoon Session:
✓ Create FSDROP_75_22.12.25       (75 free spins, no deposit)
✓ Create COMBO_DEPOSIT_25_100_22.12.25_22.12.25  (Bonus combo)

Result: 6 bonuses with clean, organized IDs
All specs visible in the ID itself
No collisions, easy to search, clear intent
```

---

## API Integration (Coming Soon)

When backend integration is ready:

```
POST /api/bonus-templates
Body: {
  "id": "DEPOSIT_25_100_22.12.25",
  "type": "DEPOSIT",
  "trigger": { ... },
  "config": { ... },
  "created_at": "2025-12-22T10:30:00Z"
}

Response: 
{
  "status": "success",
  "id": "DEPOSIT_25_100_22.12.25",
  "message": "Bonus created successfully"
}
```
