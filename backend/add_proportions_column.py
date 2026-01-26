"""
Quick script to add proportions column to existing bonus_templates table
without deleting the database.
"""
import sqlite3
from pathlib import Path

db_path = Path(__file__).parent / "casino_crm.db"

if not db_path.exists():
    print(f"❌ Database not found at {db_path}")
    exit(1)

try:
    conn = sqlite3.connect(str(db_path))
    cursor = conn.cursor()

    # Check if proportions column already exists
    cursor.execute("PRAGMA table_info(bonus_templates)")
    columns = [col[1] for col in cursor.fetchall()]

    if "proportions" in columns:
        print("✅ proportions column already exists")
    else:
        print("Adding proportions column to bonus_templates...")
        cursor.execute("""
            ALTER TABLE bonus_templates
            ADD COLUMN proportions JSON DEFAULT NULL
        """)
        conn.commit()
        print("✅ proportions column added successfully")

    conn.close()
    print("✅ Migration complete - database is ready")

except sqlite3.OperationalError as e:
    print(f"❌ Database error: {e}")
    exit(1)
except Exception as e:
    print(f"❌ Error: {e}")
    exit(1)
