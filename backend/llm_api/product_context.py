"""Product context building and search for LLM integration."""

import re
from typing import List, Dict, Optional, Any
from motor.motor_asyncio import AsyncIOMotorDatabase


async def extract_search_criteria(user_query: str) -> Dict[str, Any]:
    """
    Extract search criteria from user query.

    Args:
        user_query: User's search query

    Returns:
        Dictionary with search criteria (keywords, price, category, etc.)
    """
    query_lower = user_query.lower()
    criteria = {
        "keywords": [],
        "max_price": None,
        "min_price": None,
        "category": None,
        "brand": None,
    }

    # Extract price range
    # Pattern: "under 100000", "less than 50000", "below 80000"
    price_patterns = [
        r'under\s+(\d+)',
        r'less\s+than\s+(\d+)',
        r'below\s+(\d+)',
        r'cheaper\s+than\s+(\d+)',
    ]
    for pattern in price_patterns:
        match = re.search(pattern, query_lower)
        if match:
            criteria["max_price"] = int(match.group(1))
            break

    # Pattern: "over 50000", "more than 30000", "above 20000"
    min_price_patterns = [
        r'over\s+(\d+)',
        r'more\s+than\s+(\d+)',
        r'above\s+(\d+)',
    ]
    for pattern in min_price_patterns:
        match = re.search(pattern, query_lower)
        if match:
            criteria["min_price"] = int(match.group(1))
            break

    # Detect product categories
    category_keywords = {
        "shoes": ["shoe", "sneaker", "footwear", "running", "boots"],
        "bags": ["bag", "backpack", "handbag", "purse", "crossbag"],
        "electronics": ["phone", "headphone", "watch", "gadget", "electronic"],
        "accessories": ["wallet", "sunglasses", "accessory", "belt"],
    }

    for category, keywords in category_keywords.items():
        if any(kw in query_lower for kw in keywords):
            criteria["category"] = category
            criteria["keywords"].extend([kw for kw in keywords if kw in query_lower])
            break

    # Detect brands
    brands = ["adidas", "nike", "29cm", "에이블리", "아디다스"]
    for brand in brands:
        if brand in query_lower:
            criteria["brand"] = brand
            break

    # General keywords (if no specific category found)
    if not criteria["keywords"]:
        # Extract meaningful words (exclude common words)
        stop_words = {"i", "need", "want", "looking", "for", "show", "me", "find",
                     "get", "buy", "purchase", "a", "an", "the", "some", "any"}
        words = re.findall(r'\b\w+\b', query_lower)
        criteria["keywords"] = [w for w in words if w not in stop_words and len(w) > 2]

    return criteria


async def search_products_by_query(
    user_query: str,
    db: AsyncIOMotorDatabase,
    limit: int = 5
) -> List[Dict[str, Any]]:
    """
    Search products based on user query.

    Args:
        user_query: User's search query
        db: MongoDB database instance
        limit: Maximum number of products to return

    Returns:
        List of product documents
    """
    # Extract search criteria
    criteria = await extract_search_criteria(user_query)

    # Build MongoDB query
    mongo_query = {}

    # Price filtering
    price_filter = {}
    if criteria["max_price"]:
        price_filter["$lte"] = criteria["max_price"]
    if criteria["min_price"]:
        price_filter["$gte"] = criteria["min_price"]
    if price_filter:
        mongo_query["price"] = price_filter

    # Category filtering (search in category array or title)
    if criteria["category"] or criteria["keywords"]:
        search_terms = []

        if criteria["category"]:
            search_terms.append(criteria["category"])

        if criteria["keywords"]:
            search_terms.extend(criteria["keywords"][:3])  # Limit to top 3 keywords

        # Search in title, description, category, or tags
        mongo_query["$or"] = []
        for term in search_terms:
            mongo_query["$or"].extend([
                {"title": {"$regex": term, "$options": "i"}},
                {"description": {"$regex": term, "$options": "i"}},
                {"category": {"$regex": term, "$options": "i"}},
                {"tags": {"$regex": term, "$options": "i"}},
            ])

    # Brand filtering
    if criteria["brand"]:
        mongo_query["brand"] = {"$regex": criteria["brand"], "$options": "i"}

    # If no specific criteria, return random products
    if not mongo_query:
        # Use aggregation to get random products
        pipeline = [
            {"$sample": {"size": limit}},
            {"$limit": limit}
        ]
        products = await db.products.aggregate(pipeline).to_list(None)
    else:
        # Query with filters and sort by rating/discount
        products = await db.products.find(mongo_query).sort([
            ("ratings.average", -1),  # Prioritize higher rated
            ("discount_rate", -1),    # Then higher discounts
        ]).limit(limit).to_list(None)

        # If no results with filters, fall back to keywords only
        if not products and criteria["keywords"]:
            fallback_query = {"$or": [
                {"title": {"$regex": criteria["keywords"][0], "$options": "i"}},
            ]}
            products = await db.products.find(fallback_query).limit(limit).to_list(None)

    return products


async def build_product_context_for_llm(products: List[Dict[str, Any]]) -> str:
    """
    Format products into concise text for Gemini.

    Args:
        products: List of product documents

    Returns:
        Formatted string with product information
    """
    if not products:
        return "No products available in our catalog right now."

    context_lines = ["Here are the available products:\n"]

    for i, product in enumerate(products, 1):
        title = product.get('title', 'Unknown Product')
        price = product.get('price', 0)
        currency = product.get('currency', 'KRW')
        original_price = product.get('original_price')
        discount_rate = product.get('discount_rate', 0)

        # Format price
        price_str = f"{price:,} {currency}"

        # Build product line
        line = f"{i}. {title} - {price_str}"

        # Add discount info
        if original_price and discount_rate > 0:
            line += f" ({discount_rate}% OFF, was {original_price:,} {currency})"

        # Add rating
        ratings = product.get('ratings', {})
        if isinstance(ratings, dict):
            avg_rating = ratings.get('average', 0)
            review_count = ratings.get('count', 0)
            if avg_rating > 0:
                line += f" - Rating: {avg_rating}/5 ({review_count} reviews)"

        # Add stock warning
        stock = product.get('stock', 0)
        if stock > 0 and stock < 10:
            line += f" ⚠️ Only {stock} left!"
        elif stock == 0:
            line += " ❌ Out of stock"

        # Add category/brand
        brand = product.get('brand')
        if brand:
            line += f" - Brand: {brand}"

        context_lines.append(line)

    return "\n".join(context_lines)


def format_products_for_response(products: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Format products for API response (convert ObjectId to string, etc.).

    Args:
        products: List of product documents

    Returns:
        List of serializable product dictionaries
    """
    formatted = []
    for product in products:
        # Convert _id to string
        if '_id' in product:
            product['id'] = str(product['_id'])
            del product['_id']

        formatted.append(product)

    return formatted
