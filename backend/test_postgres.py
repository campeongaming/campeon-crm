"""Quick test to verify PostgreSQL connection and data"""
from sqlalchemy import create_engine, text
from dotenv import load_dotenv
import os
import json

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

print("=" * 60)
print("PostgreSQL Connection Test")
print("=" * 60)
print(f"\n📡 Connecting to: {DATABASE_URL[:50]}...\n")

try:
    engine = create_engine(DATABASE_URL, pool_size=10, max_overflow=20)

    with engine.connect() as conn:
        # Test 1: Connection
        print("✅ Connection successful!\n")

        # Test 2: Count bonus templates
        result = conn.execute(text("SELECT COUNT(*) FROM bonus_templates"))
        count = result.scalar()
        print(f"📦 Bonus Templates: {count} records")

        # Test 3: Count stable configs
        result = conn.execute(text("SELECT COUNT(*) FROM stable_configs"))
        count = result.scalar()
        print(f"📦 Stable Configs: {count} records")

        # Test 4: Count users
        result = conn.execute(text("SELECT COUNT(*) FROM users"))
        count = result.scalar()
        print(f"📦 Users: {count} records")

        # Test 5: List bonus template IDs
        result = conn.execute(text("SELECT id FROM bonus_templates LIMIT 5"))
        templates = result.fetchall()
        print(f"\n🎯 Sample Bonus Templates:")
        for i, (template_id,) in enumerate(templates, 1):
            print(f"   {i}. {template_id}")

        # Test 6: Check stable configs
        result = conn.execute(text("SELECT provider FROM stable_configs"))
        providers = result.fetchall()
        print(f"\n⚙️  Configured Providers:")
        for provider, in providers:
            print(f"   - {provider}")

        print("\n" + "=" * 60)
        print("🎉 All tests passed! PostgreSQL is working correctly!")
        print("=" * 60)

except Exception as e:
    print(f"\n❌ Error: {str(e)}")
    import traceback
    traceback.print_exc()
