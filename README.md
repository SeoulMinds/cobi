# SeoulMinds Night Action

A full-stack AI-driven web application built for **HackSeoul 2025**.

**Tech Stack:**
- 🔙 Backend: FastAPI + Python + MongoDB
- 🎨 Frontend: React + Vite + TypeScript + TailwindCSS
- 🗄️ Database: MongoDB
- 🐳 Containerization: Docker & Docker Compose with Dev Containers

---

## Getting Started

### Prerequisites
Complete the Development Machine Setup Guide first (ensure Docker Desktop and VS Code are installed).

### Clone and Setup

```bash
git clone https://github.com/SeoulMinds/seoulminds-night-action.git
cd seoulminds-night-action
git checkout -b yourname/your-feature  # Use your first name as prefix
```

### Open in VS Code Dev Container

1. Open the project folder in VS Code
2. Press `Ctrl + Shift + P` → **Dev Containers: Reopen in Container**
3. Wait for the build to complete

**Note:** This may take several minutes on the first run depending on your machine specs & internet speed.

After the build completes, all services will start automatically.

### Access the Application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs (Swagger UI)
- **Database (Mongo Express):** http://localhost:8081

### Stop Services

To stop all running services:

```bash
docker compose down
```

---

## Project Structure

```
.
├── backend/                    # FastAPI backend
│   ├── main.py                 # Main FastAPI application
│   ├── requirements.txt         # Python dependencies
│   └── Dockerfile              # Backend container config
│
├── frontend/                   # React (Vite) frontend
│   ├── src/
│   │   ├── App.tsx            # Main app component
│   │   ├── main.tsx           # React entry point
│   │   ├── api.ts             # API client
│   │   └── index.css          # Tailwind styles
│   ├── package.json            # Node dependencies
│   ├── vite.config.ts         # Vite configuration
│   ├── tailwind.config.js     # Tailwind configuration
│   └── Dockerfile              # Frontend container config
│
├── compose.yaml                # Main Docker Compose file
├── compose.override.yaml       # Development overrides (auto-reload, volumes)
├── compose.prod.yaml           # Production overrides
├── .env                        # Environment variables (populated)
└── .env.example                # Template for .env
```

---

## Backend (FastAPI)

### Architecture

- **Port:** `8000`
- **API Docs:** `http://localhost:8000/docs` (Swagger UI)
- **Health Check:** `GET /health`

### Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Root endpoint |
| `GET` | `/health` | Health check + MongoDB status |
| `POST` | `/api/chat` | Send message & get AI response |
| `GET` | `/api/messages` | Retrieve message history |

### Example: Send Message

```bash
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello AI!", "user_id": "user123"}'
```

### Configuration

Environment variables (via `.env`):
- `MONGODB_URI` - MongoDB connection string
- `FRONTEND_URL` - Frontend URL for CORS
- `OPENAI_API_KEY` - Optional OpenAI API key
- `GEMINI_API_KEY` - Optional Google Gemini API key

---

## Frontend (React + Vite)

### Architecture

- **Port:** `3000`
- **Build Tool:** Vite
- **Styling:** TailwindCSS
- **Type Safety:** TypeScript

### Key Components

- `App.tsx` - Main chat interface
- `api.ts` - HTTP client with Axios

### Development

```bash
# Navigate to frontend folder
cd frontend

# Install dependencies
npm install

# Start dev server (auto-reload)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Environment Variables

Create `frontend/.env.local` for development:
```
VITE_API_BASE_URL=http://localhost:8000
```

---



## Integration Guide

### Add OpenAI/Gemini Support

Update `backend/main.py` in the `send_message` route:

```python
from openai import AsyncOpenAI
from google.generativeai import GenerativeAI

# Initialize clients with API keys
openai_client = AsyncOpenAI(api_key=OPENAI_API_KEY)
gemini_model = GenerativeAI(api_key=GEMINI_API_KEY)

# In send_message function:
if OPENAI_API_KEY:
    response = await openai_client.chat.completions.create(
        model="gpt-4",
        messages=[{"role": "user", "content": request.text}]
    )
    ai_response = response.choices[0].message.content
```

---

## Troubleshooting

### Issue: Backend can't connect to MongoDB
- **Check:** `.env` has correct `MONGODB_URI`
- **Check:** MongoDB container is running: `docker compose ps`
- **Fix:** `docker compose down && docker compose up --build`

### Issue: Frontend can't reach Backend
- **Check:** Backend is accessible: `curl http://localhost:8000/health`
- **Check:** Frontend `.env.local` has `VITE_API_BASE_URL=http://localhost:8000`
- **Fix:** Clear browser cache & restart frontend

### Issue: Ports already in use
- **Check:** `docker ps -a` for existing containers
- **Fix:** Change ports in `.env` or kill existing containers