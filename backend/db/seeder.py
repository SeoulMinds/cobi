"""Database seeding utilities.

Loads sample product data from `../utils/db_seed.json` and inserts into the
`products` collection if the collection is empty or missing. Designed to be
called from FastAPI startup. Runs only when not in production unless forced.
"""
from __future__ import annotations

import os
import json
from typing import Any

from motor.motor_asyncio import AsyncIOMotorDatabase


async def seed_products_if_empty(db: AsyncIOMotorDatabase, *, force: bool = False) -> dict[str, Any]:
    """Seed the `products` collection from utils/db_seed.json if it's empty.

    Args:
        db: motor database instance
        force: when True, will seed regardless of environment and even if some
            documents exist (but will not delete existing documents).

    Returns:
        A summary dict with inserted count and status.
    """
    env = os.getenv("NODE_ENV") or os.getenv("ENV") or os.getenv("PY_ENV") or os.getenv("PYTHON_ENV") or os.getenv("FASTAPI_ENV") or os.getenv("ENVIRONMENT")
    # Default to development if not set
    env = env or os.getenv("ENVIRONMENT", "development")

    if env == "production" and not force:
        return {"status": "skipped", "reason": "production environment"}

    products_coll = db.get_collection("products")

    existing_count = await products_coll.count_documents({})
    if existing_count > 0 and not force:
        return {"status": "skipped", "reason": "products collection not empty", "existing": existing_count}

    # Load seed file relative to this module: ../../backend/utils/db_seed.json
    seed_path = os.path.join(os.path.dirname(__file__), "..", "utils", "db_seed.json")
    seed_path = os.path.abspath(seed_path)

    try:
        with open(seed_path, "r", encoding="utf-8") as f:
            data = json.load(f)
    except FileNotFoundError:
        return {"status": "error", "reason": f"seed file not found at {seed_path}"}
    except json.JSONDecodeError as e:
        return {"status": "error", "reason": f"invalid json: {e}"}

    if not isinstance(data, list):
        return {"status": "error", "reason": "seed file must contain a top-level JSON array of products"}

    # Prepare documents: ensure _id not set and product_id exists
    to_insert = []
    for item in data:
        if not isinstance(item, dict):
            continue
        # map product_id to a unique field, but don't set _id to avoid collisions
        to_insert.append(item)

    if not to_insert:
        return {"status": "skipped", "reason": "no valid product documents in seed file"}

    try:
        result = await products_coll.insert_many(to_insert)
        return {"status": "inserted", "inserted_count": len(result.inserted_ids)}
    except Exception as e:
        return {"status": "error", "reason": str(e)}


async def seed_if_empty(db: AsyncIOMotorDatabase, *, force: bool = False) -> dict[str, Any]:
    """Top-level seeding helper. Currently seeds only products but can be
    extended to handle more collections."""
    summary = {}
    summary["products"] = await seed_products_if_empty(db, force=force)
    return summary
