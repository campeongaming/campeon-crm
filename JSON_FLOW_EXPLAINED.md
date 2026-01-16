# CAMPEON CRM: JSON Creation & Generation Flow

## 🎯 Overview

Your system has **two separate JSON flows**:

1. **CREATION**: User fills form → Data saved to database
2. **GENERATION**: Retrieve template from DB → Build final JSON for export/API

---

## 📊 Part 1: DATABASE STORAGE (What Gets Stored)

### Location: `backend/database/models.py`

#### **StableConfig Table** (Admin pricing tables)
```python
class StableConfig:
    - provider: "PRAGMATIC" or "BETSOFT"
    - cost: JSON array of pricing tables
    - maximum_amount: JSON array
    - minimum_amount: JSON array
    - minimum_stake_to_wager: JSON array
    - maximum_stake_to_wager: JSON array
    - maximum_withdraw: JSON array
    - casino_proportions: Text (proportions JSON string)
    - live_casino_proportions: Text (proportions JSON string)
```

**Example Stored Value:**
```json
{
  "cost": [
    {
      "id": "1",
      "name": "Table 1",
      "values": {
        "EUR": 0.12,
        "USD": 0.12,
        "GBP": 0.10,
        "NOK": 1.2,
        ...
      }
    },
    {
      "id": "2",
      "name": "Table 2",
      "values": {
        "EUR": 0.40,
        "USD": 0.42,
        ...
      }
    }
  ]
}
```

#### **BonusTemplate Table** (User-created bonuses)
```python
class BonusTemplate:
    # IDENTIFIERS
    id: String (human-readable title)
    
    # SCHEDULE
    schedule_type: String ("period", "weekly", "daily")
    schedule_from: String ("21-11-2025 10:00")
    schedule_to: String ("28-11-2025 22:59")
    
    # TRIGGER (What activates the bonus)
    trigger_type: String ("deposit", "reload", "cashback")
    trigger_name: JSON ({"*": "default", "en": "...", "de": "..."})
    trigger_description: JSON ({"*": "default", "en": "...", "de": "..."})
    trigger_iterations: Integer (how many times claimable)
    trigger_duration: String ("7d", "24h")
    minimum_amount: JSON ({"*": 25, "EUR": 25, "USD": 25, ...})
    restricted_countries: JSON (["BR", "AU", "NZ"])
    segments: JSON (["vip", "high_rollers"])
    
    # CONFIG (Bonus parameters)
    cost: JSON ({"EUR": 0.12, "USD": 0.12, ...})
    multiplier: JSON ({"EUR": 1.44, "USD": 1.44, ...})
    maximum_bets: JSON ({"EUR": 600, "USD": 600, ...})
    percentage: Float (200 for 200%)
    wagering_multiplier: Float (15 for x15)
    minimum_stake_to_wager: JSON ({"*": 0.5, "EUR": 0.5, ...})
    maximum_stake_to_wager: JSON ({"*": 5, "EUR": 5, ...})
    maximum_amount: JSON ({"*": 300, "EUR": 300, ...})
    maximum_withdraw: JSON ({"EUR": {"cap": 100}, "USD": {"cap": 110}, ...})
    
    # EXTRA
    provider: String ("PRAGMATIC", "BETSOFT")
    brand: String
    bonus_type: String ("free_spins", "reload", "deposit")
    config_type: String
    game: String (for free spins)
    expiry: String ("7d")
    notes: String (internal notes)
```

---

## 🔄 Part 2: CREATION FLOW (Frontend → Database)

### Step-by-Step Process

#### **1. User Fills Form** (Frontend Component)
- **File**: `src/components/AwardFreeSpins.tsx` or `src/components/ReloadBonusForm.tsx`
- User enters: Title, provider, percentage, wagering multiplier, etc.
- User selects cost from pricing table (e.g., EUR = 0.12)

