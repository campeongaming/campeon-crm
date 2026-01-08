# Copilot Instructions - CAMPEON CRM

## 🏗️ Architecture Overview

**CAMPEON CRM** is a collaborative casino bonus management system with dual-stack architecture:

- **Frontend**: Next.js 14 (React 18, TypeScript, Tailwind CSS) on port 3001
- **Backend**: FastAPI + SQLAlchemy + SQLite on port 8000
- **Core Domain**: Bonus template creation, pricing table management, and multi-currency JSON generation

### Key Design Decisions

1. **Admin-Driven Pricing**: All bonus pricing stored in `StableConfig` per provider (PRAGMATIC, BETSOFT)
   - Tables contain 21+ currencies with mapped values
   - Frontend searches tables by EUR value and loads ALL currency values
2. **Tab-Based Single Page**: `src/app/page.tsx` routes to 5 tabs (Admin, Create, Browse, Translation, Optimization)
3. **Multi-Currency Lookup Pattern**: Search pricing tables at JSON build time, NOT during form input
   - Use `Math.abs(table.values.EUR - inputValue) < 0.001` for floating-point tolerance
   - Always use table's EUR value for `"*"` (fallback) to avoid precision errors
4. **Multilingual JSON Storage**: `{"*": eurValue, "EUR": val, "USD": val, ...}` structure
5. **Optional Schedules**: Only included if both `schedule_from` AND `schedule_to` provided

---

## 🔧 Critical Developer Workflows

### Start Development (Both Terminals Required)

```bash
# Terminal 1 - Frontend
cd "C:\Users\GiorgosKorifidis\Downloads\CAMPEON CRM PROJECT"
npm run dev

# Terminal 2 - Backend
cd backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Database Reset
```bash
rm backend/casino_crm.db
# Restart backend - schema auto-initializes via init_db() in lifespan
```

### Common Testing
- **Swagger API Docs**: http://localhost:8000/docs
- **Admin Panel**: http://localhost:3000 or 3001
- **Query Admin Config**: `GET /api/stable-config/PRAGMATIC`

---

## 📐 Project-Specific Patterns

### Pricing Table Lookup (Critical Pattern)

When a user enters a cost value (e.g., EUR=0.12), find the matching table and load ALL currency values:

```typescript
const buildCurrencyMap = (eurValue: number, fieldName: 'cost' | 'minimum_amount' | 'maximum_withdraw') => {
  if (fieldName === 'cost' && adminConfig?.cost) {
    const tolerance = 0.001;
    for (const table of adminConfig.cost) {
      // IMPORTANT: Use Math.abs() for floating point safety
      if (Math.abs(table.values.EUR - eurValue) < tolerance) {
        // Use table's EUR for "*" to avoid precision errors like 0.09999
        return { '*': table.values.EUR, ...table.values };
      }
    }
  }
  // Fallback...
}
```

**Key Points**:
- ✅ Lookup happens at JSON build time (in `handleSave`), NOT during form input
- ✅ Use tolerance comparison for floating point numbers
- ✅ Always use `table.values.EUR` for the `"*"` fallback
- ❌ Don't use state/async for lookups - search inline at point of use

### Multi-Currency Structure

All numeric fields follow this pattern:

```json
{
  "*": 0.12,        // EUR value (fallback)
  "EUR": 0.12,
  "USD": 0.12,
  "GBP": 0.1,
  "NOK": 1.2,
  ...
}
```

Frontend maps: `CURRENCIES = ['EUR', 'USD', 'CAD', ..., 'UZS']` (21 total)

### API Contract for Pricing Tables

**GET /api/stable-config/{provider}** returns:

```json
{
  "provider": "PRAGMATIC",
  "cost": [
    { "id": "1", "name": "Table 1", "values": { "EUR": 0.1, "USD": 0.1, ... } },
    { "id": "2", "name": "Table 2", "values": { "EUR": 0.12, "USD": 0.12, ... } }
  ],
  "maximum_withdraw": [...],
  "minimum_amount": [...]
}
```

**Backend**: Tables are **arrays** of objects, NOT single objects. Always access with `[0]` or loop.

### AwardFreeSpins Component Flow

1. **User enters cost EUR**: 0.12 → Fetches admin config on mount
2. **User fills form fields**: Trigger name, game, etc.
3. **User submits**: `handleSave()` calls `buildCurrencyMap(0.12, 'cost')`
4. **Lookup executes**: Searches `adminConfig.cost` array for EUR ≈ 0.12 → finds Table 2
5. **JSON built**: Uses all 21 currency values from Table 2
6. **POST to /api/bonus-templates** with complete payload

### Database Schema Key Points

- **BonusTemplate.id**: String (primary key), human-readable title
- **JSON columns**: All multi-currency/multilingual data stored as JSON
  - `cost`, `multiplier`, `maximum_bets`, `maximum_withdraw`: `Dict[str, float]`
  - `trigger_name`, `trigger_description`: `Dict[str, str]` (localization)
  - `restricted_countries`: `List[str]`
- **StableConfig.cost/maximum_withdraw**: JSON arrays of `[{id, name, values: {currency: value}}]`

---

## 🚨 Common Pitfalls & Fixes

| Problem | Solution |
|---------|----------|
| Floating point: 0.1 stored as 0.09999... | Use `Math.abs(a - b) < 0.001` tolerance |
| `"*": 0.09999` in generated JSON | Use `table.values.EUR` for `"*"`, not input parameter |
| Missing currency values in JSON | Lookup at build time, not in async state update |
| Table not found warning | Check if `adminConfig` is loaded before `buildCurrencyMap` runs |
| POST returns incomplete data | GET endpoint now returns full object (was returning only 4 fields) |

---

## 🔗 Key Files Reference

| File | Purpose |
|------|---------|
| `src/app/page.tsx` | Tab router (Admin, Create, Browse, Translation, Optimization) |
| `src/components/AwardFreeSpins.tsx` | Free Spins form with pricing table lookup |
| `src/components/AdminPanel.tsx` | Manage pricing tables per provider |
| `backend/api/bonus_templates.py` | Bonus CRUD endpoints |
| `backend/database/models.py` | BonusTemplate & StableConfig schemas |
| `backend/api/schemas.py` | Pydantic models for API validation |

---

## 💡 When Adding Features

1. **New optional field**: Make `Optional` in Pydantic, exclude from payload if empty
2. **New pricing table field**: Add to `StableConfig` model, create migration
3. **New bonus type**: Add ID generation logic to `bonusConfig.ts`, update form UI
4. **New currency**: Add to `CURRENCIES` array in components, update admin pricing
5. **Multilingual text**: Use `Dict[str, str]` format with `"*"` + all locales

---

## 🧪 Testing Checklist

✅ Enter cost EUR=0.12 → Should find Table 2 with all 21 currencies  
✅ Enter cost EUR=0.4 → Should find Table 6  
✅ Generated JSON has exact table values, not defaults  
✅ `"*"` value = EUR value (e.g., 0.12, not 0.09999)  
✅ Both terminals running (frontend + backend)  
✅ Pricing table saves in Admin Panel before creating bonus

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
