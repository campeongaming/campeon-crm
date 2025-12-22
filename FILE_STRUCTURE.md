# Project Structure & File Locations

## 📂 Directory Tree

```
CAMPEON CRM PROJECT/
├── src/
│   ├── app/
│   │   ├── page.tsx                    ← Main page (shows components)
│   │   ├── layout.tsx                  ← App layout
│   │   └── globals.css                 ← Global styles
│   │
│   ├── components/
│   │   ├── BonusBrowser.tsx            ← Main component (with wizard button)
│   │   ├── BonusWizard.tsx             ✨ NEW - 2-step bonus creation
│   │   ├── AdminPanel.tsx              ← Pricing management
│   │   ├── CasinoTeamForm.tsx          ← Casino team panel
│   │   ├── TranslationTeam.tsx         ← Translation team panel
│   │   ├── OptimizationTeam.tsx        ← Optimization team panel
│   │   └── SimpleBonusForm.tsx         ← Simple form (legacy)
│   │
│   └── lib/
│       ├── bonusConfig.ts              ✨ NEW - ID generation & types
│       ├── currencies.ts               ← Currency definitions
│       ├── parser.ts                   ← Bonus parser logic
│       └── types.ts                    ← TypeScript types
│
├── backend/                            (Python FastAPI)
│   ├── main.py                         ← FastAPI app entry
│   ├── api/
│   │   ├── bonus_templates.py          ← Bonus endpoints
│   │   ├── admin.py                    ← Admin endpoints
│   │   └── schemas.py                  ← Pydantic schemas
│   ├── models/
│   │   └── bonus.py                    ← Database models
│   └── database.py                     ← SQLite setup
│
├── Documentation/                      ✨ NEW & UPDATED
│   ├── BONUS_WIZARD_GUIDE.md           ✨ NEW - Full wizard guide
│   ├── ID_FORMAT_REFERENCE.md          ✨ NEW - ID format cheatsheet
│   ├── SESSION_SUMMARY_22_12_25.md    ✨ NEW - Today's work summary
│   ├── ARCHITECTURE.md                 ← System architecture
│   ├── PROJECT_SUMMARY.md              ← Project overview
│   └── HOW_TO_RUN.txt                  ← Setup instructions
│
├── Config Files/
│   ├── package.json                    ← Frontend dependencies
│   ├── tsconfig.json                   ← TypeScript config
│   ├── next.config.js                  ← Next.js config
│   ├── tailwind.config.ts              ← Tailwind config
│   └── postcss.config.js               ← PostCSS config
│
└── External/
    └── JSON variants/
        ├── Combo 1.json                ← Reload bonus example
        ├── Combo 2.json                ← FS combo example
        ├── Sequential 1.json           ← Stage 1 bonus
        ├── Sequential 2.json           ← Stage 2 bonus
        ├── Deposit 25 Get up to FS.json ← Deposit with FS
        ├── Drop 50 Free Spins.json     ← No-deposit FS
        ├── Reload bonus up to.json     ← Reload bonus
        ├── Wager 200Eur and get 500 Free Spins.json
        └── Cashback 10 Percent.json    ✨ NEW - Cashback example
```

---

## 🎯 Key New Files

### 1. [src/lib/bonusConfig.ts](src/lib/bonusConfig.ts)
**Purpose:** Bonus type definitions and ID generation
**Size:** 137 lines
**Key Functions:**
- `generateBonusId(type, params, date)` - Creates IDs from specs
- `parseBonusId(id)` - Reverse-engineers ID
- `formatDate(date)` - DD.MM.YY formatter
- `BONUS_TYPES` - Configuration for all 6 bonus types

**Usage:**
```typescript
import { generateBonusId, BONUS_TYPES } from '@/lib/bonusConfig';

// Generate ID
const id = generateBonusId('DEPOSIT', { minimumAmount: 25, percentage: 100 });
// → "DEPOSIT_25_100_22.12.25"

// List all types
Object.keys(BONUS_TYPES); // ['DEPOSIT', 'RELOAD', 'FSDROP', 'WAGER', 'SEQ', 'COMBO']
```

### 2. [src/components/BonusWizard.tsx](src/components/BonusWizard.tsx)
**Purpose:** Interactive 2-step bonus creation form
**Size:** 330 lines
**Features:**
- Step 1: Visual type selector
- Step 2: Dynamic configuration form
- Live ID generation
- Validation
- Callback on completion

**Props:**
```typescript
interface BonusWizardProps {
    onBonusCreated?: (bonusData: any) => void;  // Called when done
    onCancel?: () => void;                       // Called on cancel
}
```

**Usage:**
```tsx
import BonusWizard from '@/components/BonusWizard';

<BonusWizard
    onBonusCreated={(bonus) => console.log('Created:', bonus)}
    onCancel={() => setShowWizard(false)}
/>
```

### 3. [src/components/BonusBrowser.tsx](src/components/BonusBrowser.tsx) (UPDATED)
**Changes Made:**
- Added import: `import BonusWizard from './BonusWizard';`
- Added state: `const [showWizard, setShowWizard] = useState(false);`
- Added handler: `handleBonusCreated(bonusData)`
- Added button: "✨ Create New Bonus" in header
- Added conditional render: Shows wizard when `showWizard === true`

### 4. [BONUS_WIZARD_GUIDE.md](BONUS_WIZARD_GUIDE.md)
**Purpose:** Complete implementation documentation
**Sections:**
- Overview of what was built
- Bonus type specifications
- ID format examples
- Step-by-step usage
- Field descriptions
- Next phases
- Technical details

### 5. [ID_FORMAT_REFERENCE.md](ID_FORMAT_REFERENCE.md)
**Purpose:** Quick reference for all ID formats
**Sections:**
- Cheat sheet for each type
- Decision tree for choosing types
- Examples from your JSON files
- Validation rules
- Real-world scenarios
- API integration preview

