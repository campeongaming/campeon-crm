"""
Migration script to fix PostgreSQL user roles enum constraint.
This allows storing multiple role types: admin, CRM OPS, Translation Team, Optimization Team
"""

from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./casino_crm.db")


def migrate():
    """Fix user roles to support all team roles"""

    if DATABASE_URL.startswith("sqlite"):
        print("ℹ️  SQLite detected - no migration needed (varchar is flexible by default)")
        return

    # PostgreSQL migration
    engine = create_engine(DATABASE_URL, pool_size=10, max_overflow=20)

    print("🔄 Starting PostgreSQL user roles migration...")
    print()

    with engine.connect() as conn:
        try:
            # Drop enum constraint and recreate column
            print("📋 Step 1: Dropping old role enum constraint...")
            conn.execute(text("""
                ALTER TABLE users 
                DROP CONSTRAINT users_role_check;
            """))
            conn.commit()
            print("✅ Constraint dropped")
        except Exception as e:
            conn.rollback()
            if "does not exist" in str(e).lower():
                print("⚠️  Constraint doesn't exist (already migrated?)")
            else:
                print(f"❌ Error: {e}")
                return

        try:
            # Alter column type and size
            print("📋 Step 2: Expanding role column from varchar(20) to varchar(100)...")
            conn.execute(text("""
                ALTER TABLE users 
                ALTER COLUMN role TYPE varchar(100);
            """))
            conn.commit()
            print("✅ Role column expanded")
        except Exception as e:
            conn.rollback()
            print(f"❌ Error: {e}")
            return

        try:
            # Add new constraint for valid roles
            print("📋 Step 3: Adding role validation...")
            conn.execute(text("""
                ALTER TABLE users 
                ADD CONSTRAINT valid_user_roles 
                CHECK (role IN ('admin', 'CRM OPS', 'Translation Team', 'Optimization Team'));
            """))
            conn.commit()
            print("✅ Role validation added")
        except Exception as e:
            conn.rollback()
            if "already exists" in str(e).lower():
                print("⚠️  Validation already exists")
            else:
                print(f"❌ Error: {e}")
                return

    print()
    print("✅ Migration complete!")
    print()
    print("📝 Supported roles:")
    print("   - admin (full access)")
    print("   - CRM OPS (create/manage bonuses)")
    print("   - Translation Team (translate bonuses)")
    print("   - Optimization Team (optimize bonus configs)")


if __name__ == "__main__":
    migrate()
