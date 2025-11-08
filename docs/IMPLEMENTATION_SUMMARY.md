# Implementation Summary: User Profile Sentiment Analysis

## What Was Implemented

This implementation adds **automatic sentiment analysis and user profile updates** to the COBI shopping assistant. User preferences are now tracked in real-time based on their chat interactions.

---

## Files Created

### 1. `backend/llm_api/sentiment_analyzer.py`
**Purpose:** Sentiment analysis service using Gemini AI

**Key Features:**
- Analyzes user messages for product feature mentions
- Extracts sentiment (positive/negative) and scores (-1.0 to 1.0)
- Supports multi-language analysis (English, Korean, etc.)
- Tracks 8 core features: size, color, material, brand, price, trend, durability, shipping
- Falls back to keyword-based analysis if LLM fails

**Example Usage:**
```python
from llm_api.sentiment_analyzer import get_sentiment_analyzer

analyzer = get_sentiment_analyzer(gemini_api_key)
features = await analyzer.analyze_message("The fit is perfect!")
# Returns: [{"feature": "size", "sentiment": "positive", "score": 0.9, ...}]
```

### 2. `docs/USER_PROFILE_SENTIMENT.md`
**Purpose:** Comprehensive documentation for the feature

**Contents:**
- Overview of how sentiment analysis works
- Feature tracking explanation
- API endpoints documentation
- Qdrant dashboard visualization guide
- Example workflows
- Testing instructions
- Troubleshooting guide

### 3. `docs/QUICKSTART_SENTIMENT.md`
**Purpose:** Quick start guide for testing

**Contents:**
- Step-by-step testing instructions
- cURL examples
- Qdrant dashboard walkthrough
- Troubleshooting common issues
- Advanced testing scenarios

### 4. `backend/test_sentiment.py`
**Purpose:** Automated test suite

**Features:**
- Tests sentiment analysis on various messages
- Tests profile creation and updates
- Tests finding similar users
- Provides clear output with emojis and formatting
- Includes multi-language test cases

---

## Files Modified

### 1. `backend/main.py`
**Changes:**
- Added import for `sentiment_analyzer`
- Modified `/api/chat` endpoint to:
  1. Analyze user messages for sentiment
  2. Extract feature preferences
  3. Update user profiles in Qdrant
  4. Sync profiles to MongoDB
  5. Return sentiment analysis results
- Added `sentiment_features` field to message storage

**Code Flow:**
```
User Message
    ↓
Product Search + AI Response (existing)
    ↓
Sentiment Analysis (NEW)
    ↓
Extract Features (NEW)
    ↓
Update Qdrant Profile (NEW)
    ↓
Sync to MongoDB (NEW)
    ↓
Return Response with Sentiment Data (NEW)
```

### 2. `README.md`
**Changes:**
- Added new feature section with emojis
- Documented all new endpoints
- Added quick start examples
- Linked to detailed documentation
- Added visualization instructions

---

## How It Works

### Architecture

```
┌─────────────────┐
│   User Chat     │
│   "Perfect fit!"│
└────────┬────────┘
         │
         ↓
┌─────────────────────────────────┐
│   Gemini Service                │
│   • Product Recommendations     │
│   • Sentiment Analysis (NEW)    │
└────────┬────────────────────────┘
         │
         ↓
┌─────────────────────────────────┐
│   Feature Extraction (NEW)      │
│   [                             │
│     {                           │
│       "feature": "size",        │
│       "sentiment": "positive",  │
│       "score": 0.9              │
│     }                           │
│   ]                             │
└────────┬────────────────────────┘
         │
         ↓
┌─────────────────────────────────┐
│   Qdrant Service (NEW)          │
│   • Update feature vector       │
│   • Store evidence              │
│   • Find similar users          │
└────────┬────────────────────────┘
         │
         ↓
┌─────────────────────────────────┐
│   MongoDB (NEW)                 │
│   • Persist profile             │
│   • Store evidence history      │
└─────────────────────────────────┘
         │
         ↓
┌─────────────────────────────────┐
│   Qdrant Dashboard              │
│   • Visualize vectors           │
│   • View evidence               │
│   • Search similar users        │
└─────────────────────────────────┘
```

### Data Flow Example

**Step 1: User sends message**
```json
{
  "text": "The fit is perfect and I love the color!",
  "user_id": "demo-user"
}
```

**Step 2: Sentiment analysis extracts features**
```json
{
  "sentiment_features": [
    {
      "feature": "size",
      "sentence": "The fit is perfect",
      "sentiment": "positive",
      "score": 0.9
    },
    {
      "feature": "color",
      "sentence": "I love the color",
      "sentiment": "positive",
      "score": 0.9
    }
  ]
}
```

**Step 3: Update user profile vector**
```
Before: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5]
After:  [0.62, 0.62, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5]
         ^^^^  ^^^^
         size  color (updated with exponential moving average)
```

**Step 4: Store evidence**
```json
{
  "evidence": [
    {
      "feature": "size",
      "sentence": "The fit is perfect",
      "sentiment": "positive",
      "score": 0.9,
      "timestamp": "2025-11-09T12:34:56.789Z"
    }
  ]
}
```

---

## API Changes

### Updated Endpoint: `POST /api/chat`

**Request:** (unchanged)
```json
{
  "text": "The fit is perfect and I love the color!",
  "user_id": "demo-user"
}
```

