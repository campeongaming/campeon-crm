═══════════════════════════════════════════════════════════════════════════════
                        BONUS WORKFLOW DIAGRAMS
═══════════════════════════════════════════════════════════════════════════════

═══════════════════════════════════════════════════════════════════════════════
                      TIER 1: PRIMARY BONUSES
═══════════════════════════════════════════════════════════════════════════════

DEPOSIT BONUS WORKFLOW:
──────────────────────

┌─────────────┐
│  NEW PLAYER │
└──────┬──────┘
       │
       ↓
   TRIGGERS DEPOSIT BONUS
   ┌─────────────────────────────────────────┐
   │ Player deposits €25                     │
   │ Bonus: Deposit €25 → Get 100% bonus     │
   │ Reward: €25 (bonus cash)                │
   │ Wagering: €25 × 15 = €375 to clear      │
   └──────────────────────┬──────────────────┘
                          │
                          ↓
                  FREE SPINS AWARDED
                  ┌──────────────────┐
                  │ +2500 Free Spins │
                  │ Game: Big Bass   │
                  │ Expiry: 7 days   │
                  └────────┬─────────┘
                           │
                           ↓
                   PLAYER PLAYS GAMES
                   ├─ Use deposit money
                   ├─ Wager requirement
                   ├─ Bonus clears
                   └─ Can withdraw

RELOAD BONUS WORKFLOW:
──────────────────────

┌─────────────────┐
│ EXISTING PLAYER │
│ (Already played)│
└────────┬────────┘
         │
         ↓
    TRIGGERS RELOAD BONUS
    ┌──────────────────────────────────────┐
    │ Player deposits €100 (2nd time)      │
    │ Bonus: Deposit €100 → Get 150% bonus │
    │ Reward: €150 (bonus cash)            │
    │ Wagering: €250 × 20 = €5000 to clear │
    └─────────────────┬────────────────────┘
                      │
                      ↓
              NO ADDITIONAL FREE SPINS
              (Usually just cash bonus)
                      │
                      ↓
                PLAYER PLAYS GAMES


═══════════════════════════════════════════════════════════════════════════════
                      TIER 2: SECONDARY BONUSES
═══════════════════════════════════════════════════════════════════════════════

WAGER BONUS WORKFLOW:
─────────────────────

┌──────────────┐
│ ACTIVE PLAYER│
│ (Playing now)│
└──────┬───────┘
       │
       ↓
   TRIGGERS BY WAGERING
   ┌─────────────────────────────────────────┐
   │ Player wagers €200 in casino games      │
   │ Bonus: Wager €200 → Get 500 FS          │
   │ Reward: 500 Free Spins                  │
   │ Game: Sweet Rush Bonanza                │
   │ Wagering: 500 FS × 0.2 value × 10x      │
   └──────────────────────┬──────────────────┘
                          │
                          ↓
                  500 FREE SPINS CREDITED
                  ┌──────────────────────┐
                  │ 500 FS in Sweet Rush │
                  │ Expiry: 7 days       │
                  └────────┬─────────────┘
                           │
                           ↓
                   PLAYER PLAYS FS
                   └─ Separate wagering
                      requirement

FSDROP BONUS WORKFLOW:
──────────────────────

┌──────────────┐
│ ANY PLAYER   │
│ (No action)  │
└──────┬───────┘
       │
       ↓
   TRIGGERS AUTOMATICALLY
   ┌─────────────────────────────────────┐
   │ Seasonal promotion (Black Friday)    │
   │ NO DEPOSIT REQUIRED                  │
   │ Bonus: Get 50 FS automatically       │
   │ Game: Olympus Wins                   │
   │ Wagering: 50 FS × 0.2 value × 5x     │
   └──────────┬──────────────────────────┘
              │
              ↓
      50 FREE SPINS CREDITED
      ┌─────────────────────┐
      │ 50 FS in Olympus    │
      │ Expiry: 1-2 days    │
      │ Limited quantity    │
      └────────┬────────────┘
               │
               ↓
       PLAYER PLAYS FS