#### **2. Pricing Table Lookup** (Frontend - at form submission)
```typescript
const buildCurrencyMap = (eurValue: number, fieldName: 'cost' | 'minimum_amount' | 'maximum_withdraw') => {
  if (fieldName === 'cost' && adminConfig?.cost) {
    const tolerance = 0.001;
    for (const table of adminConfig.cost) {
      // Find matching table by EUR value with tolerance
      if (Math.abs(table.values.EUR - eurValue) < tolerance) {
        // Return ALL currencies from this table
        return { '*': table.values.EUR, ...table.values };
      }
    }
  }
  // Fallback...
}
```

**Why this matters:**
- When user enters EUR = 0.12, we search admin tables
- Find the table that has EUR ≈ 0.12
- Load ALL 21 currencies from that table (USD, GBP, NOK, etc.)
- Never use user input for other currencies - ALWAYS use table values

#### **3. Build JSON Object** (Frontend)
```typescript
const bonusJson = {
  // SCHEDULE (if enabled)
  schedule: withSchedule ? {
    period: {
      from: scheduleFrom,
      to: scheduleTo
    }
  } : undefined,

  // TRIGGER
  trigger: {
    type: triggerType, // "deposit"
    duration: duration, // "7d"
    minimumAmount: buildCurrencyMap(minimumAmountEUR, 'minimum_amount'),
    iterations: iterationsOptional ? iterations : undefined,
    ...(restrictedCountries.length > 0 && { restrictedCountries })
  },

  // CONFIG
  config: {
    type: bonusType, // "free_spins"
    cost: buildCurrencyMap(costEUR, 'cost'), // ALL currencies
    multiplier: { '*': baseMultiplier, ...currencyMultipliers },
    maximumBets: selectedMaxStakeTable,
    percentage: percentage, // 100 for 100%
    wageringMultiplier: wageringMultiplier, // 20 for x20
    minimumStakeToWager: selectedMinStakeTable,
    maximumStakeToWager: selectedMaxStakeTable,
    maximumAmount: selectedMaxAmountTable,
    maximumWithdraw: selectedMaxWithdrawTable,
    ...(includeAmount && { includeAmountOnTargetWager: true }),
    ...(capCalculation && { capCalculationToMaximum: true }),
    ...(game && { game })
  }
};
```

#### **4. Build API Payload** (Frontend)
```typescript
const payload = {
  id: generatedBonusId, // e.g., "DEPOSIT_2025-01-15_001"
  schedule_type: scheduleType,
  schedule_from: scheduleFrom,
  schedule_to: scheduleTo,
  
  trigger_type: triggerType,
  trigger_name: { "*": triggerName, en: triggerName },
  trigger_description: { "*": triggerDesc, en: triggerDesc },
  trigger_iterations: iterationsOptional ? iterations : null,
  trigger_duration: duration,
  minimum_amount: currencyMap, // {"EUR": 25, "USD": 25, ...}
  restricted_countries: restrictedCountries,
  segments: segments,
  
  cost: costCurrencyMap, // FROM PRICING TABLE
  multiplier: multiplierMap,
  maximum_bets: maximumBetsMap,
  percentage: percentage,
  wagering_multiplier: wageringMultiplier,
  
  provider: selectedProvider, // "PRAGMATIC"
  brand: selectedBrand,
  bonus_type: bonusType,
  config_extra: { game: game },
  notes: notes
};

// POST to backend
axios.post('http://localhost:8000/api/bonus-templates', payload);
```

#### **5. Backend Stores to Database** (Backend - `bonus_templates.py`)
```python
@router.post("/bonus-templates")
def create_bonus_template(template: BonusTemplateCreate, db: Session = Depends(get_db)):
    db_template = BonusTemplate(
        id=template.id,
        cost=template.cost,  # Stored as JSON
        multiplier=template.multiplier,  # Stored as JSON
        maximum_bets=template.maximum_bets,  # Stored as JSON
        minimum_amount=template.minimum_amount,  # Stored as JSON
        trigger_type=template.trigger_type,
        trigger_name=template.trigger_name,
        trigger_description=template.trigger_description,
        # ... all other fields
    )
    db.add(db_template)
    db.commit()
```

