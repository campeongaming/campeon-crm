═══════════════════════════════════════════════════════════════════════════════
                    CASHBACK BONUS FORM - ALL FIELDS
═══════════════════════════════════════════════════════════════════════════════

Extracted from: Cashback 10 Percent.json

═══════════════════════════════════════════════════════════════════════════════
                        SECTION 1: BASIC INFO
═══════════════════════════════════════════════════════════════════════════════

trigger.name (Multilingual - user input)
  └─ Example: {"en": "10% Cashback on Losses", "de": "10% Cashback auf Verluste", ...}

trigger.duration (text input)
  └─ Example: "1w"

trigger.type (HARDCODED)
  └─ Always: "external"

provider (dropdown)
  └─ Example: "PRAGMATIC"

brand (text input)
  └─ Example: "brand"

category (text input)
  └─ Example: "weekend-boost"

═══════════════════════════════════════════════════════════════════════════════
                      SECTION 2: SCHEDULE (Optional)
═══════════════════════════════════════════════════════════════════════════════

schedule.from (datetime or date)
  └─ Example: "22-12-2025 00:00"

schedule.to (datetime or date)
  └─ Example: "29-12-2025 23:59"

═══════════════════════════════════════════════════════════════════════════════
                    SECTION 3: TRIGGER CONDITIONS
═══════════════════════════════════════════════════════════════════════════════

trigger.minimumAmount (number)
  └─ Example: 10
  └─ Meaning: Minimum amount to qualify for cashback

trigger.minimumLossAmount (number)
  └─ Example: 50
  └─ Meaning: Minimum loss amount to trigger cashback

═══════════════════════════════════════════════════════════════════════════════
                      SECTION 4: REWARD CONFIG
═══════════════════════════════════════════════════════════════════════════════

config.percentage (number)
  └─ Example: 10
  └─ Meaning: 10% cashback on losses

config.maximumCashback (grid by currency)
  └─ Example: {"EUR": 100, "GBP": 100, "USD": 100, "NOK": 1000, ...}
  └─ Meaning: Max cashback amount per currency

config.maximumWithdraw (grid by currency)
  └─ Example: {"EUR": 500, "GBP": 500, "USD": 500, "NOK": 5000, ...}
  └─ Meaning: Max withdraw amount per currency

config.withdrawActive (toggle: true/false)
  └─ Example: true
  └─ Meaning: Can withdraw the cashback or not

═══════════════════════════════════════════════════════════════════════════════
                    SECTION 5: RESTRICTIONS
═══════════════════════════════════════════════════════════════════════════════

config.restrictedCountries (multi-select array)
  └─ Example: ["US", "UK", "FR", "NL"]
  └─ Meaning: Countries where this bonus is NOT available

═══════════════════════════════════════════════════════════════════════════════
                      FIELDS THAT ARE AUTO/IGNORED
═══════════════════════════════════════════════════════════════════════════════

config.cost (IGNORED - always 0)
config.multiplier (IGNORED - always 0)
config.maximumBets (IGNORED - always 0)
config.type (HARDCODED - always "cashback")
id (AUTO-GENERATED)
created_at (AUTO - system timestamp)
updated_at (AUTO - system timestamp)

═══════════════════════════════════════════════════════════════════════════════
                    FORM FLOW FOR USER
═══════════════════════════════════════════════════════════════════════════════

1. Enter trigger.name (multilingual)
2. Choose trigger.duration (e.g., "1w", "7d", etc.)
3. Enter trigger.minimumAmount
4. Enter trigger.minimumLossAmount
5. (Optional) Enter schedule.from and schedule.to
6. Choose provider (dropdown)
7. Enter brand
8. Enter category
9. Enter config.percentage
10. Enter config.maximumCashback (grid with all currencies)
11. Enter config.maximumWithdraw (grid with all currencies)
12. Toggle config.withdrawActive
13. Select config.restrictedCountries

═══════════════════════════════════════════════════════════════════════════════

Is this correct? Should I proceed to build this form?
