# Stable Config API Documentation

## Overview
The Stable Config API allows you to save and retrieve provider-specific pricing configurations (pricing tables) for PRAGMATIC and BETSOFT providers.

## Endpoints

### 1. Save/Update Stable Config
**POST** `/api/stable-config`

Saves or updates the stable configuration for a provider. If the configuration doesn't exist, it's created. If it exists, it's updated.

**Request Body:**
```json
{
  "provider": "PRAGMATIC",
  "cost": [
    {
      "id": "1",
      "name": "Table 1",
      "values": {
        "EUR": 0.2,
        "USD": 0.25,
        "GBP": 0.18
      }
    },
    {
      "id": "2",
      "name": "Table 2",
      "values": {
        "EUR": 0.25,
        "USD": 0.3
      }
    }
  ],
  "maximum_amount": [...],
  "minimum_amount": [...],
  "minimum_stake_to_wager": [...],
  "maximum_stake_to_wager": [...],
  "maximum_withdraw": [...]
}
```

**Response (200 OK):**
```json
{
  "id": 1,
  "provider": "PRAGMATIC",
  "cost": [...],
  "maximum_amount": [...],
  "minimum_amount": [...],
  "minimum_stake_to_wager": [...],
  "maximum_stake_to_wager": [...],
  "maximum_withdraw": [...],
  "created_at": "2025-12-12T15:30:00",
  "updated_at": "2025-12-12T15:30:00"
}
```

**Error Response (500):**
```json
{
  "detail": "Error saving config: [error message]"
}
```

---

### 2. Get Config by Provider
**GET** `/api/stable-config/{provider}`

Retrieves the stable configuration for a specific provider.

**Parameters:**
- `provider` (path): Provider name (e.g., "PRAGMATIC", "BETSOFT")

**Response (200 OK):**
```json
{
  "id": 1,
  "provider": "PRAGMATIC",
  "cost": [...],
  "created_at": "2025-12-12T15:30:00",
  "updated_at": "2025-12-12T15:30:00"
}
```

**Error Response (404):**
```json
{
  "detail": "Config not found for provider: PRAGMATIC"
}
```

---

### 3. Get All Configs
**GET** `/api/stable-config`

Retrieves all stable configurations for all providers.

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "provider": "PRAGMATIC",
    "cost": [...],
    "created_at": "2025-12-12T15:30:00",
    "updated_at": "2025-12-12T15:30:00"
  },
  {
    "id": 2,
    "provider": "BETSOFT",
    "cost": [...],
    "created_at": "2025-12-12T15:35:00",
    "updated_at": "2025-12-12T15:35:00"
  }
]
```

---

## Data Structure

### CurrencyTable
Each pricing table is a CurrencyTable object with:

```typescript
interface CurrencyTable {
  id: string;           // Unique ID per table
  name: string;         // Display name (e.g., "Table 1", "Table 2")
  values: Record<string, number>;  // Currency-specific values
}
```

**Example:**
```json
{
  "id": "1",
  "name": "Table 1",
  "values": {
    "EUR": 0.2,
    "USD": 0.22,
    "GBP": 0.18,
    "AUD": 0.35,
    "CAD": 0.30
  }
}
```

### Configuration Fields
The StableConfig contains 6 fields, each holding an array of CurrencyTables:

1. **cost** - Cost per player (what you pay for each player)
2. **maximum_amount** - Maximum bonus amount per currency
3. **minimum_amount** - Minimum bonus amount per currency
4. **minimum_stake_to_wager** - Minimum bet amount allowed
5. **maximum_stake_to_wager** - Maximum bet amount allowed
6. **maximum_withdraw** - Maximum withdrawal amount from bonus

---

## Integration with Frontend

### From AdminPanel.tsx:

The frontend AdminPanel component sends this data structure to save configurations:

```typescript
interface StableConfigWithVariations {
  provider: string;  // "PRAGMATIC" or "BETSOFT"
  cost: CurrencyTable[];
  maximum_amount: CurrencyTable[];
  minimum_amount: CurrencyTable[];
  minimum_stake_to_wager: CurrencyTable[];
  maximum_stake_to_wager: CurrencyTable[];
  maximum_withdraw: CurrencyTable[];
}
```

**Save function:**
```typescript
const handleSave = async () => {
  setLoading(true);
  try {
    await axios.post(`${API_ENDPOINTS.BASE_URL}/api/stable-config`, config);
    setMessage(`✅ ${selectedProvider} stable values saved successfully!`);
  } catch (error: any) {
    setMessage(`❌ Error: ${error.response?.data?.detail || error.message}`);
  } finally {
    setLoading(false);
  }
};
```

---

## Database Schema

### stable_configs table
```sql
CREATE TABLE stable_configs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  provider VARCHAR(50) NOT NULL INDEX,
  cost JSON DEFAULT '[]',
  maximum_amount JSON DEFAULT '[]',
  minimum_amount JSON DEFAULT '[]',
  minimum_stake_to_wager JSON DEFAULT '[]',
  maximum_stake_to_wager JSON DEFAULT '[]',
  maximum_withdraw JSON DEFAULT '[]',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

---

## Workflow

### 1. User Sets Pricing Tables in Admin Panel
- User selects provider (PRAGMATIC/BETSOFT)
- User selects configuration type (Cost, Amounts, Stakes, Withdrawals)
- User adds/removes pricing tables
- User adds/removes currencies per table
- User modifies currency values

### 2. User Clicks Save
```
POST /api/stable-config
{
  provider: "PRAGMATIC",
  cost: [...],
  maximum_amount: [...],
  ...
}
```

### 3. Backend Saves to Database
- Check if config exists for provider
- If exists: UPDATE all fields
- If not exists: INSERT new record
- Return updated/created config

### 4. Frontend Shows Success Message
```
✅ PRAGMATIC stable values saved successfully!
```

---

## Error Handling

### Validation
- Provider field is required
- At least one of the 6 config fields should be provided (or empty array)

### Database Errors
All database errors return:
```json
{
  "detail": "Error saving config: [detailed error message]"
}
```

---

## Testing with cURL

### Save Config
```bash
curl -X POST http://localhost:8000/api/stable-config \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "PRAGMATIC",
    "cost": [
      {
        "id": "1",
        "name": "Table 1",
        "values": {"EUR": 0.2, "USD": 0.25}
      }
    ],
    "maximum_amount": [],
    "minimum_amount": [],
    "minimum_stake_to_wager": [],
    "maximum_stake_to_wager": [],
    "maximum_withdraw": []
  }'
```

### Get Config
```bash
curl http://localhost:8000/api/stable-config/PRAGMATIC
```

### Get All Configs
```bash
curl http://localhost:8000/api/stable-config
```

---

## Future Enhancements

1. **Load Existing Config on PageLoad**
   - Fetch config when AdminPanel mounts
   - Pre-populate form with saved values

2. **Validation Rules**
   - Ensure values are positive numbers
   - Ensure EUR value exists in at least first table
   - Validate minimum < maximum for amount fields

3. **Audit Trail**
   - Track who saved each config
   - Track when configs were modified
   - Allow version history/rollback

4. **Template Copying**
   - Copy config from one provider to another
   - Save as preset/template
   - Quick load previous configurations
