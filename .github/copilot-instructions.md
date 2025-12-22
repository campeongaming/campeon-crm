# Copilot Instructions - CAMPEON CRM

## 🏗️ Architecture Overview

**CAMPEON CRM** is a collaborative casino bonus management system with dual-stack architecture:

- **Frontend**: Next.js 14 (React 18, TypeScript, Tailwind CSS) on port 3001
- **Backend**: FastAPI + SQLAlchemy + SQLite on port 8000
- **Core Domain**: Bonus template creation, translation management, and JSON schema generation

### Key Design Decisions

1. **7 Bonus Types**: DEPOSIT, RELOAD, FSDROP, WAGER, SEQ, COMBO, CASHBACK with auto-ID generation patterns
2. **Multilingual JSON Storage**: All dynamic text stored as `{"*": "default", "en": "...", "de": "..."}` dictionaries
3. **Multi-Currency Pricing Tables**: Stored as structured JSON arrays in database with 21+ supported currencies
4. **Optional Schedules**: Bonuses don't require schedule dates—only included in payload if both `schedule_from` and `schedule_to` are filled
5. **Tab-Based UI**: Single page (`src/app/page.tsx`) with 5 tabs instead of multiple routes

---

## 🔧 Critical Developer Workflows

### Start Development (Both Required)

```bash
# Terminal 1 - Frontend (auto-reloads)
cd c:\Users\GiorgosKorifidis\Downloads\CAMPEON CRM PROJECT
npm run dev  # Runs on localhost:3001 (port 3000 if available)

# Terminal 2 - Backend (auto-reloads with --reload flag)
cd backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Database Reset
```bash
# Delete SQLite file to recreate empty schema
rm backend/casino_crm.db
# Restart backend—schema auto-initializes via init_db() in lifespan event
```

### API Testing
- **Swagger UI**: http://localhost:8000/docs (auto-generated from FastAPI)
- **Test direct**: Use PowerShell `Invoke-WebRequest` with `-Uri` for Windows testing

---

## 📐 Project-Specific Patterns

### Frontend API Calls

**Always use `API_ENDPOINTS` from `src/lib/api-config.ts`**:
```typescript
import { API_ENDPOINTS } from '@/lib/api-config';
const response = await axios.get(`${API_ENDPOINTS.BASE_URL}/api/bonus-templates/dates/2025/12`);
```

Do NOT use relative URLs (`/api/...`) because Next.js dev server doesn't proxy to FastAPI.

### Optional Fields in Forms

When adding optional fields to bonus creation:
1. Make the input optional (remove `required` attribute)
2. **In frontend**: Only include field in payload if not empty
3. **In backend**: Mark Pydantic field as `Optional[type] = None`
4. **Example**: Schedule fields - only added to payload if both `schedule_from` AND `schedule_to` are provided

### Bonus ID Generation

- **Pattern**: Type-specific, deterministic format (e.g., `DEPOSIT_25_200_2025-12-22`)
- **Trigger**: Auto-generates in `BonusWizard.tsx` as user fills type-specific fields
- **Location**: `src/lib/bonusConfig.ts` contains all 7 types' `generateBonusId()` logic
- **Database**: Enforced as unique with conflict error if duplicate attempted

### Multi-Language JSON Fields

All text fields use structure:
```json
{
  "*": "English default",
  "en": "English",
  "de": "German",
  "fr": "French",
  "es": "Spanish",
  "it": "Italian",
  "pt": "Portuguese"
}
```

Store in database as JSON, render in UI with language selector.

---

## 🔗 Component Communication Patterns

### Bonus Creation Flow
1. **BonusWizard** (single-page form) → emits `onBonusCreated` event with generated ID
2. **SimpleBonusForm** receives event → auto-fills the ID field
3. User submits → POST to `/api/bonus-templates`
4. Success → BonusBrowser can now browse/search the newly created bonus

### CORS Configuration

- **Allowed Origins**: `http://localhost:3000`, `http://localhost:3001`, `http://localhost:8000`, `"*"`
- **Middleware**: Added in `backend/main.py` via `CORSMiddleware`
- **Port Mismatch Issue**: Frontend often runs on 3001 when 3000 is in use—always include both ports

### Date Filtering (SQLite-Specific)

- **Use `func.strftime()`**: `func.strftime('%Y-%m', BonusTemplate.created_at) == "2025-12"` (NOT `extract()`)
- **Reason**: SQLite doesn't support standard `extract()` function
- **File**: `backend/api/bonus_templates.py` line ~95

---

## 📁 Key Files & Their Responsibilities

| File | Purpose |
|------|---------|
| `src/app/page.tsx` | Main dashboard with 5 tabs (Admin, Create, Browse, Translation, Optimization) |
| `src/components/BonusWizard.tsx` | Single-page bonus builder with type-specific fields + auto-ID |
| `src/components/SimpleBonusForm.tsx` | Classic bonus form that receives ID from wizard |
| `src/components/BonusBrowser.tsx` | Search/browse bonuses by date/ID + delete functionality |
| `src/lib/bonusConfig.ts` | All 7 bonus types + ID generation patterns |
| `src/lib/api-config.ts` | API endpoint constants (use this for all axios calls) |
| `backend/api/bonus_templates.py` | Bonus CRUD endpoints + date filtering |
| `backend/api/schemas.py` | Pydantic models (mark schedule fields as `Optional`) |
| `backend/database/models.py` | SQLAlchemy ORM models (BonusTemplate, StableConfig, etc.) |

---

## 🚨 Common Issues & Fixes

| Issue | Solution |
|-------|----------|
| API returns 404 but endpoint exists | Check CORS - port 3001 not in allowed origins |
| Frontend uses relative URLs like `/api/...` | Use `${API_ENDPOINTS.BASE_URL}/api/...` instead |
| Schedule validation fails | Make `schedule_from` & `schedule_to` both `Optional` or both required together |
| Date filtering returns empty | Use SQLite `func.strftime()` not `extract()` |
| Port 3000 already in use | Frontend auto-falls back to 3001 |

---

## 💡 When Adding Features

1. **New Bonus Type**: Add to `BONUS_TYPES` in `bonusConfig.ts` + ID generation logic + conditional fields in `BonusWizard.tsx`
2. **New Optional Field**: Make `Optional` in Pydantic schema, exclude from payload if empty, mark label as "(Optional)" in UI
3. **New API Endpoint**: Add route in `backend/api/`, update `API_ENDPOINTS` in frontend, ensure CORS allows it
4. **Database Query**: Use `func.strftime()` for dates, `extract()` only if supporting PostgreSQL later

---

## 📝 Git Workflow

```bash
git add .
git commit -m "feat: description" # or "fix:", "docs:", "refactor:"
git push origin main
```

**Current Status**: Both frontend and backend auto-reload on file changes during development.
