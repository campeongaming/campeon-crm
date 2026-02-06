from sqlalchemy import create_engine, text, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool, QueuePool
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./casino_crm.db")

# SQLite config for development
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
else:
    # PostgreSQL config for production (Render)
    # Important: pool_recycle must be less than Render's idle timeout (usually 5 minutes)
    # pool_pre_ping verifies connections before using them
    engine = create_engine(
        DATABASE_URL,
        poolclass=QueuePool,
        pool_size=5,
        max_overflow=10,
        pool_recycle=300,  # Recycle connections after 5 minutes
        pool_pre_ping=True,  # Test connections before using them
        connect_args={
            "connect_timeout": 10,
            "application_name": "campeon_crm"
        }
    )

    # Handle connection recycling more gracefully
    @event.listens_for(engine, "connect")
    def receive_connect(dbapi_conn, connection_record):
        """Configure connection parameters on connect"""
        cursor = dbapi_conn.cursor()
        # 60 seconds
        cursor.execute("SET idle_in_transaction_session_timeout = 60000")
        cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    """Get database session with connection pooling and error handling"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Initialize database


def init_db():
    from database.models import Base
    Base.metadata.create_all(bind=engine)

    # Add migration to add missing columns if they don't exist
    # PostgreSQL requires rollback after failed transaction
    with engine.connect() as conn:
        # Check if columns exist, if not add them
        try:
            conn.execute(
                text("ALTER TABLE stable_configs ADD COLUMN casino_proportions TEXT DEFAULT ''"))
            conn.commit()
            print("✅ Added casino_proportions column")
        except Exception as e:
            conn.rollback()  # Required for PostgreSQL after failed transaction
            if "already exists" not in str(e).lower() and "duplicate column" not in str(e).lower():
                print(f"Note: {e}")

        try:
            conn.execute(text(
                "ALTER TABLE stable_configs ADD COLUMN live_casino_proportions TEXT DEFAULT ''"))
            conn.commit()
            print("✅ Added live_casino_proportions column")
        except Exception as e:
            conn.rollback()  # Required for PostgreSQL after failed transaction
            if "already exists" not in str(e).lower() and "duplicate column" not in str(e).lower():
                print(f"Note: {e}")

    print("✅ Database initialized")
