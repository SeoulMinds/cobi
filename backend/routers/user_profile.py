"""User Profile API - Vector-based user preference management."""
from typing import Dict

from db.connection import get_db
from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel
from vector_db.qdrant_service import get_qdrant_service

router = APIRouter(prefix="/api/user-profile", tags=["user-profile"])


class EvidenceData(BaseModel):
    user_id: str
    feature: str  # size, color, material, brand, price, trend, durability, shipping
    sentence: str  # User's review/comment text
    sentiment: str  # "positive" or "negative"
    score: float  # Sentiment score (-1.0 to 1.0)


class WeightUpdate(BaseModel):
    user_id: str
    weights: Dict[str, float]  # feature -> weight (0.0 to 1.0)


@router.get("/{user_id}")
async def get_user_profile(user_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Get user profile with feature weights and evidence.
    
    Fetches from MongoDB first, syncs to Qdrant if needed, then returns profile.
    
    Returns structure:
    {
        "user_id": "u_001",
        "feature_weights": {"size": 0.87, "color": 0.72, ...},
        "evidence": [...]
    }
    """
    try:
        # Get from MongoDB first
        profiles_coll = db.get_collection("user_profiles")
        mongodb_profile = await profiles_coll.find_one({"user_id": user_id})
        
        if not mongodb_profile:
            raise HTTPException(status_code=404, detail=f"Profile not found for user: {user_id}")
        
        # Remove MongoDB _id field
        mongodb_profile.pop("_id", None)
        
        # Sync to Qdrant for vector similarity search
        qdrant = get_qdrant_service()
        qdrant.sync_from_mongodb_data(user_id, mongodb_profile)
        
        return mongodb_profile
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get profile: {str(e)}")


@router.post("/add-evidence")
async def add_evidence(data: EvidenceData):
    """Add user evidence and update feature weight based on sentiment.
    
    Example:
    {
        "user_id": "u_001",
        "feature": "size",
        "sentence": "핏이 정말 좋아요",
        "sentiment": "positive",
        "score": 0.9
    }
    """
    try:
        qdrant = get_qdrant_service()
        
        success = qdrant.add_evidence(
            user_id=data.user_id,
            feature=data.feature,
            sentence=data.sentence,
            sentiment=data.sentiment,
            score=data.score
        )
        
        if not success:
            raise HTTPException(status_code=400, detail=f"Invalid feature: {data.feature}")
        
        # Return updated profile
        profile = qdrant.get_user_profile(data.user_id)
        
        return {
            "success": True,
            "user_id": data.user_id,
            "feature": data.feature,
            "new_weight": profile["feature_weights"][data.feature] if profile else None,
            "evidence_count": len(profile["evidence"]) if profile else 0
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to add evidence: {str(e)}")


@router.post("/update-weights")
async def update_weights(data: WeightUpdate):
    """Directly update feature weights.
    
    Example:
    {
        "user_id": "u_001",
        "weights": {"size": 0.87, "color": 0.72}
    }
    """
    try:
        qdrant = get_qdrant_service()
        
        success = qdrant.update_feature_weights(
            user_id=data.user_id,
            weights=data.weights
        )
        
        if not success:
            raise HTTPException(status_code=400, detail="Failed to update weights")
        
        # Return updated profile
        profile = qdrant.get_user_profile(data.user_id)
        
        return {
            "success": True,
            "user_id": data.user_id,
            "updated_profile": profile
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update weights: {str(e)}")


@router.get("/similar-users/{user_id}")
async def get_similar_users(user_id: str, limit: int = 5):
    """Find users with similar preference profiles.
    
    Returns similarity scores between 0.0 and 1.0 (max).
    """
    try:
        qdrant = get_qdrant_service()
        similar_users = qdrant.get_similar_users(user_id, limit)
        
        return {
            "user_id": user_id,
            "similar_users": similar_users,
            "count": len(similar_users)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to find similar users: {str(e)}")


@router.get("/dimensions")
async def get_feature_dimensions():
    """Get all available feature dimensions."""
    qdrant = get_qdrant_service()
    dimensions = qdrant.get_feature_dimensions()
    
    return {
        "dimensions": list(dimensions.keys()),
        "total_dimensions": len(dimensions),
        "feature_map": dimensions
    }
