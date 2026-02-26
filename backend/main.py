from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from contextlib import asynccontextmanager

# Import routers when database is ready
from api.bonus_templates import router as bonus_templates_router
from api.stable_config import router as stable_config_router
from api.custom_languages import router as custom_languages_router
from api.auth import router as auth_router
from database.database import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("🚀 CAMPEON CRM API starting...")
    init_db()
    print("✅ Database initialized")
    yield
    # Shutdown
    print("🛑 CAMPEON CRM API shutting down...")

app = FastAPI(
    title="CAMPEON CRM API",
    description="Collaborative offer management system",
    version="1.0.0",
    lifespan=lifespan
)

# Add middleware
app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:8000",
        "https://campeon-crm-web.vercel.app",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router, tags=["auth"])
app.include_router(bonus_templates_router, prefix="/api",
                   tags=["bonus-templates"])
app.include_router(stable_config_router, prefix="/api",
                   tags=["stable-config"])
app.include_router(custom_languages_router, prefix="/api",
                   tags=["custom-languages"])


@app.get("/")
def root():
    """Root endpoint - API is running"""
    return {
        "message": "CAMPEON CRM API is running",
        "docs": "/docs",
        "health": "/health",
        "version": "1.0.0"
    }


@app.get("/health")
def health_check():
    """Health check endpoint - tests API and database connectivity"""
    from sqlalchemy import text
    from database.database import SessionLocal

    db_status = "error"
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        db_status = "ok"
    except Exception as e:
        db_status = f"error: {str(e)}"

    return {
        "status": "ok" if db_status == "ok" else "degraded",
        "service": "CAMPEON CRM API",
        "database": db_status,
        "timestamp": __import__("datetime").datetime.utcnow().isoformat()
    }
