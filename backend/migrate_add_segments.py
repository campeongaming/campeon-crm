"""
Migration script to add segments column to bonus_templates table if it doesn't exist
Run this once to update existing database schema
"""

import sqlite3
from pathlib import Path

db_path = Path(__file__).parent / "casino_crm.db"

if not db_path.exists():
    print("Database file not found. It will be created on next backend start.")
    exit(0)

try:
    conn = sqlite3.connect(str(db_path))
    cursor = conn.cursor()

    # Check if segments column already exists
    cursor.execute("PRAGMA table_info(bonus_templates)")
    columns = [col[1] for col in cursor.fetchall()]

    if 'segments' not in columns:
        print("Adding 'segments' column to bonus_templates table...")
        cursor.execute("""
            ALTER TABLE bonus_templates
            ADD COLUMN segments JSON DEFAULT '[]'
        """)
        conn.commit()
        print("✓ Successfully added 'segments' column!")
    else:
        print("✓ 'segments' column already exists, no changes needed.")

    # Check if restricted_countries column exists
    if 'restricted_countries' not in columns:
        print("Adding 'restricted_countries' column to bonus_templates table...")
        cursor.execute("""
            ALTER TABLE bonus_templates
            ADD COLUMN restricted_countries JSON DEFAULT '[]'
        """)
        conn.commit()
        print("✓ Successfully added 'restricted_countries' column!")
    else:
        print("✓ 'restricted_countries' column already exists.")

    conn.close()
    print("\n✓ Migration completed successfully!")

except Exception as e:
    print(f"❌ Error during migration: {e}")
    exit(1)
