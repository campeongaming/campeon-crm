"""
Migration script to make the 'email' column nullable for existing PostgreSQL databases.
Run this ONCE to fix the constraint issue.
"""

from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./casino_crm.db")


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
