"""
Make email column nullable in PostgreSQL production database
"""
from sqlalchemy import create_engine, text
import os

# Use PostgreSQL URL
DATABASE_URL = "postgresql://bonuslab_user:Campeon2025!@top-bonuslab.com/bonuslab"

engine = create_engine(DATABASE_URL)

try:
    with engine.connect() as conn:
        # Make email column nullable
        conn.execute(
            text("ALTER TABLE users ALTER COLUMN email DROP NOT NULL;"))
        conn.commit()
        print("✅ Email column is now nullable in production database")
except Exception as e:
    print(f"❌ Migration failed: {e}")
    print("\nManual SQL to run:")
    print("ALTER TABLE users ALTER COLUMN email DROP NOT NULL;")
