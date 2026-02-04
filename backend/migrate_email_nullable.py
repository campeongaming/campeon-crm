"""
Make email column nullable in PostgreSQL production database
"""
from sqlalchemy import create_engine, text
import os

# Use PostgreSQL URL
DATABASE_URL = "postgresql://bonuslab_user:Campeon2025!@top-bonuslab.com/bonuslab"

print(f"Connecting to: {DATABASE_URL[:40]}...")

engine = create_engine(DATABASE_URL)

try:
    with engine.begin() as conn:  # Use begin() for auto-commit
        print("Connected successfully!")
        print("Running: ALTER TABLE users ALTER COLUMN email DROP NOT NULL;")

        conn.execute(
            text("ALTER TABLE users ALTER COLUMN email DROP NOT NULL;"))

        print("✅ Email column is now nullable in production database")
        print("\nVerifying change...")

        # Verify the change
        result = conn.execute(text("""
            SELECT column_name, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'email'
        """))
        for row in result:
            print(f"   Column: {row[0]}, Nullable: {row[1]}")

except Exception as e:
    print(f"❌ Migration failed: {e}")
    print(f"\nFull error: {type(e).__name__}: {str(e)}")
    print("\nManual SQL to run via psql or pgAdmin:")
    print("ALTER TABLE users ALTER COLUMN email DROP NOT NULL;")
