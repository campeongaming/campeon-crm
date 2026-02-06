"""
Migration script to make the 'email' column nullable for existing PostgreSQL databases.
Run this ONCE to fix the constraint issue.

Usage:
  python migrate_email_nullable_fix.py  # Uses DATABASE_URL from .env
  python migrate_email_nullable_fix.py <database_url>  # Uses provided URL
"""

from sqlalchemy import create_engine, text
import os
import sys
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = sys.argv[1] if len(sys.argv) > 1 else os.getenv(
    "DATABASE_URL", "sqlite:///./casino_crm.db")


def migrate():
    """Make email column nullable"""

    if DATABASE_URL.startswith("sqlite"):
        print("ℹ️  SQLite detected - email is already flexible")
        return

    # PostgreSQL migration
    engine = create_engine(DATABASE_URL, pool_size=5, max_overflow=10)

    print("🔄 Making email column nullable in PostgreSQL...")
    print()

    with engine.connect() as conn:
        try:
            # Drop NOT NULL constraint
            print("📋 Step 1: Dropping NOT NULL constraint on email...")
            conn.execute(text("""
                ALTER TABLE users 
                ALTER COLUMN email DROP NOT NULL;
            """))
            conn.commit()
            print("✅ Email column is now nullable")
        except Exception as e:
            conn.rollback()
            if "does not exist" in str(e).lower() or "no such column" in str(e).lower():
                print("⚠️  Column already nullable or doesn't exist")
            else:
                print(f"❌ Error: {e}")
                return

    print()
    print("✅ Migration complete!")
    print("Users can now be created without an email address.")


if __name__ == "__main__":
    migrate()