---

## 🔧 Part 3: GENERATION FLOW (Database → JSON Export)

### Location: `backend/api/bonus_templates.py` (line 466+)

#### **Endpoint**: `GET /api/bonus-templates/{template_id}/json`

This endpoint:
1. **Retrieves template** from database
2. **Fetches translations** for multilingual support
3. **Builds final JSON** with correct field ordering
4. **Returns formatted JSON** ready for download/API

#### **Step 1: Retrieve Template**
```python
template = db.query(BonusTemplate).filter(
    BonusTemplate.id == template_id
).first()
```

#### **Step 2: Format Multi-Currency Fields**
```python
# Fetch admin config for fallback data
admin_config = db.query(StableConfig).filter(
    StableConfig.provider == template.provider
).first()

# Build maximumWithdraw in nested format with "cap"
maximum_withdraw_formatted = {}
if template.maximum_withdraw:
    for curr, val in template.maximum_withdraw.items():
        if isinstance(val, dict):
            maximum_withdraw_formatted[curr] = val  # Already nested
        else:
            maximum_withdraw_formatted[curr] = {"cap": val}  # Wrap in cap
```

#### **Step 3: Fetch Translations**
```python
translations = db.query(BonusTranslation).filter(
    BonusTranslation.template_id == template_id
).all()

# Build multilingual fields
trigger_name = {}
trigger_description = {}

for translation in translations:
    if translation.language:
        if translation.name:
            trigger_name[translation.language] = translation.name
        if translation.description:
            trigger_description[translation.language] = translation.description

# Set "*" (default/fallback) to English or first available
if "en" in trigger_name:
    trigger_name["*"] = trigger_name["en"]
elif trigger_name:
    trigger_name["*"] = next(iter(trigger_name.values()))
```

#### **Step 4: Build Final JSON**
```python
json_output = {
    "id": template.id,
    
    # SCHEDULE (if exists)
    "schedule": {
        "period": {
            "from": template.schedule_from,
            "to": template.schedule_to
        }
    } if template.schedule_from else None,
    
    # TRIGGER
    "trigger": {
        "type": template.trigger_type,
        "duration": template.trigger_duration,
        "name": trigger_name,  # Multi-language
        "description": trigger_description,  # Multi-language
        "minimumAmount": template.minimum_amount,
        "iterations": template.trigger_iterations,
        "restrictedCountries": template.restricted_countries
    },
    
    # CONFIG
    "config": {
        "type": template.bonus_type,
        "cost": template.cost,  # Multi-currency from table
        "multiplier": template.multiplier,
        "maximumBets": template.maximum_bets,
        "percentage": template.percentage,
        "wageringMultiplier": template.wagering_multiplier,
        "minimumStakeToWager": template.minimum_stake_to_wager,
        "maximumStakeToWager": template.maximum_stake_to_wager,
        "maximumAmount": template.maximum_amount,
        "maximumWithdraw": maximum_withdraw_formatted,
        "game": template.game if template.bonus_type == "free_spins" else None
    },
    
    "type": "bonus_template"
}

return json_output
```

