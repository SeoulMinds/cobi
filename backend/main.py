"""FastAPI backend for SeoulMinds night-action project."""

import os
from contextlib import asynccontextmanager

from db import seeder
from db.connection import attach_db_to_app
from db.models import HealthResponse, MessageRequest
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from routers import products as products_router
from routers import user_profile as user_profile_router

# Import Gemini service
try:
    from llm_api.gemini_service import get_gemini_service
    from llm_api.product_context import (
        build_product_context_for_llm,
        format_products_for_response,
        search_products_by_query,
    )
    from llm_api.sentiment_analyzer import get_sentiment_analyzer
    GEMINI_AVAILABLE = True
except ImportError as e:
    print(f"Warning: Could not import Gemini service: {e}")
    GEMINI_AVAILABLE = False
from routers import users as users_router

# ============================================================================
# Configuration
# ============================================================================

MONGODB_URL = os.getenv("MONGODB_URI", "mongodb://seoulminds:password@mongodb:27017/seoulminds_db?authSource=admin")
FRONTEND_PORT = os.getenv("FRONTEND_PORT", "8080")
FRONTEND_URL = os.getenv("FRONTEND_URL", f"http://localhost:{FRONTEND_PORT}")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
BACKEND_PORT = int(os.getenv("BACKEND_PORT", "8001"))

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
                
                # Sync user profiles from MongoDB to Qdrant
                print("🔄 Syncing user profiles to Qdrant...")
                try:
                    from vector_db.qdrant_service import get_qdrant_service
                    qdrant = get_qdrant_service()
                    
                    # Get all user profiles from MongoDB
                    profiles_coll = db.get_collection("user_profiles")
                    profiles = await profiles_coll.find({}).to_list(None)
                    
                    synced_count = 0
                    for profile in profiles:
                        user_id = profile.get("user_id")
                        if user_id:
                            profile_copy = dict(profile)
                            profile_copy.pop("_id", None)
                            success = qdrant.sync_from_mongodb_data(user_id, profile_copy)
                            if success:
                                synced_count += 1
                    
                    print(f"✅ Synced {synced_count}/{len(profiles)} user profiles to Qdrant")
                except Exception as sync_error:
                    print(f"⚠️ Failed to sync user profiles to Qdrant: {sync_error}")
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
app.include_router(user_profile_router.router)
app.include_router(users_router.router)


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
    Send a message and get AI response with product recommendations.
    Uses Gemini AI for intelligent shopping assistance.
    Also analyzes user sentiment and updates their preference profile.
    """
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection failed",
        )

    try:
        ai_response = None
        model_used = "mock"
        products = []
        search_query = request.text
        sentiment_features = []

        # Try to use Gemini with product search if available
        if GEMINI_AVAILABLE and GEMINI_API_KEY:
            try:
                # Step 1: Search for relevant products based on user query
                products_raw = await search_products_by_query(
                    user_query=request.text,
                    db=db,
                    limit=5
                )

                # Step 2: Build product context for Gemini
                product_context = await build_product_context_for_llm(products_raw)

                # Step 3: Get AI response with product context
                gemini_service = get_gemini_service(api_key=GEMINI_API_KEY)
                if gemini_service:
                    ai_response = await gemini_service.generate_response(
                        user_query=request.text,
                        product_context=product_context
                    )
                    model_used = "gemini-2.5-flash"

                # Step 4: Format products for response
                products = format_products_for_response(products_raw)

                # Step 5: Analyze sentiment and update user profile
                # Only analyze if we have a valid user_id
                user_id = request.user_id or "demo-user"
                if user_id and user_id != "anonymous":
                    try:
                        sentiment_analyzer = get_sentiment_analyzer(GEMINI_API_KEY)
                        sentiment_features = await sentiment_analyzer.analyze_message(request.text)
                        
                        # Update user profile with sentiment data
                        if sentiment_features:
                            from vector_db.qdrant_service import get_qdrant_service
                            qdrant = get_qdrant_service()
                            
                            for feature_data in sentiment_features:
                                success = qdrant.add_evidence(
                                    user_id=user_id,
                                    feature=feature_data["feature"],
                                    sentence=feature_data["sentence"],
                                    sentiment=feature_data["sentiment"],
                                    score=feature_data["score"]
                                )
                                if success:
                                    print(f"✅ Updated {user_id} profile: {feature_data['feature']} -> {feature_data['sentiment']} ({feature_data['score']})")
                            
                            # Also sync to MongoDB for persistence
                            profile = qdrant.get_user_profile(user_id)
                            if profile:
                                profiles_coll = db.get_collection("user_profiles")
                                await profiles_coll.update_one(
                                    {"user_id": user_id},
                                    {"$set": profile},
                                    upsert=True
                                )
                    except Exception as sentiment_error:
                        print(f"Sentiment analysis error: {sentiment_error}")
                        # Continue even if sentiment analysis fails

            except Exception as gemini_error:
                print(f"Gemini/Product search error: {gemini_error}")
                # Fall back to mock response

        # Fallback to mock if Gemini not available or failed
        if ai_response is None:
            ai_response = f"Echo: {request.text}"
            model_used = "mock"

        # Store message in MongoDB
        message_doc = {
            "user_message": request.text,
            "ai_response": ai_response,
            "model": model_used,
            "user_id": request.user_id or "anonymous",
            "products": products,
            "search_query": search_query,
            "sentiment_features": sentiment_features,  # Store sentiment analysis results
        }
        result = await db.messages.insert_one(message_doc)

        return {
            "id": str(result.inserted_id),
            "user_message": request.text,
            "ai_response": ai_response,
            "model": model_used,
            "products": products,
            "search_query": search_query,
            "sentiment_features": sentiment_features,  # Return sentiment analysis to frontend
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


@app.get("/api/products/{product_id}")
async def get_product(product_id: str):
    """Retrieve a single product by Mongo _id or product_id."""
    if db is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database connection failed")

    coll = db.get_collection("products")
    try:
        # Try by _id first (as string) then by product_id
        from bson import ObjectId

        query = None
        try:
            query = {"_id": ObjectId(product_id)}
        except Exception:
            query = {"product_id": product_id}

        doc = await coll.find_one(query)
        if not doc:
            raise HTTPException(status_code=404, detail="Product not found")

        # Convert _id to string
        doc["id"] = str(doc.get("_id"))
        doc.pop("_id", None)
        return doc
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


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
        port=BACKEND_PORT,
        reload=True,
    )
