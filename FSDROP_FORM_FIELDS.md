═══════════════════════════════════════════════════════════════════════════════
                    FSDROP (FREE SPINS DROP) FORM - ALL FIELDS
═══════════════════════════════════════════════════════════════════════════════

Extracted from: Drop 50 Free Spins.json

Key difference from WAGER: NO DEPOSIT NEEDED (trigger.minimumAmount does not exist)

═══════════════════════════════════════════════════════════════════════════════
                        SECTION 1: BASIC INFO
═══════════════════════════════════════════════════════════════════════════════

trigger.name (Multilingual - user input)
  └─ Example: {"*": "50 No Deposit FS on Olympus Wins with x5 wagering", ...}

trigger.duration (text input)
  └─ Example: "1d"

trigger.type (HARDCODED)
  └─ Always: "external"

provider (dropdown)
  └─ Example: "PRAGMATIC"

brand (text input)
  └─ Example: "PRAGMATIC"

category (text input)
  └─ Example: "games"

═══════════════════════════════════════════════════════════════════════════════
                      SECTION 2: SCHEDULE (Optional)
═══════════════════════════════════════════════════════════════════════════════

schedule.from (datetime or date)
  └─ Example: "28-11-2025 00:00"

schedule.to (datetime or date)
  └─ Example: "28-11-2025 23:59"

═══════════════════════════════════════════════════════════════════════════════
                    SECTION 3: FREE SPINS CONFIG
═══════════════════════════════════════════════════════════════════════════════

config.extra.game (text input - specific game)
  └─ Example: "Olympus Wins"

config.expiry (text input - duration)
  └─ Example: "1d"

config.maximumBets (grid by currency - NO DEPOSIT so might be lower)
  └─ Example: {"EUR": 50, "USD": 50, "CAD": 50, ...}

config.maximumWithdraw (grid by currency - with "cap" field)
  └─ Example: {"EUR": {"cap": 100}, "USD": {"cap": 100}, ...}

config.withdrawActive (HARDCODED - false for free spins)
  └─ Always: false

═══════════════════════════════════════════════════════════════════════════════
                      AUTO-POPULATED FROM ADMIN SETUP
═══════════════════════════════════════════════════════════════════════════════

config.cost (auto from PRAGMATIC/BETSOFT admin setup)
config.multiplier (auto - same as cost)

═══════════════════════════════════════════════════════════════════════════════
                      FIELDS THAT ARE AUTO/IGNORED
═══════════════════════════════════════════════════════════════════════════════

trigger.minimumAmount (NOT IN FSDROP - no deposit needed!)
config.type (HARDCODED - always "free_bet")
id (AUTO-GENERATED)
created_at (AUTO - system timestamp)
updated_at (AUTO - system timestamp)

═══════════════════════════════════════════════════════════════════════════════
                    FORM FLOW FOR USER
═══════════════════════════════════════════════════════════════════════════════

1. Enter trigger.name (multilingual)
2. Choose trigger.duration (e.g., "1d", "7d", etc.)
3. (Optional) Enter schedule.from and schedule.to
4. Choose provider (dropdown)
5. Enter brand
6. Enter category
7. Enter config.extra.game (specific game title)
8. Enter config.expiry (e.g., "1d")
9. Enter config.maximumBets (grid with all currencies)
10. Enter config.maximumWithdraw (grid with all currencies)

═══════════════════════════════════════════════════════════════════════════════

KEY DIFFERENCE FROM WAGER:
  - NO "free_spins_count" input (number of spins is implied in the name)
  - NO "cost_per_wager" (auto from provider)
  - NO "minimum_amount" (no deposit needed)
  - maximumBets typically lower (50 instead of 500)
  - Only game title and expiry needed

Should I proceed to build this form?