#### **Example Generated JSON Output:**
```json
{
  "id": "FREE_SPINS_2025-01-15_Holiday_Promo",
  "schedule": {
    "period": {
      "from": "21-11-2025 10:00",
      "to": "28-11-2025 22:59"
    }
  },
  "trigger": {
    "type": "deposit",
    "duration": "7d",
    "name": {
      "*": "Welcome Free Spins",
      "en": "Welcome Free Spins",
      "de": "Willkommen Freispiele",
      "fr": "Tours Gratuits de Bienvenue"
    },
    "description": {
      "*": "Get 50 free spins on deposit",
      "en": "Get 50 free spins on deposit",
      "de": "Erhalten Sie 50 Freispiele bei Einzahlung"
    },
    "minimumAmount": {
      "*": 25,
      "EUR": 25,
      "USD": 25,
      "GBP": 20,
      "NOK": 250
    },
    "iterations": 1,
    "restrictedCountries": ["BR", "AU", "NZ"]
  },
  "config": {
    "type": "free_spins",
    "cost": {
      "*": 0.12,
      "EUR": 0.12,
      "USD": 0.12,
      "GBP": 0.10,
      "NOK": 1.2,
      "JPY": 13.2
    },
    "multiplier": {
      "*": 1.44,
      "EUR": 1.44,
      "USD": 1.44,
      "GBP": 1.44
    },
    "maximumBets": {
      "*": 5,
      "EUR": 5,
      "USD": 5,
      "GBP": 4
    },
    "percentage": 100,
    "wageringMultiplier": 20,
    "minimumStakeToWager": {
      "*": 0.5,
      "EUR": 0.5
    },
    "maximumStakeToWager": {
      "*": 50,
      "EUR": 50
    },
    "maximumAmount": {
      "*": 300,
      "EUR": 300,
      "USD": 310
    },
    "maximumWithdraw": {
      "EUR": {"cap": 100},
      "USD": {"cap": 110},
      "GBP": {"cap": 80}
    },
    "game": "book_of_dead"
  },
  "type": "bonus_template"
}
```

---

## 🔍 Where to See Everything

### **1. View Database Directly**

#### SQLite Browser (easiest):
```bash
# Terminal 1: Start backend
python -m uvicorn main:app --reload

# Terminal 2: View database
# Download "DB Browser for SQLite" or use command line
sqlite3 backend/casino_crm.db
```

#### SQL Queries to Inspect:
```sql
-- View all bonus templates
SELECT id, bonus_type, provider, cost, multiplier FROM bonus_templates;

-- View specific template with formatted JSON
SELECT id, cost, minimum_amount, maximum_withdraw FROM bonus_templates 
WHERE id = 'FREE_SPINS_2025-01-15_001';

-- View admin pricing tables
SELECT provider, cost, maximum_amount FROM stable_configs;

-- View template translations
SELECT template_id, language, name, description FROM bonus_translations;
```

### **2. API Endpoints to Test**

#### Swagger Docs (Live):
```
http://localhost:8000/docs
```

#### Get Single Template JSON:
```bash
curl http://localhost:8000/api/bonus-templates/{template_id}/json | jq .
```

#### Get All Templates:
```bash
curl http://localhost:8000/api/bonus-templates | jq .
```

#### Get Admin Config:
```bash
curl http://localhost:8000/api/stable-config/PRAGMATIC | jq .
```

### **3. Frontend Files to Review**

| File | Purpose |
|------|---------|
| `src/components/AwardFreeSpins.tsx` | Free Spins creation form + JSON builder |
| `src/components/ReloadBonusForm.tsx` | Reload bonus creation form + JSON builder |
| `src/lib/bonusConfig.ts` | Bonus type definitions & ID generation |
| `src/components/OptimizationTeam.tsx` | Download/export templates as JSON |

### **4. Backend Files to Review**

| File | Purpose |
|------|---------|
| `backend/database/models.py` | Database schema definitions |
| `backend/api/bonus_templates.py` | CRUD endpoints + JSON generation |
| `backend/api/schemas.py` | Pydantic validation models |
| `backend/services/json_generator.py` | JSON formatting utilities |

---

## ⚡ Key Principles

### **Multi-Currency Handling**
- ✅ **At creation**: User enters EUR value → Lookup pricing table → Load ALL 21 currencies
- ✅ **In database**: Store as `{"*": 0.12, "EUR": 0.12, "USD": 0.12, ...}` (always include `"*"`)
- ✅ **At export**: Return as-is, no transformation needed

