#!/usr/bin/env python3
"""
Migration script to add users table
"""
import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), 'casino_crm.db')

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Check if table already exists
    cursor.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
    if cursor.fetchone():
        print("✅ users table already exists")
    else:
        print("🔄 Creating users table...")
        cursor.execute('''
            CREATE TABLE users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                role VARCHAR(20) NOT NULL DEFAULT 'admin',
                is_active BOOLEAN NOT NULL DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')

        # Create indexes
        cursor.execute('CREATE INDEX ix_users_username ON users(username)')
        cursor.execute('CREATE INDEX ix_users_email ON users(email)')

        conn.commit()
        print("✅ users table created successfully!")

    conn.close()
except Exception as e:
    print(f"❌ Error: {e}")
