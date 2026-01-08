# 🎲 Quick Start - Bonus JSON Generator

## How to Use (3 Easy Steps)

### Step 1: Open "Create Bonus" Tab
Go to Tab 2 (Blue tab) - "🎰 Create Bonus"

### Step 2: Fill the Form
1. **Select Bonus Type**: Choose from dropdown (Deposit, External, Open, Cashback)
2. **Pick Currency Set**: EU or Global
3. **Fill Bonus Details**: ID, amounts, percentages based on type
4. **Add Schedule (Optional)**: Enable "Time-boxed Promo" if needed

### Step 3: Generate & Download
1. Click **"✨ Generate Bonus JSON"** button
2. Auto-switches to **"📊 Optimization Team"** tab
3. JSON displays in editor with validation ✅
4. Download or edit as needed

---

## Bonus Types Explained

### 💳 DEPOSIT (Reload Bonuses)
**What**: Match bonus on user deposits  
**Example**: "Deposit €25, get 100% bonus up to €200"  
**Fields**: Min/max amount, percentage, wager multiplier, min/max stakes

### 🎁 EXTERNAL (Free Spins/Free Bets)
**What**: Triggered by external events (casino drops, campaigns)  
**Example**: "50 Free Spins on Book of Dead"  
**Fields**: Cost per spin, multiplier, max bets, expiry, provider

### 🔗 OPEN (Chained Bonuses)
**What**: Second bonus depends on completing first bonus  
**Example**: "Complete Welcome Bonus, unlock Stage 2 Bonus"  
**Fields**: Chain to other bonus IDs, same as external fields

### 💰 CASHBACK (Loss Recovery)
**What**: Cashback on losses  
**Example**: "10% Cashback up to €100"  
**Fields**: Cashback %, max cashback amount

---

## Currency Mapping

**EU Preset** (6 currencies):
- EUR, GBP, NOK, SEK, DKK, CHF

**Global Preset** (21 currencies):
- All above + USD, AUD, CAD, NZD, JPY, CNY, INR, BRL, ZAR, MXN, RUB, TRY, PLN, CZK, HUF

When you enter a number (e.g., "25"), it automatically applies to all selected currencies:
```json
{
  "*": 25,
  "EUR": 25,
  "USD": 25,
  "GBP": 25,
  ...
}
```

---

## Example Workflow: Create a Deposit Bonus

**Step 1**: Select Trigger Type = "Deposit" ✓  
**Step 2**: Select Currency Set = "EU" ✓  
**Step 3**: Fill form:
- Bonus ID: `DEPOSIT_25_200_2025-01-05`
- Duration: `7d`
- Min Deposit: `25`
- Max Bonus: `200`
- Percentage: `100`
- Wagering Multiplier: `30`
- Min Stake: `0.5`
- Max Stake: `5`

**Step 4**: Click "Generate" ✓  
**Step 5**: Auto-jumps to Optimization Team tab ✓  
**Step 6**: See full JSON structure with all 6 currencies ✓  
**Step 7**: Download or continue editing ✓

---

## Output Example

When you generate a deposit bonus, you get:

```json
{
  "id": "DEPOSIT_25_200_2025-01-05",
  "trigger": {
    "type": "deposit",
    "duration": "7d",
    "minimumAmount": {
      "*": 25,
      "EUR": 25,
      "GBP": 25,
      "NOK": 25,
      "SEK": 25,
      "DKK": 25,
      "CHF": 25
    }
  },
  "config": {
    "type": "cash",
    "category": "games",
    "percentage": 100,
    "wageringMultiplier": 30,
    "maximumAmount": {
      "*": 200,
      "EUR": 200,
      ...
    },
    "minimumStakeToWager": {
      "*": 0.5,
      ...
    },
    "maximumStakeToWager": {
      "*": 5,
      ...
    },
    "withdrawActive": false,
    "provider": "SYSTEM",
    "brand": "SYSTEM"
  },
  "type": "bonus_template"
}
```

---

## Tips & Tricks

✨ **Tip 1**: Use meaningful Bonus IDs (include type and date)  
✨ **Tip 2**: EU preset is faster for testing; use Global for production  
✨ **Tip 3**: Schedule fields are optional - only fill if time-boxed  
✨ **Tip 4**: The green checkmark means JSON is valid and ready to download  
✨ **Tip 5**: Edit JSON in Optimization Team tab if you need custom tweaks  

---

## Troubleshooting

**❌ "Bonus ID is required"**  
→ You forgot to fill in the ID field

**❌ "Percentage must be greater than 0"**  
→ Fill in a valid percentage value (e.g., 100)

**❌ "JSON is invalid"** (red box in Optimization Team)  
→ Check the editor - syntax error in your edits

**❌ Button appears disabled**  
→ Fix all validation errors first (see error list)

---

## Navigation

- **Tab 1**: ⚙️ Admin Setup (pricing tables)
- **Tab 2**: 🎰 Create Bonus ← **START HERE**
- **Tab 3**: 📅 Browse Bonuses (search existing)
- **Tab 4**: 🌐 Translation Team (translate text)
- **Tab 5**: 📊 Optimization Team (validate & download) ← **Generated JSON goes here**

---

**Status**: All systems go! 🚀
