"""Products API router.

Provides a GET endpoint that will auto-seed the products collection on first
access if it's empty. Supports simple pagination and optional text search.
"""
from __future__ import annotations

from typing import List, Optional
from fastapi import APIRouter, Request, HTTPException, Query
from fastapi.responses import JSONResponse

from db.models import User, get_users_collection    
from db import seeder

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("/", response_model=dict)
async def get_users(
    request: Request,
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
) -> JSONResponse:
    """Get a paginated list of users."""
    db = request.app.state.db
    users_collection = get_users_collection(db)

    total_users = await users_collection.count_documents({})
    cursor = users_collection.find().skip(skip).limit(limit)
    users = []
    async for user_doc in cursor:
        # convert MongoDB ObjectId to str before validating with Pydantic
        doc = dict(user_doc)
        if "_id" in doc:
            doc["_id"] = str(doc["_id"])
        users.append(User(**doc))

    return JSONResponse(
        content={
            "total": total_users,
            "skip": skip,
            "limit": limit,
            "users": [user.dict(by_alias=True) for user in users],
        }
    )
