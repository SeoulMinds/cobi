"""FastAPI backend for SeoulMinds night-action project."""

import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pydantic import BaseModel, Field
from db.models import HealthResponse, MessageRequest, MessageResponse
from db import seeder
from db.connection import attach_db_to_app
from routers import products as products_router

# ============================================================================
# Configuration
# ============================================================================

MONGODB_URL = os.getenv("MONGODB_URI", "mongodb://seoulminds:password@mongodb:27017/seoulminds_db?authSource=admin")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# Global database connection
db_client: AsyncIOMotorClient | None = None
db: AsyncIOMotorDatabase | None = None


# ============================================================================
# Lifecycle
# ============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Connect to MongoDB on startup, disconnect on shutdown."""
    global db_client, db
    
    try:
        db_client = AsyncIOMotorClient(MONGODB_URL)
        db = db_client.seoulminds_db
        # attach to app.state in case routers need it
        try:
            attach_db_to_app(app, db_client, dbname=db.name)
        except Exception:
            # ignore attach failures here; routers can still access global db
            pass
        # Verify connection
        await db.command("ping")
        print("✅ Connected to MongoDB")
        # Attempt automatic seeding in non-production environments
        try:
            force = os.getenv("FORCE_DB_SEED", "0") in ("1", "true", "True")
            env = os.getenv("ENVIRONMENT") or os.getenv("PYTHON_ENV") or os.getenv("FASTAPI_ENV") or os.getenv("ENV") or "development"
            if env != "production" or force:
                print("🌱 Running DB auto-seed check...")
                seed_summary = await seeder.seed_if_empty(db, force=force)
                print(f"✅ DB seeding result: {seed_summary}")
            else:
                print("⚠️ Skipping DB auto-seed in production")
        except Exception as e:
            print(f"❌ DB seeding failed: {e}")
    except Exception as e:
        print(f"❌ MongoDB connection failed: {e}")
        raise

    yield

    # Cleanup
    if db_client:
        db_client.close()
        print("✅ Disconnected from MongoDB")


# ============================================================================
# FastAPI App
# ============================================================================

app = FastAPI(
    title="SeoulMinds Night Action API",
    description="AI-driven backend for HackSeoul 2025",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS Middleware - must be added first
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# include routers
app.include_router(products_router.router)


# Models moved to `backend/models.py`


# ============================================================================
# Routes
# ============================================================================

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    mongodb_status = "connected" if db is not None else "disconnected"
    return {
        "status": "healthy",
        "mongodb": mongodb_status,
    }


@app.post("/api/chat")
async def send_message(request: MessageRequest):
    """
    Send a message and get AI response.
    Uses OpenAI or Gemini based on API availability.
    """
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection failed",
        )

    try:
        # For MVP: return mock AI response
        ai_response = f"Echo: {request.text}"
        model_used = "mock"

        # TODO: Replace with actual OpenAI/Gemini integration
        # if OPENAI_API_KEY:
        #     ai_response = await call_openai(request.text)
        #     model_used = "openai"
        # elif GEMINI_API_KEY:
        #     ai_response = await call_gemini(request.text)
        #     model_used = "gemini"

        # Store message in MongoDB
        message_doc = {
            "user_message": request.text,
            "ai_response": ai_response,
            "model": model_used,
            "user_id": request.user_id or "anonymous",
        }
        result = await db.messages.insert_one(message_doc)

        return {
            "id": str(result.inserted_id),
            "user_message": request.text,
            "ai_response": ai_response,
            "model": model_used,
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing message: {str(e)}",
        )


@app.get("/api/messages")
async def get_messages(user_id: str | None = None, limit: int = 50):
    """Retrieve messages from database."""
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection failed",
        )

    try:
        query = {} if not user_id else {"user_id": user_id}
        messages = await db.messages.find(query).sort("_id", -1).limit(limit).to_list(None)
        
        return {
            "messages": [
                {
                    "id": str(msg["_id"]),
                    "user_message": msg["user_message"],
                    "ai_response": msg["ai_response"],
                    "model": msg["model"],
                }
                for msg in messages
            ],
            "count": len(messages),
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving messages: {str(e)}",
        )


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "SeoulMinds Night Action API",
        "version": "0.1.0",
        "docs": "/docs",
        "health": "/health",
    }


# ============================================================================
# Error Handlers
# ============================================================================

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler."""
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error"},
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )
