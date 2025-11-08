# Quick Start: Testing User Profile Sentiment Analysis

This guide will help you quickly test the sentiment analysis and user profile update feature.

## Prerequisites

Make sure the services are running:
```bash
./compose_up.sh
```

Wait for all services to start, then verify:
```bash
# Check all services are running
docker ps

# Should see:
# - cobi-backend-dev
# - cobi-frontend-dev
# - cobi-mongodb-dev
# - cobi-qdrant-dev
# - cobi-mongo-express-dev
```

## Step 1: Test Chat with Sentiment Analysis

Open your terminal and send a chat message:

```bash
curl -X POST http://localhost:8001/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "text": "The fit is perfect and I love the color!",
    "user_id": "demo-user"
  }'
```

**Expected Response:**
```json
{
  "id": "...",
  "user_message": "The fit is perfect and I love the color!",
  "ai_response": "...",
  "model": "gemini-2.5-flash",
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

## Step 2: View Updated User Profile

```bash
curl http://localhost:8001/api/user-profile/demo-user | jq
```

**Expected Response:**
```json
{
  "user_id": "demo-user",
  "feature_weights": {
    "size": 0.62,      // Updated from 0.5!
    "color": 0.62,     // Updated from 0.5!
    "material": 0.5,
    "brand": 0.5,
    "price": 0.5,
    "trend": 0.5,
    "durability": 0.5,
    "shipping": 0.5
  },
  "evidence": [
    {
      "feature": "size",
      "sentence": "The fit is perfect",
      "sentiment": "positive",
      "score": 0.9,
      "timestamp": "2025-11-09T..."
    },
    {
      "feature": "color",
      "sentence": "I love the color",
      "sentiment": "positive",
      "score": 0.9,
      "timestamp": "2025-11-09T..."
    }
  ]
}
```

## Step 3: Visualize in Qdrant Dashboard

1. **Open the Dashboard:**
   ```
   http://localhost:6333/dashboard
   ```

2. **Navigate to Collections:**
   - Click "Collections" in the left sidebar
   - You should see `user_profiles` collection

3. **View User Points:**
   - Click on `user_profiles` collection
   - You'll see all user profiles as points
   - Look for point ID: `demo-user`

4. **Inspect the Profile:**
   - Click on the `demo-user` point
   - View the **Vector** (8 dimensions):
     ```
     [0.62, 0.62, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5]
     ```
     Position 0 = size (0.62)
     Position 1 = color (0.62)
     ... and so on
   
   - View the **Payload** (evidence array):
     ```json
     {
       "evidence": [
         {
           "feature": "size",
           "sentence": "The fit is perfect",
           "sentiment": "positive",
           "score": 0.9,
           "timestamp": "..."
         },
         ...
       ]
     }
     ```

## Step 4: Test More Sentiments

### Negative Sentiment (Price)
```bash
curl -X POST http://localhost:8001/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "text": "This is way too expensive for what you get",
    "user_id": "demo-user"
  }'
```

Check the profile again:
```bash
curl http://localhost:8001/api/user-profile/demo-user | jq '.feature_weights.price'
# Should be < 0.5 (negative sentiment lowers the weight)
```

### Korean Language Test
```bash
curl -X POST http://localhost:8001/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "text": "핏이 정말 좋아요",
    "user_id": "demo-user"
  }'
```

### Mixed Sentiment
```bash
curl -X POST http://localhost:8001/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Great brand and excellent material but shipping was slow",
    "user_id": "demo-user"
  }'
```

## Step 5: Find Similar Users

After creating multiple user profiles, find similar ones:

```bash
curl http://localhost:8001/api/user-profile/similar-users/demo-user?limit=5 | jq
```

**Expected Response:**
```json
{
  "user_id": "demo-user",
  "similar_users": [
    {
      "user_id": "user-123",
      "similarity": 0.95,
      "feature_weights": {
        "size": 0.65,
        "color": 0.60,
        ...
      }
    }
  ],
  "count": 1
}
```

## Step 6: Test from Frontend

1. **Open the App:**
   ```
   http://localhost:3000
   ```

2. **Open Chat:**
   - Click the chat bubble icon in the bottom-right
   
3. **Send Messages:**
   - "The fit is perfect and I love the color!"
   - "Too expensive for the quality"
   - "Great brand but shipping is slow"

4. **Check Qdrant Dashboard:**
   - Refresh the `user_profiles` collection
   - See the `demo-user` point updated in real-time

## Troubleshooting

### No sentiment features extracted
**Symptom:** `sentiment_features: []` in response

**Solution:**
- Make sure GEMINI_API_KEY is set in `.env`
- Try more explicit messages mentioning product features
- Generic greetings won't extract features

### Profile not updating
**Symptom:** Feature weights remain at 0.5

**Solution:**
- Check backend logs: `docker logs cobi-backend-dev`
- Verify Qdrant is running: `docker ps | grep qdrant`
- Check Qdrant connection: `curl http://localhost:6333/`

### Can't access Qdrant Dashboard
**Symptom:** Dashboard not loading

**Solution:**
```bash
# Check if Qdrant is running
docker ps | grep qdrant

# Restart Qdrant
docker restart cobi-qdrant-dev

# Check logs
docker logs cobi-qdrant-dev
```

## Advanced Testing

### Run the Test Suite

```bash
# Enter backend container
docker exec -it cobi-backend-dev bash

# Run test script
python test_sentiment.py
```

This will:
1. Test sentiment analysis on various messages
2. Create a test user profile
3. Add evidence and show updates
4. Find similar users
5. Print Qdrant dashboard link

### Monitor Real-Time Updates

Open two terminal windows:

**Terminal 1 - Send Messages:**
```bash
while true; do
  curl -X POST http://localhost:8001/api/chat \
    -H "Content-Type: application/json" \
    -d "{\"text\": \"Test $(date)\", \"user_id\": \"demo-user\"}"
  sleep 5
done
```

**Terminal 2 - Watch Profile:**
```bash
watch -n 2 'curl -s http://localhost:8001/api/user-profile/demo-user | jq .feature_weights'
```

**Browser - Qdrant Dashboard:**
Keep refreshing the dashboard to see updates visually!

## Next Steps

1. ✅ Test basic sentiment analysis
2. ✅ View profiles in Qdrant Dashboard
3. ✅ Test from frontend chat interface
4. 🎯 Create multiple user profiles with different preferences
5. 🎯 Test similar user recommendations
6. 🎯 Build personalized product recommendations based on profiles

## Learn More

- [Full Documentation](USER_PROFILE_SENTIMENT.md)
- [Qdrant Documentation](https://qdrant.tech/documentation/)
- [Gemini API](https://ai.google.dev/docs)
