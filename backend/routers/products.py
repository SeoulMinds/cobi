"""Products API router.

Provides a GET endpoint that will auto-seed the products collection on first
access if it's empty. Supports simple pagination and optional text search.
"""
from __future__ import annotations

from typing import List, Optional
from fastapi import APIRouter, Request, HTTPException, Query
from fastapi.responses import JSONResponse

from db.models import Product, get_products_collection
from db import seeder

router = APIRouter(prefix="/api/products", tags=["products"])


@router.get("/", response_model=dict)
async def list_products(request: Request, q: Optional[str] = Query(None), page: int = 1, limit: int = 20):
    """List products. If products collection is empty, run seeding first.

    - q: optional text query (search in title)
    - page: 1-based page number
    - limit: items per page
    """
    db = getattr(request.app.state, "db", None)
    if db is None:
        raise HTTPException(status_code=503, detail="Database not initialized")

    coll = get_products_collection(db)

    # Check if empty and seed lazily
    count = await coll.count_documents({})
    if count == 0:
        try:
            summary = await seeder.seed_if_empty(db)
            # Recount after seeding
            count = await coll.count_documents({})
        except Exception as e:
            return JSONResponse(status_code=500, content={"detail": f"Seeding failed: {e}"})

    query = {}
    if q:
        # simple text search on title
        query = {"title": {"$regex": q, "$options": "i"}}

    skip = max(0, (page - 1)) * max(1, limit)
    cursor = coll.find(query).sort("_id", -1).skip(skip).limit(limit)
    docs = await cursor.to_list(length=limit)

    items = []
    for doc in docs:
        # convert ObjectId to str for JSON serialization and avoid Pydantic parsing issues
        item = dict(doc)
        if "_id" in item:
            try:
                item["id"] = str(item["_id"])
            except Exception:
                item["id"] = item["_id"]
            item.pop("_id", None)
        items.append(item)

    return {"items": items, "count": count, "page": page, "limit": limit}