**Response:** (NEW field added)
```json
{
  "id": "...",
  "user_message": "The fit is perfect and I love the color!",
  "ai_response": "...",
  "model": "gemini-2.5-flash",
  "products": [...],
  "search_query": "...",
  "sentiment_features": [    // ← NEW FIELD
    {
      "feature": "size",
      "sentence": "The fit is perfect",
      "sentiment": "positive",
      "score": 0.9
    },
    {
      "feature": "color",
      "sentence": "I love the color",
      "sentiment": "positive",
      "score": 0.9
    }
  ]
}
```

### Existing Endpoints (Enhanced)

All user profile endpoints now work seamlessly with the auto-updated data:

- `GET /api/user-profile/{user_id}` - View auto-updated profile
- `POST /api/user-profile/add-evidence` - Manually add evidence
- `GET /api/user-profile/similar-users/{user_id}` - Find similar users

---

## Qdrant Dashboard Visualization

### Accessing the Dashboard

```
http://localhost:6333/dashboard
```

### What You Can See

1. **Collections View**
   - `user_profiles` collection with vector size 8
   - Number of user points
   - Distance metric: Cosine similarity

2. **Point Details**
   - User ID as point ID
   - 8-dimensional vector (feature weights)
   - Evidence payload with all user feedback

3. **Search Functionality**
   - Find similar users by vector similarity
   - Visual representation of user clusters

### Example Dashboard View

```
Collection: user_profiles
├── Point: demo-user
│   ├── Vector: [0.62, 0.62, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5]
│   └── Payload: {
│       "evidence": [
│         {
│           "feature": "size",
│           "sentence": "The fit is perfect",
│           "sentiment": "positive",
│           "score": 0.9,
│           "timestamp": "2025-11-09T..."
│         }
│       ]
│     }
└── Point: user-123
    ├── Vector: [0.65, 0.60, 0.7, 0.5, 0.3, 0.5, 0.8, 0.5]
    └── Payload: {...}
```

---

## Testing

### Quick Test

```bash
# 1. Start services
./compose_up.sh

# 2. Send a message
curl -X POST http://localhost:8001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"text": "Perfect fit!", "user_id": "demo-user"}'

# 3. View profile
curl http://localhost:8001/api/user-profile/demo-user | jq

# 4. Open dashboard
open http://localhost:6333/dashboard
```

### Automated Test Suite

```bash
# Enter container
docker exec -it cobi-backend-dev bash

# Run tests
python test_sentiment.py
```

---

## Configuration

### Environment Variables Required

```bash
# Required for sentiment analysis
GEMINI_API_KEY=your-gemini-api-key-here

# Qdrant connection (auto-configured in Docker)
QDRANT_HOST=qdrant
QDRANT_PORT=6333
```

### Docker Services

All services are already configured in `compose.yaml`:
- ✅ Qdrant service with port 6333 (dashboard + API)
- ✅ Backend configured with Qdrant environment variables
- ✅ Volume for Qdrant data persistence

---

## Feature Weights Explained

Each user has 8 feature weights ranging from 0.0 to 1.0:

| Weight | Meaning |
|--------|---------|
| 0.0 | Strong negative preference |
| 0.3 | Moderate negative |
| 0.5 | Neutral (default) |
| 0.7 | Moderate positive |
| 1.0 | Strong positive preference |

**Update Algorithm:**
```python
# Exponential moving average with learning rate 0.3
new_weight = current_weight * 0.7 + normalized_score * 0.3
```

This ensures:
- Recent feedback has impact but doesn't completely override history
- Gradual preference learning over time
- Stability against single outlier messages

---

## Future Enhancements

Potential improvements (not implemented yet):

1. **Product Recommendations**
   - Use user profiles to rank products
   - Filter products by preference match
   - Show "Why recommended" explanations

2. **User Clustering**
   - Group users by similar preferences
   - Collaborative filtering recommendations
   - Visual cluster exploration

3. **Time Decay**
   - Older preferences gradually fade
   - Seasonal preference tracking
   - Trend analysis

4. **Real-time Dashboard**
   - WebSocket updates
   - Live preference charts
   - Activity feed

5. **Multi-product Tracking**
   - Category-specific preferences
   - Brand affinity scores
   - Price range optimization

---

## Troubleshooting

### Common Issues

**Issue:** Sentiment features are empty
```json
"sentiment_features": []
```

**Solution:**
- Generic greetings don't trigger analysis
- Try messages mentioning specific features
- Check GEMINI_API_KEY is set

**Issue:** Profile not updating

**Solution:**
```bash
# Check Qdrant is running
docker ps | grep qdrant

# Check backend logs
docker logs cobi-backend-dev

# Verify Qdrant connection
curl http://localhost:6333/
```

**Issue:** Can't access dashboard

**Solution:**
```bash
# Restart Qdrant
docker restart cobi-qdrant-dev

# Check port forwarding
docker port cobi-qdrant-dev
```

---

## Summary

✅ **Implemented:**
- Automatic sentiment analysis on all chat messages
- Real-time user profile updates
- Qdrant vector database integration
- MongoDB persistence
- Comprehensive documentation
- Test suite
- Qdrant dashboard visualization

✅ **Benefits:**
- Personalized user experience
- Data-driven insights
- Scalable vector search
- Visual analytics

✅ **Next Steps:**
- Test the feature using the quick start guide
- Explore Qdrant dashboard
- Build product recommendation engine
- Create user preference analytics

---

**Documentation:**
- [Full Guide](USER_PROFILE_SENTIMENT.md)
- [Quick Start](QUICKSTART_SENTIMENT.md)
- [Main README](../README.md)