### **Optional Fields**
- Use **spread operator** in payload to exclude null fields:
  ```typescript
  ...(withMinimumAmount && { minimum_amount: currencyMap })
  ```
- Only include in JSON if checkbox is enabled

### **Multilingual Support**
- Store as JSON: `{"*": "fallback", "en": "English", "de": "German"}`
- The `"*"` key is the default/fallback value
- Add new languages via Translation Team tab

### **Schedule (Optional)**
- If no schedule, omit the schedule field entirely from output
- If schedule provided: `{"period": {"from": "...", "to": "..."}}`

---

## 🎬 Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER CREATES BONUS                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  AwardFreeSpins.tsx / ReloadBonusForm.tsx                       │
│  - User fills form fields                                        │
│  - User selects cost EUR = 0.12                                 │
│  - Lookup pricing table → Get ALL 21 currencies                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Build JSON object                                               │
│  {                                                               │
│    schedule: {...},                                             │
│    trigger: {...},                                              │
│    config: {                                                    │
│      cost: {"*": 0.12, "EUR": 0.12, "USD": 0.12, ...}         │
│    }                                                             │
│  }                                                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  POST to backend /api/bonus-templates                           │
│  {id, cost, multiplier, minimum_amount, ...}                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Backend: bonus_templates.py (create_bonus_template)            │
│  - Validate payload (Pydantic schema)                           │
│  - Create BonusTemplate row in DB                               │
│  - Store all JSON fields as-is                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
        ┌───────────────────────────────────────┐
        │  🔄 TEMPLATE STORED IN DATABASE 🔄    │
        │  bonus_templates table row            │
        └───────────────────────────────────────┘
        
        ═══════════════════════════════════════════════════════════

                    USER EXPORTS/VIEWS JSON

        ═══════════════════════════════════════════════════════════
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Frontend: OptimizationTeam.tsx                                  │
│  - User clicks "Download JSON"                                  │
│  - Call GET /api/bonus-templates/{id}/json                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Backend: bonus_templates.py (generate_template_json)           │
│  - Query BonusTemplate from DB                                  │
│  - Fetch translations                                           │
│  - Format multi-currency fields                                 │
│  - Build final JSON with correct structure                      │
│  - Return as JSON                                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  FINAL JSON WITH:                                               │
│  - All 21 currencies populated                                  │
│  - Translations in all languages                                │
│  - Correct field ordering                                       │
│  - Ready for download/API consumption                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Testing the Flow

### **1. Create a bonus in UI**
- Go to "Create Bonus" tab
- Fill in form with real values
- Submit

### **2. Check it was stored**
```bash
# SQLite
sqlite3 backend/casino_crm.db
SELECT id, cost, multiplier FROM bonus_templates WHERE id LIKE 'FREE_SPINS%';
```

### **3. View generated JSON**
```bash
curl http://localhost:8000/api/bonus-templates/FREE_SPINS_2025-01-15_001/json | jq .
```

### **4. Download from UI**
- Go to "Optimization Team" tab
- Search for your bonus ID
- Click "Download JSON"
- Check the downloaded file matches API output

---

## 📋 Summary

| Step | Location | What Happens |
|------|----------|---|
| **Creation** | `AwardFreeSpins.tsx` | User enters values, looks up pricing table |
| **Payload Build** | `AwardFreeSpins.tsx` | Create JSON with all currencies from table |
| **API Send** | `AwardFreeSpins.tsx` | POST to `/bonus-templates` endpoint |
| **Storage** | `bonus_templates.py` | Save all JSON fields to database |
| **Database** | `casino_crm.db` | Template stored with multi-currency data |
| **Retrieval** | `bonus_templates.py` (GET endpoint) | Query template + fetch translations |
| **JSON Build** | `bonus_templates.py` (generate_template_json) | Format final JSON for export |
| **Download** | `OptimizationTeam.tsx` | Frontend downloads formatted JSON |

All JSON fields maintain their multi-currency structure throughout the entire flow! 🎉
