"""MongoDB connection helpers for Motor.

This provides a small wrapper to expose the `db` instance on the FastAPI
app.state so routers can access it easily.
"""
from typing import Optional
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase


def get_db_from_app(app) -> AsyncIOMotorDatabase:
    """Return the Motor AsyncIOMotorDatabase stored on app.state.db.

    Raises AttributeError if not present.
    """
    db = getattr(app.state, "db", None)
    if db is None:
        raise AttributeError("Database not initialized on app.state.db")
    return db


def attach_db_to_app(app, client: AsyncIOMotorClient, dbname: str = "seoulminds_db") -> AsyncIOMotorDatabase:
    db = client[dbname]
    app.state.db = db
    return db
