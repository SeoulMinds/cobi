# FastAPI Backend

## Overview

This is the FastAPI backend for the SeoulMinds Night Action project. It provides REST APIs for:
- Chat messages with AI integration (OpenAI/Gemini)
- Message history retrieval
- Health checks and monitoring

## Setup

### Local Development

```bash
# Install dependencies
pip install -r requirements.txt

# Set environment variables
export MONGODB_URI=mongodb://seoulminds:password@localhost:27017/seoulminds_db?authSource=admin
export FRONTEND_URL=http://localhost:5173

# Run the server
uvicorn main:app --reload --host 0.0.0.0 --port 8001
```

### Docker

```bash
docker build -t seoulminds-backend .
docker run -p 8001:8001 \
  -e MONGODB_URI=mongodb://db:27017/seoulminds_db \
  -e FRONTEND_URL=http://localhost:5173 \
  seoulminds-backend
```

## API Endpoints

### Health Check
```
GET /health
Response:
{
  "status": "healthy",
  "mongodb": "connected"
}
```

### Send Message
```
POST /api/chat
Body:
{
  "text": "Your message here",
  "user_id": "optional-user-id"
}

Response:
{
  "id": "message-id",
  "user_message": "Your message here",
  "ai_response": "AI response",
  "model": "openai|gemini|mock"
}
```

### Get Messages
```
GET /api/messages?user_id=optional&limit=50
Response:
{
  "messages": [...],
  "count": 5
}
```

## Integration with AI APIs

### OpenAI

1. Set `OPENAI_API_KEY` environment variable
2. Update `send_message` endpoint to use OpenAI client (see code comments)

### Google Gemini

1. Set `GEMINI_API_KEY` environment variable
2. Update `send_message` endpoint to use Gemini client (see code comments)

## Database

Uses MongoDB with motor (async driver). Collections:
- `messages` - Chat messages (auto-created)
- `users` - User profiles (ready to implement)
- `sessions` - Session data (ready to implement)

## Dependencies

See `requirements.txt` for all packages. Key ones:
- `fastapi` - Web framework
- `uvicorn` - ASGI server
- `motor` - Async MongoDB driver
- `pydantic` - Data validation

---

**Happy coding! 🚀**