CASHBACK BONUS WORKFLOW:
────────────────────────

┌──────────────┐
│ ACTIVE PLAYER│
│ (Playing now)│
└──────┬───────┘
       │
       ↓
   TRIGGERS ON LOSSES
   ┌──────────────────────────────────────┐
   │ Player loses €100 in games           │
   │ Bonus: 10% Cashback on losses        │
   │ Reward: €10 cashback                 │
   │ Max Cashback: €100 per week          │
   │ Min Loss to Trigger: €50             │
   └──────────────┬───────────────────────┘
                  │
                  ↓
          €10 CASHBACK CREDITED
          ┌────────────────────┐
          │ €10 balance credit  │
          │ Usuable immediately │
          │ No wagering on CB   │
          └────────┬───────────┘
                   │
                   ↓
           PLAYER HAS MORE BALANCE
           └─ Can play again or withdraw


═══════════════════════════════════════════════════════════════════════════════
                      TIER 3: COMPLEX BONUSES
═══════════════════════════════════════════════════════════════════════════════

SEQUENTIAL BONUS WORKFLOW:
──────────────────────────

┌─────────────┐
│  NEW PLAYER │
└──────┬──────┘
       │
       ↓
  STAGE 1 - TRIGGERED BY DEPOSIT
  ┌───────────────────────────────────────┐
  │ Deposit €500                          │
  │ STAGE 1: 100% bonus up to €500        │
  │ Reward: €500 bonus + 200 FS           │
  │ Must wager €500 × 15 = €7500          │
  │ Must complete stage 1 first           │
  └───────────────────┬───────────────────┘
                      │
                      ↓
          STAGE 1 REQUIREMENTS MET
          (Wager completed)
          ┌─────────────────────────────┐
          │ Unlock STAGE 2 automatically │
          └────────────┬────────────────┘
                       │
                       ↓
       STAGE 2 - TRIGGERED BY STAGE 1 COMPLETION
       ┌──────────────────────────────────────┐
       │ STAGE 2: 150% bonus up to €300       │
       │ Reward: €300 bonus + 100 FS          │
       │ Requirement: Must deposit another €200 │
       │ Wager: €500 × 20 = €10000            │
       └──────────────┬───────────────────────┘
                      │
                      ↓
           STAGE 2 COMPLETED
           ┌──────────────────────┐
           │ Unlock STAGE 3       │
           └────────┬─────────────┘
                    │
                    ↓
       STAGE 3 - TRIGGERED BY STAGE 2 COMPLETION
       ┌──────────────────────────────┐
       │ STAGE 3: 200% up to €250     │
       │ Final reward: €250 + 50 FS   │
       │ Wager: €500 × 15 = €7500     │
       └──────────┬───────────────────┘
                  │
                  ↓
          ALL STAGES COMPLETE
          ├─ Total received: €1050 bonus
          ├─ Total received: 350 FS
          └─ Total wager required: €25000


COMBO BONUS WORKFLOW:
─────────────────────

┌──────────────────┐
│  PLAYER A        │
│ (No deposit yet) │
└────────┬─────────┘
         │
         ↓
  "WELCOME COMBO FOR NEW PLAYERS"
  ┌─────────────────────────────────────┐
  │ Bonus Package = Multiple bonuses    │
  │ together in ONE offer               │
  │                                     │
  │ PART 1: 100% DEPOSIT BONUS          │
  │   ├─ Deposit €25                    │
  │   └─ Get €25 + 200 FS               │
  │                                     │
  │ PART 2: 150% RELOAD BONUS           │
  │   ├─ (Available after deposit 1)    │
  │   └─ Deposit another €50 → €75      │
  │                                     │
  │ PART 3: WAGER BONUS                 │
  │   ├─ (If you wager €200)            │
  │   └─ Get 500 FS                     │
  └────────┬─────────────────────────────┘
           │
           ↓
   PLAYER TRIGGERS PART 1
   ┌───────────────────────┐
   │ Deposits €25          │
   │ Receives: €25 + 200FS │
   └────────┬──────────────┘
            │
            ↓
   PART 2 BECOMES AVAILABLE
   ┌────────────────────────┐
   │ Player can deposit €50 │
   │ Receives: €75 + 0 FS   │
   └────────┬───────────────┘
            │
            ↓
   PLAYER PLAYS & WAGERS €200
   ┌────────────────────────┐
   │ Part 3 triggers        │
   │ Receives: 500 FS       │
   └────────┬───────────────┘
            │
            ↓
   COMPLETE COMBO PACKAGE
   ├─ Total bonus: €100
   └─ Total FS: 700


