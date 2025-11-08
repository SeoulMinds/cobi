# User Profile Sentiment Analysis & Visualization

## Overview

The COBI shopping assistant now automatically analyzes user responses during chat conversations to extract product feature preferences and update their user profile in real-time. This allows for personalized recommendations based on their sentiment towards different product features.

## Features Tracked

The system tracks user sentiment for 8 core product features:

1. **size** - Fit, sizing preferences
2. **color** - Color preferences
3. **material** - Material quality, fabric preferences
4. **brand** - Brand preferences
5. **price** - Price sensitivity
6. **trend** - Style/trend preferences
7. **durability** - Durability concerns
8. **shipping** - Shipping speed preferences

## How It Works

### 1. User Chats with Assistant

When a user sends a message in the chat (e.g., "The fit is perfect and I love the color!"), the system:

1. Processes the message through Gemini AI for sentiment analysis
2. Extracts mentioned features and sentiment scores
3. Updates the user's profile in Qdrant vector database
4. Syncs the profile to MongoDB for persistence

### 2. Sentiment Analysis

Each user message is analyzed using Gemini's `gemini-2.0-flash-exp` model with low temperature (0.1) for consistent analysis.

**Example Analysis:**
```
User: "핏이 정말 좋아요" (The fit is really good)

Analysis Result:
{
  "features": [
    {
      "feature": "size",
      "sentence": "핏이 정말 좋아요",
      "sentiment": "positive",
      "score": 0.9
    }
  ]
}
```

### 3. Profile Updates

User profiles are stored as vectors in Qdrant where each dimension represents a feature weight (0.0 to 1.0):

- **0.0** = Strong negative preference
- **0.5** = Neutral/No data
- **1.0** = Strong positive preference

Updates use exponential moving average (learning rate: 0.3) to blend old preferences with new evidence:

```python
new_weight = current_weight * (1 - 0.3) + normalized_score * 0.3
```

## API Endpoints

### Chat Endpoint (Auto-Updates Profile)

```bash
POST /api/chat
{
  "text": "The fit is perfect and I love the color!",
  "user_id": "demo-user"
}
```

**Response includes sentiment analysis:**
```json
{
  "id": "...",
  "user_message": "The fit is perfect and I love the color!",
  "ai_response": "...",
  "products": [...],
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

### Get User Profile

```bash
GET /api/user-profile/{user_id}
```

**Response:**
```json
{
  "user_id": "demo-user",
  "feature_weights": {
    "size": 0.87,
    "color": 0.92,
    "material": 0.65,
    "brand": 0.50,
    "price": 0.73,
    "trend": 0.55,
    "durability": 0.50,
    "shipping": 0.80
  },
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

### Manual Evidence Addition

```bash
POST /api/user-profile/add-evidence
{
  "user_id": "demo-user",
  "feature": "size",
  "sentence": "핏이 정말 좋아요",
  "sentiment": "positive",
  "score": 0.9
}
```

### Find Similar Users

```bash
GET /api/user-profile/similar-users/{user_id}?limit=5
```

Returns users with similar preference profiles based on cosine similarity.

## Visualizing Results on Qdrant Dashboard

### Access the Dashboard

1. **Ensure services are running:**
   ```bash
   ./compose_up.sh
   ```

2. **Open Qdrant Web UI:**
   ```
   http://localhost:6333/dashboard
   ```

### View User Profiles

1. **Navigate to Collections:**
   - Click on "Collections" in the left sidebar
   - Select the `user_profiles` collection

2. **Explore Points (User Profiles):**
   - Each point represents a user profile
   - Point ID = user_id (e.g., "demo-user", "u_001")
   - Vector dimensions represent the 8 feature weights

3. **View Vector Data:**
   - Click on any point to see its vector values
   - Each dimension corresponds to a feature:
     ```
     [0]: size
     [1]: color
     [2]: material
     [3]: brand
     [4]: price
     [5]: trend
     [6]: durability
     [7]: shipping
     ```

4. **View Evidence (Payload):**
   - Click on a point
   - Scroll to "Payload" section
   - See the `evidence` array with all user feedback

### Search for Similar Users

1. **Use Search Functionality:**
   - Click "Search" in the Qdrant dashboard
   - Select `user_profiles` collection
   - Enter a user's vector or select a point
   - See similar users ranked by cosine similarity

2. **Visual Similarity:**
   - Users with similar vectors have similar preferences
   - Cosine similarity ranges from 0.0 (different) to 1.0 (identical)

### Monitor Real-Time Updates

1. **Open Dashboard:**
   ```
   http://localhost:6333/dashboard
   ```

2. **Chat with the Assistant:**
   - Open the COBI chat interface
   - Send messages mentioning product features
   - Example: "I love the quality but it's too expensive"

3. **Refresh Qdrant Dashboard:**
   - Navigate to the user's point in the dashboard
   - See updated vector values
   - Check new evidence entries in the payload

## Example Workflow

### Step 1: User Registration
```bash
# User profile is auto-created on first chat with default weights (0.5)
```

### Step 2: User Chats
```bash
User: "The fit is perfect and I love the color!"
```

### Step 3: Automatic Analysis
```bash
# Backend extracts:
# - size: +0.9 (positive)
# - color: +0.9 (positive)
```

### Step 4: Profile Update
```bash
# Qdrant updates:
# size: 0.5 → 0.62 (0.5 * 0.7 + 0.95 * 0.3)
# color: 0.5 → 0.62
```

### Step 5: Visualize in Qdrant
```bash
# Open http://localhost:6333/dashboard
# Navigate to user_profiles → demo-user
# See updated vector [0.62, 0.62, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5]
```

## Testing the Feature

### 1. Start Services
```bash
./compose_up.sh
```

### 2. Chat with Different Sentiments
```bash
# Positive about size
curl -X POST http://localhost:8001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"text": "Perfect fit!", "user_id": "test-user"}'

# Negative about price
curl -X POST http://localhost:8001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"text": "Too expensive", "user_id": "test-user"}'
```

### 3. View Profile
```bash
curl http://localhost:8001/api/user-profile/test-user
```

### 4. Check Qdrant Dashboard
```
http://localhost:6333/dashboard
```

## Dashboard Screenshots Guide

### Collection View
- Shows all user profiles
- Number of points = number of users
- Vector size = 8 (for 8 features)

### Point Detail View
- **ID**: User identifier
- **Vector**: 8-dimensional array of feature weights
- **Payload**: Evidence array with all user feedback

### Search View
- Query by vector to find similar users
- Cosine similarity metric
- Results show matching users with similarity scores

## Troubleshooting

### Profile Not Updating
1. Check backend logs for sentiment analysis errors
2. Verify Gemini API key is set: `echo $GEMINI_API_KEY`
3. Ensure Qdrant is running: `docker ps | grep qdrant`

### Can't Access Dashboard
1. Check if Qdrant is running: `docker ps | grep qdrant`
2. Verify port 6333 is accessible: `curl http://localhost:6333/`
3. Check firewall settings

### No Sentiment Features Extracted
1. User messages must mention product features
2. Generic greetings won't trigger analysis
3. Check `sentiment_features` in API response

## Architecture

```
User Chat
    ↓
Gemini AI (Product Recommendations)
    ↓
Sentiment Analyzer (Feature Extraction)
    ↓
Qdrant Service (Vector Update)
    ↓
MongoDB (Persistence)
    ↓
Qdrant Dashboard (Visualization)
```

