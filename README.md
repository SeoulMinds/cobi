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

**Important:** You'll need to generate `.env` files from the provided examples before proceeding.

### Clone and Setup

```bash
git clone https://github.com/SeoulMinds/cobi.git
cd cobi
git checkout -b yourname/your-feature  # Use your first name as prefix
```

### Generate Environment Files

Copy the `.env.example` files to create your local configuration:

```bash
# Root .env file (required for Docker Compose)
cp .env.example .env

# Frontend .env.local file (required for Vite)
cp frontend/.env.example frontend/.env.local
```

**Note:** Update the generated `.env` and `frontend/.env.local` files with your actual configuration values (API keys, database credentials, etc.)

###  Running with raw Docker Compose

### Start All Services

```bash
./compose_up.sh
```

This script will:
1. **Initialize**: Run `setup_node_packaging.sh` to generate package-lock.json files
2. **Start Services**: Launch all Docker containers (frontend, backend, MongoDB, Mongo Express, Qdrant)
3. **Install Dependencies**: 
   - Install frontend npm packages
   - Install backend Python packages
4. **Generate Assets**: Create open-source.json for legal compliance

### Stop All Services

```bash
./compose_down.sh
```

To also remove volumes:
```bash
docker compose -f compose.yaml -f compose.override.yaml down -v
```

## Service URLs

After running `./compose_up.sh`, access services at:

- **Frontend**: http://localhost:3000
- **Backend API Docs:** http://localhost:8001/docs (Swagger UI)
- **Mongo Express**: http://localhost:8081
- **Qdrant Dashboard**: http://localhost:6333/dashboard


### Running with Dev Containers in VS Code

**Prerequisite:** Ensure the [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) is installed in VS Code.

1. Open the project folder in VS Code
2. Press `Ctrl + Shift + P` → **Dev Containers: Reopen in Container**
3. Wait for the build to complete

**Note:** This may take several minutes on the first run depending on your machine specs & internet speed.

After the build completes, all services will start automatically. To access the services, use the URLs mentioned above.


### Stop Services

To stop all running services using VScode UI, click on the Dev Containers icon in the bottom-left corner and select **"Close Remote Connection"**.

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

- **Port:** `8001`
- **API Docs:** `http://localhost:8001/docs` (Swagger UI)
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
curl -X POST http://localhost:8001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello AI!", "user_id": "user123"}'
```

### Configuration

#### Generate Environment Files

First, create `.env` files from the examples:

```bash
# Root .env (Docker Compose configuration)
cp .env.example .env

# Frontend .env.local (Vite configuration)
cp frontend/.env.example frontend/.env.local
```

#### Environment Variables

**Root `.env`** (via `.env.example`):
- `MONGODB_URI` - MongoDB connection string
- `FRONTEND_URL` - Frontend URL for CORS
- `OPENAI_API_KEY` - Optional OpenAI API key
- `GEMINI_API_KEY` - Optional Google Gemini API key
- `MONGO_ADMIN_USER` / `MONGO_ADMIN_PASS` - MongoDB credentials
- `JWT_SECRET` - Secret key for JWT tokens
- `SESSION_SECRET` - Secret key for session management

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

Create `frontend/.env.local` from the example file:

```bash
cp frontend/.env.example frontend/.env.local
```

**Frontend `.env.local`** (from `frontend/.env.example`):
```
VITE_API_BASE_URL=http://localhost:8001
VITE_APP_TITLE=seoulminds
VITE_APP_DESCRIPTION=hackseoulminds website
VITE_API_TIMEOUT=10000
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
- **Check:** Backend is accessible: `curl http://localhost:8001/health`
- **Check:** Frontend `.env.local` has `VITE_API_BASE_URL=http://localhost:8001`
- **Fix:** Clear browser cache & restart frontend

### Issue: Ports already in use
- **Check:** `docker ps -a` for existing containers
- **Fix:** Change ports in `.env` or kill existing containers