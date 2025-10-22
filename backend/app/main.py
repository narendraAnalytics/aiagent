"""
FastAPI application entry point
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import get_settings
from app.database.connection import init_db, close_db
from app.api.routes import agent, auth, linkedin


settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    try:
        await init_db()
        print("✅ Database connected successfully")
    except Exception as e:
        print(f"⚠️ Database connection failed: {e}")
        print("⚠️ App will start without database - please check DATABASE_URL")
    yield
    # Shutdown
    try:
        await close_db()
    except Exception as e:
        print(f"⚠️ Database close failed: {e}")


# Create FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    description="AI-powered research assistant with long-term memory",
    version="0.1.0",
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Include routers
app.include_router(agent.router, prefix="/api", tags=["agent"])
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(linkedin.router, prefix="/api/linkedin", tags=["linkedin"])


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Personal Research Assistant API",
        "version": "0.1.0",
        "docs": "/docs",
    }


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {"status": "healthy"}


if __name__ == "__main__":
    import multiprocessing
    multiprocessing.freeze_support()  # Required for Windows multiprocessing
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.ENVIRONMENT == "development",
    )
