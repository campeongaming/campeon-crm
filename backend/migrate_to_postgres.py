"""
Migration script to transfer data from SQLite to PostgreSQL.
This script copies all data from the local SQLite database to the remote PostgreSQL database.
"""

from sqlalchemy import create_engine, text, inspect
from sqlalchemy.orm import sessionmaker
import json

# Source: Local SQLite database
SQLITE_URL = "sqlite:///./casino_crm.db"

# Target: PostgreSQL database
POSTGRES_URL = "postgresql://bonuslab:emdjhpkettxmcuxupzzviufwnzzcvfugocrjcutigksgmdgqymivmqqnswdaybqtyavysdycsnmxtepolwvryw@top-bonuslab.com/bonuslab"


def migrate_data():
    """Copy all data from SQLite to PostgreSQL"""

    print("🔄 Starting database migration...")
    print(f"📂 Source: SQLite (casino_crm.db)")
    print(f"🎯 Target: PostgreSQL (top-bonuslab.com/bonuslab)")
    print()

    # Create engines
    sqlite_engine = create_engine(
        SQLITE_URL,
        connect_args={"check_same_thread": False}
    )

    postgres_engine = create_engine(
        POSTGRES_URL,
        pool_size=10,
        max_overflow=20
    )

    # Create sessions
    SqliteSession = sessionmaker(bind=sqlite_engine)
    PostgresSession = sessionmaker(bind=postgres_engine)

    sqlite_session = SqliteSession()
    postgres_session = PostgresSession()

    try:
        # Test PostgreSQL connection
        print("🔍 Testing PostgreSQL connection...")
        postgres_session.execute(text("SELECT 1"))
        print("✅ PostgreSQL connection successful!")
        print()

        # Create tables in PostgreSQL
        print("📋 Creating tables in PostgreSQL...")
        from database.models import Base
        Base.metadata.create_all(bind=postgres_engine)
        print("✅ Tables created successfully!")
        print()

        # Get list of tables
        inspector = inspect(sqlite_engine)
        tables = inspector.get_table_names()

        print(f"📊 Found {len(tables)} tables to migrate:")
        for table in tables:
            print(f"   - {table}")
        print()

        # Migrate each table
        for table_name in tables:
            print(f"🔄 Migrating table: {table_name}...")

            # Get data from SQLite
            sqlite_data = sqlite_session.execute(
                text(f"SELECT * FROM {table_name}")
            ).fetchall()

            if not sqlite_data:
                print(f"   ⚠️  No data in {table_name}, skipping...")
                continue

            # Get column names
            columns = sqlite_session.execute(
                text(f"PRAGMA table_info({table_name})")
            ).fetchall()
            column_names = [col[1] for col in columns]

            # Get PostgreSQL column types to identify booleans
            pg_columns_result = postgres_session.execute(
                text(f"""
                    SELECT column_name, data_type 
                    FROM information_schema.columns 
                    WHERE table_name = '{table_name}'
                """)
            ).fetchall()
            boolean_columns = {col[0]
                               for col in pg_columns_result if col[1] == 'boolean'}

            print(f"   📦 Found {len(sqlite_data)} rows")

            # Clear existing data in PostgreSQL table
            postgres_session.execute(text(f"DELETE FROM {table_name}"))
            postgres_session.commit()

            # Insert data into PostgreSQL
            success_count = 0
            error_count = 0

            for row in sqlite_data:
                try:
                    # Build INSERT statement
                    placeholders = ', '.join(
                        [f':{col}' for col in column_names])
                    insert_sql = f"INSERT INTO {table_name} ({', '.join(column_names)}) VALUES ({placeholders})"

                    # Create parameter dict
                    params = {}
                    for i, col_name in enumerate(column_names):
                        value = row[i]

                        # Handle boolean conversions (SQLite stores as 0/1)
                        if col_name in boolean_columns:
                            params[col_name] = bool(
                                value) if value is not None else False
                        # Handle JSON columns - ensure proper JSON format
                        elif value and isinstance(value, str):
                            # Try to parse as JSON
                            try:
                                parsed = json.loads(value)
                                params[col_name] = json.dumps(parsed)
                            except (json.JSONDecodeError, TypeError):
                                params[col_name] = value
                        else:
                            params[col_name] = value

                    postgres_session.execute(text(insert_sql), params)
                    postgres_session.commit()  # Commit each row individually
                    success_count += 1

                except Exception as e:
                    error_count += 1
                    postgres_session.rollback()  # Rollback failed row
                    print(f"   ❌ Error inserting row: {str(e)[:100]}")

            print(f"   ✅ Migrated {success_count} rows successfully")
            if error_count > 0:
                print(f"   ⚠️  {error_count} rows failed")
            print()

        print("🎉 Migration completed successfully!")
        print()
        print("📝 Next steps:")
        print("1. Create/update backend/.env file with:")
        print(f"   DATABASE_URL={POSTGRES_URL}")
        print("2. Restart your backend server")
        print("3. Test the application to ensure everything works")

    except Exception as e:
        print(f"❌ Migration failed: {str(e)}")
        postgres_session.rollback()
        raise

    finally:
        sqlite_session.close()
        postgres_session.close()


if __name__ == "__main__":
    try:
        migrate_data()
    except KeyboardInterrupt:
        print("\n⚠️  Migration interrupted by user")
    except Exception as e:
        print(f"\n❌ Fatal error: {str(e)}")
        import traceback
        traceback.print_exc()
