"""Pydantic models for products and small DB helper functions.

These models are used for request/response validation for the products API.
"""
from __future__ import annotations

from typing import List, Optional, Any
from pydantic import BaseModel, Field


class SellerBusinessInfo(BaseModel):
    business_name: Optional[str]
    registration_number: Optional[str]


class Seller(BaseModel):
    seller_id: Optional[str]
    name: Optional[str]
    rating: Optional[float]
    total_sales: Optional[int]
    response_rate: Optional[int]
    response_time_hours: Optional[int]
    location: Optional[str]
    badges: Optional[List[str]]
    business_info: Optional[SellerBusinessInfo]


class Shipping(BaseModel):
    method: Optional[str]
    courier: Optional[str]
    delivery_time_days: Optional[int]
    shipping_fee: Optional[int]
    remote_area_fee: Optional[dict]
    bundle_shipping: Optional[bool]
    rocket_delivery: Optional[bool]
    additional_info: Optional[str]


class ReturnPolicy(BaseModel):
    return_available: Optional[bool]
    return_period_days: Optional[int]
    return_fee: Optional[int]
    exchange_fee: Optional[int]
    free_return: Optional[bool]
    return_shipping_fee: Optional[int]
    conditions: Optional[List[str]]
    restrictions: Optional[List[str]]


class Ratings(BaseModel):
    average: Optional[float]
    count: Optional[int]
    distribution: Optional[dict]


class Reviews(BaseModel):
    photo_review_count: Optional[int]
    with_text_count: Optional[int]


class ProductOption(BaseModel):
    color: Optional[str]
    size: Optional[str]
    stock: Optional[int]
    additional_price: Optional[int]


class Product(BaseModel):
    id: Optional[str] = Field(alias="_id")
    product_id: Optional[str]
    title: Optional[str]
    brand: Optional[str]
    category: Optional[List[str]]
    price: Optional[int]
    original_price: Optional[int]
    discount_rate: Optional[int]
    currency: Optional[str]
    stock: Optional[int]
    seller: Optional[Seller]
    description: Optional[str]
    images: Optional[List[str]]
    attributes: Optional[dict]
    options: Optional[List[ProductOption]]
    shipping: Optional[Shipping]
    return_policy: Optional[ReturnPolicy]
    ratings: Optional[Ratings]
    reviews: Optional[Reviews]
    tags: Optional[List[str]]
    coupons_available: Optional[bool]
    wow_member_discount: Optional[int]
    question_count: Optional[int]
    created_at: Optional[str]
    last_updated: Optional[str]
    is_soldout: Optional[bool]
    is_new: Optional[bool]
    is_best: Optional[bool]

    class Config:
        populate_by_name = True
        json_encoders = {"_id": str}


def get_products_collection(db) -> Any:
    return db.get_collection("products")


# ---------------------------------------------------------------------------
# Shared API models (moved from backend/models.py)
# ---------------------------------------------------------------------------


class HealthResponse(BaseModel):
    status: str
    mongodb: str


class MessageRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=1000)
    user_id: str | None = None


class MessageResponse(BaseModel):
    id: str = Field(alias="_id")
    user_message: str
    ai_response: str
    model: str
    timestamp: str

    class Config:
        populate_by_name = True