═══════════════════════════════════════════════════════════════════════════════
                    TRIGGER VS REWARD COMPARISON
═══════════════════════════════════════════════════════════════════════════════

Bonus Type      │ TRIGGER              │ REWARD              │ Auto/Manual
────────────────┼──────────────────────┼─────────────────────┼─────────────
DEPOSIT         │ Make deposit €25+    │ Cash %              │ Automatic
RELOAD          │ Make deposit €100+   │ Cash %              │ Automatic
WAGER           │ Play & wager €200+   │ Free Spins          │ Automatic
FSDROP          │ Calendar date        │ Free Spins          │ Automatic
CASHBACK        │ Lose €50+            │ Cash %              │ Automatic
SEQUENTIAL      │ Complete Stage 1     │ Stage 2 unlock      │ Automatic
COMBO           │ Mix of above         │ Multiple            │ Automatic


═══════════════════════════════════════════════════════════════════════════════
                      DATA STRUCTURE BY TIER
═══════════════════════════════════════════════════════════════════════════════

TIER 1 (SIMPLE - DEPOSIT/RELOAD):
──────────────────────────────────
config: {
  percentage: 100,
  wagering_multiplier: 15,
  minimum_amount: 25,
  cost: 0.2
}

TIER 2 (MEDIUM - WAGER/FSDROP/CASHBACK):
─────────────────────────────────────────
config: {
  // WAGER & FSDROP
  free_spins: 500,
  game_title: "Sweet Rush",
  cost_per_wager: { EUR: 0.2, USD: 0.2, ... },
  wager_amount: { EUR: 200, USD: 200, ... },
  
  // CASHBACK
  percentage: 10,
  minimum_loss: 50,
  maximum_cashback: { EUR: 100, USD: 100, ... }
}

TIER 3 (COMPLEX - SEQUENTIAL/COMBO):
────────────────────────────────────
config: {
  // SEQUENTIAL
  stages: [
    { stage: 1, percentage: 100, max: 500, fs: 200, wager: 15 },
    { stage: 2, percentage: 150, max: 300, fs: 100, wager: 20 },
    { stage: 3, percentage: 200, max: 250, fs: 50, wager: 15 }
  ],
  
  // COMBO
  bonuses: [
    { id: "DEPOSIT_1", type: "deposit", ... },
    { id: "RELOAD_1", type: "reload", ... },
    { id: "FSDROP_1", type: "fsdrop", ... }
  ],
  relationships: [
    { primary: "DEPOSIT_1", secondary: "RELOAD_1", unlock: "after" }
  ]
}


═══════════════════════════════════════════════════════════════════════════════
                   IMPLEMENTATION ROADMAP
═══════════════════════════════════════════════════════════════════════════════

NOW (DONE ✅):
  TIER 1: DEPOSIT, RELOAD, WAGER

THIS WEEK:
  TIER 2: FSDROP, CASHBACK
  ├─ Day 1: FSDROP (30-45 mins)
  └─ Day 1-2: CASHBACK (45-60 mins)

NEXT WEEK:
  TIER 3: SEQUENTIAL, COMBO
  ├─ 60-90 mins: SEQUENTIAL
  └─ 60-90 mins: COMBO


═══════════════════════════════════════════════════════════════════════════════
