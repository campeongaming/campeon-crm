#!/usr/bin/env python
import sqlite3
import json

conn = sqlite3.connect('casino_crm.db')
cursor = conn.cursor()

print("=" * 120)
print("BONUS TEMPLATES TABLE")
print("=" * 120)

# Get column names for bonus_template
cursor.execute("PRAGMA table_info(bonus_template)")
columns_info = cursor.fetchall()
columns = [col[1] for col in columns_info]

# Display limited columns for readability
display_cols = ['id', 'bonus_type', 'provider', 'cost', 'created_at']
col_indices = [columns.index(col) for col in display_cols if col in columns]

# Get data
cursor.execute(
    f"SELECT {', '.join(display_cols)} FROM bonus_template LIMIT 10")
rows = cursor.fetchall()

if rows:
    for row in rows:
        print(f"ID: {row[0]}")
        print(f"  Type: {row[1]}")
        print(f"  Provider: {row[2]}")
        if row[3]:  # cost
            cost_data = json.loads(row[3]) if isinstance(
                row[3], str) else row[3]
            print(f"  Cost: {cost_data}")
        print(f"  Created: {row[4]}")
        print()
else:
    print("No bonus templates found\n")

print("=" * 120)
print("STABLE CONFIG TABLE (Admin Settings)")
print("=" * 120)

cursor.execute(
    "SELECT id, provider, created_at, updated_at FROM stable_config")
rows = cursor.fetchall()

if rows:
    for row in rows:
        print(
            f"ID: {row[0]} | Provider: {row[1]} | Created: {row[2]} | Updated: {row[3]}")

        # Show cost tables detail
        cursor.execute(
            "SELECT cost FROM stable_config WHERE provider = ?", (row[1],))
        cost_data = cursor.fetchone()
        if cost_data and cost_data[0]:
            try:
                cost_tables = json.loads(cost_data[0]) if isinstance(
                    cost_data[0], str) else cost_data[0]
                print(f"\n  Cost Tables ({len(cost_tables)} tables):")
                for table in cost_tables:
                    print(f"    └─ {table['name']} (ID: {table['id']})")
                    # Show all currency values
                    for curr, val in sorted(table['values'].items()):
                        print(f"       {curr}: {val}")
                    print()
            except Exception as e:
                print(f"  Error parsing cost data: {e}\n")
else:
    print("No stable config found\n")

conn.close()
print("=" * 120)
