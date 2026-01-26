#!/usr/bin/env python3
"""
Migration script to add currency_unit column to stable_configs table
"""
import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), 'casino_crm.db')

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Check if column already exists
    cursor.execute("PRAGMA table_info(stable_configs)")
    columns = [column[1] for column in cursor.fetchall()]

    if 'currency_unit' in columns:
        print("✅ currency_unit column already exists")
    else:
        print("🔄 Adding currency_unit column...")
        cursor.execute(
            'ALTER TABLE stable_configs ADD COLUMN currency_unit JSON DEFAULT "[]"')
        conn.commit()
        print("✅ currency_unit column added successfully!")

    conn.close()
except Exception as e:
    print(f"❌ Error: {e}")