### 6. [SESSION_SUMMARY_22_12_25.md](SESSION_SUMMARY_22_12_25.md)
**Purpose:** Today's work summary
**Sections:**
- What was built
- How to test
- ID formats table
- Architecture overview
- Next steps by phase
- Quick start commands

### 7. [JSON variants/Cashback 10 Percent.json](../JSON%20variants/Cashback%2010%20Percent.json)
**Purpose:** 7th example bonus type
**Features:**
- Complete JSON structure
- Multi-currency (21 currencies)
- Multi-language support (6 languages)
- Cashback bonus type
- Schedule/period config
- Country restrictions

---

## 🔗 Relationships

### Import Chain:
```
BonusBrowser.tsx
    ↓ imports
BonusWizard.tsx
    ↓ imports
bonusConfig.ts
    ├─ BONUS_TYPES
    ├─ generateBonusId()
    └─ parseBonusId()
```

### Component Flow:
```
User clicks "✨ Create New Bonus"
    ↓
BonusBrowser.tsx: setShowWizard(true)
    ↓
Renders BonusWizard component
    ├─ Step 1: User selects type
    │   ├─ Type added to BONUS_TYPES config
    │   └─ Clicked → setStep('config')
    │
    ├─ Step 2: User fills fields
    │   ├─ onChange → handleInputChange()
    │   ├─ Checks shouldGenerateId()
    │   ├─ Calls generateBonusId() from bonusConfig.ts
    │   └─ ID displays in green box
    │
    └─ Click "Create Bonus"
        ├─ Calls onBonusCreated() callback
        ├─ BonusBrowser: handleBonusCreated()
        ├─ setShowWizard(false)
        └─ Returns to browser
```

---

## 📊 File Statistics

| File | Lines | Purpose |
|------|-------|---------|
| bonusConfig.ts | 137 | ID generation + types |
| BonusWizard.tsx | 330 | Wizard component |
| BonusBrowser.tsx | 508 | Browser + integration |
| BONUS_WIZARD_GUIDE.md | 300+ | Implementation guide |
| ID_FORMAT_REFERENCE.md | 250+ | ID cheatsheet |
| SESSION_SUMMARY_22_12_25.md | 350+ | Work summary |

**Total New Code:** ~1,200 lines (mostly docs)
**Total Modified Code:** ~50 lines (BonusBrowser updates)
**Total Documentation:** ~900 lines

---

## 🚀 How to Navigate

### For Understanding the System:
1. **Start:** [ID_FORMAT_REFERENCE.md](ID_FORMAT_REFERENCE.md) - See all ID formats
2. **Then:** [BONUS_WIZARD_GUIDE.md](BONUS_WIZARD_GUIDE.md) - Understand the wizard
3. **Then:** [SESSION_SUMMARY_22_12_25.md](SESSION_SUMMARY_22_12_25.md) - See what was built

### For Code Implementation:
1. **Config:** [src/lib/bonusConfig.ts](src/lib/bonusConfig.ts) - Core logic
2. **UI:** [src/components/BonusWizard.tsx](src/components/BonusWizard.tsx) - User interface
3. **Integration:** [src/components/BonusBrowser.tsx](src/components/BonusBrowser.tsx) - Connected component

### For Testing:
1. Start: `npm run dev`
2. Visit: http://localhost:3000
3. Click: "✨ Create New Bonus"
4. Test: Create a bonus

---

## 🎯 Important Paths

```
Frontend:
  Config System:        src/lib/bonusConfig.ts
  Wizard Component:     src/components/BonusWizard.tsx
  Browser Component:    src/components/BonusBrowser.tsx

Backend (FastAPI):
  Main App:            backend/main.py
  Bonus Routes:        backend/api/bonus_templates.py
  Database:            backend/database.py

Documentation:
  Wizard Guide:        BONUS_WIZARD_GUIDE.md
  ID Reference:        ID_FORMAT_REFERENCE.md
  Session Summary:     SESSION_SUMMARY_22_12_25.md
  Architecture:        ARCHITECTURE.md

Examples:
  JSON Bonuses:        ../JSON variants/
```

---

## 🔄 Data Flow: Creating a Bonus

```
1. User Interface
   └─ Click "✨ Create New Bonus"

2. State Management (BonusBrowser.tsx)
   └─ setShowWizard(true)

3. Render Wizard (BonusWizard.tsx)
   └─ Step 1: Type Selection (visual cards)
   └─ Step 2: Configuration (form fields)

4. Live ID Generation (bonusConfig.ts)
   └─ User types → handleInputChange()
   └─ Check required fields → shouldGenerateId()
   └─ Call generateBonusId() → returns ID
   └─ Display ID in green box

5. Completion
   └─ User clicks "Create Bonus"
   └─ Call onBonusCreated() callback
   └─ Return to browser

6. Backend Integration (Coming Soon)
   └─ POST /api/bonus-templates
   └─ Save to SQLite
   └─ Return to list
```

---

## 📋 Checklist: Is Everything in Place?

- [x] bonusConfig.ts with ID generation logic
- [x] BonusWizard.tsx component with 2-step form
- [x] BonusBrowser.tsx with wizard integration
- [x] "Create New Bonus" button in header
- [x] BONUS_WIZARD_GUIDE.md documentation
- [x] ID_FORMAT_REFERENCE.md cheatsheet
- [x] SESSION_SUMMARY_22_12_25.md summary
- [x] Cashback 10 Percent.json example
- [x] All imports working correctly
- [x] No TypeScript errors

**Status: ✅ ALL READY FOR TESTING**

---

**Last Updated:** December 22, 2025
**Location:** CAMPEON CRM PROJECT root
