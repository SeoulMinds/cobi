# SeoulMinds (Cobi)

An AI-powered eCommerce platform built in 24 hours for **HackSeoul 2025**.

**Tech Stack:**
- 🔙 **Backend:** FastAPI + Python 3.11 + MongoDB + Motor (async driver)
- 🤖 **AI/LLM:** Google Gemini 2.5 Flash via LangChain
- 🔍 **Vector Search:** Qdrant for semantic product search
- 🎨 **Frontend:** React 18 + Vite + TypeScript + TailwindCSS + shadcn/ui
- 🗄️ **Database:** MongoDB 8.0 + Mongo Express (admin UI)
- 🐳 **Containerization:** Docker & Docker Compose with Dev Containers
- 🔐 **Security:** JWT authentication, bcrypt password hashing

---

## Demo & pitch deck

- Demo video:

![Cobi Demo](./assets/cobi_demo_final.mp4)

- Pitch deck: [Cobi_HackSeoul2025_PitchDeck.pdf](./assets/hackseoul2025%20pitch%20deck_v2.pdf)

## Getting Started

### Prerequisites
- Docker Desktop installed and running
- VS Code (optional, for Dev Container support)
- Git
- **Note:** For Windows users, our scripts require a Unix-like environment. Install WSL (Windows Subsystem for Linux) to ensure compatibility. Follow the [official guide](https://learn.microsoft.com/en-us/windows/wsl/install) for setup.

### Clone and Setup

```bash
git clone https://github.com/SeoulMinds/cobi.git
cd cobi
git checkout -b yourname/your-feature  # Use your first name as prefix

# Generate environment configuration
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY and other configuration
```

**Important:** Update the `.env` file with your actual values:
- `GEMINI_API_KEY` - Get yours at https://makersuite.google.com/app/apikey
- Database credentials (auto-generated or customize as needed)
- Ports (defaults should work for most cases)

---

## Running the Application

### Option 1: Raw Docker Compose (Recommended for Production-like Setup)

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

---

### Option 2: Dev Containers in VS Code (Recommended for Development)

**Prerequisite:** Ensure the [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) is installed in VS Code.

1. Open the project folder in VS Code
2. Press `Ctrl + Shift + P` → **Dev Containers: Reopen in Container**
3. Wait for the build to complete

**Note:** This may take several minutes on the first run depending on your machine specs & internet speed.

After the build completes, all services will start automatically.

---

### Service URLs

Regardless of which method you use, access services at:

- **Frontend**: http://localhost:3000
- **Backend API Docs**: http://localhost:8001/docs (Swagger UI)
- **Mongo Express**: http://localhost:8081
- **Qdrant Dashboard**: http://localhost:6333/dashboard

---

## Project Structure

```
.
├── backend/                    # FastAPI backend
│   ├── main.py                 # Main FastAPI application
│   ├── requirements.txt         # Python dependencies
│   ├── Dockerfile              # Backend container config
│   │
│   ├── db/                     # Database layer
│   │   ├── connection.py       # MongoDB connection handling
│   │   ├── models.py           # Pydantic models & schemas
│   │   └── seeder.py           # Database seeding utilities
│   │
│   ├── llm_api/                # AI/LLM Integration
│   │   ├── gemini_service.py   # Google Gemini service (LangChain)
│   │   ├── product_context.py  # Product search & context building
│   │   └── prompts.py          # AI system prompts
│   │
│   ├── routers/                # API route handlers
│   │   ├── products.py         # Product endpoints
│   │   ├── users.py            # User endpoints
│   │   └── user_profile.py     # User profile & preferences
│   │
│   ├── vector_db/              # Vector database integration
│   │   └── qdrant_service.py   # Qdrant vector search
│   │
│   └── utils/                  # Utilities & seed data
│       ├── db_seed.json        # Product seed data
│       └── user_profile_seed.json  # User profile seed data
│
├── frontend/                   # React (Vite) frontend
│   ├── src/
│   │   ├── App.tsx            # Main app component
│   │   ├── main.tsx           # React entry point
│   │   ├── api.ts             # API client
│   │   ├── index.css          # Tailwind styles
│   │   │
│   │   ├── components/        # React components
│   │   │   ├── ChatAssistant.tsx  # AI chat interface
│   │   │   ├── ProductCard.tsx    # Product display
│   │   │   └── ui/            # shadcn/ui components
│   │   │
│   │   ├── pages/             # Page components
│   │   │   ├── Index.tsx      # Home/Products page
│   │   │   ├── ProductDetail.tsx  # Product detail page
│   │   │   └── UserProfile.tsx    # User profile page
│   │   │
│   │   └── lib/               # Utilities
│   │       ├── api.ts         # API utilities
│   │       └── utils.ts       # Helper functions
│   │
│   ├── package.json            # Node dependencies
│   ├── vite.config.ts         # Vite configuration
│   ├── tailwind.config.ts     # Tailwind configuration
│   └── Dockerfile              # Frontend container config
│
├── .devcontainer/              # VSCode Dev Container config
│   ├── devcontainer.json       # Dev container definition
│   ├── Dockerfile.devcontainer # Dev container Dockerfile
│   └── *.sh                    # Lifecycle scripts
│
├── scripts/                    # Utility scripts
│   ├── generate-open-source.js # Generate OSS attribution
│   └── setup_node_packaging.sh # Package lock generation
│
├── compose.yaml                # Main Docker Compose file
├── compose.override.yaml       # Development overrides
├── compose.devcontainer.yaml   # Dev container service
├── compose.prod.yaml           # Production overrides
├── compose_up.sh               # Start services (raw Docker)
├── compose_down.sh             # Stop services (raw Docker)
├── .env                        # Environment variables (generated)
└── .env.example                # Environment template
```

---

## Backend (FastAPI)

### Architecture

- **Port:** `8001`
- **API Docs:** `http://localhost:8001/docs` (Swagger UI)
- **Health Check:** `GET /health`
- **AI Model:** Google Gemini 2.5 Flash (via LangChain)
- **Vector Database:** Qdrant (for product search)

### Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Root endpoint |
| `GET` | `/health` | Health check + MongoDB status |
| `POST` | `/api/chat` | Send message & get AI shopping assistant response (with auto sentiment analysis) |
| `GET` | `/api/messages` | Retrieve message history |
| `GET` | `/api/products` | List products (with search & pagination) |
| `GET` | `/api/products/{id}` | Get product details by ID |
| `GET` | `/api/users` | List users (paginated) |
| `GET` | `/api/user-profile/{user_id}` | Get user profile & shopping preferences |
| `POST` | `/api/user-profile/add-evidence` | Manually add user preference evidence |
| `GET` | `/api/user-profile/similar-users/{user_id}` | Find users with similar preferences |

### 🎯 New Feature: Sentiment-Based User Profile Updates

The chat assistant now automatically analyzes user messages to extract product feature preferences and update their profile in real-time!

**How it works:**
1. User chats: "The fit is perfect and I love the color!"
2. AI analyzes sentiment for features (size, color, material, brand, price, trend, durability, shipping)
3. User profile is automatically updated in Qdrant vector database
4. Visualize changes in Qdrant Dashboard: http://localhost:6333/dashboard

**Tracked Features:**
- 👕 **size** - Fit and sizing preferences
- 🎨 **color** - Color preferences
- 🧵 **material** - Material quality preferences
- 🏷️ **brand** - Brand preferences
- 💰 **price** - Price sensitivity
- ✨ **trend** - Style/trend preferences
- 🛡️ **durability** - Durability concerns
- 📦 **shipping** - Shipping speed preferences

**See it in action:**
```bash
# Chat with sentiment analysis
curl -X POST http://localhost:8001/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Perfect fit and I love the quality!",
    "user_id": "demo-user"
  }'

# View updated profile
curl http://localhost:8001/api/user-profile/demo-user

# Find similar users
curl http://localhost:8001/api/user-profile/similar-users/demo-user?limit=5
```

**📊 Visualize in Qdrant Dashboard:**
1. Open http://localhost:6333/dashboard
2. Navigate to `user_profiles` collection
3. Click on any user point to see their preference vector
4. View evidence history in the payload

For detailed documentation, see: [User Profile Sentiment Analysis Guide](docs/USER_PROFILE_SENTIMENT.md)

### Example: Chat with AI Shopping Assistant

```bash
# Simple greeting
curl -X POST http://localhost:8001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello!", "user_id": "user123"}'

# Product search query
curl -X POST http://localhost:8001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"text": "I need running shoes under 60000 KRW", "user_id": "user123"}'
```

### Example: Search Products

```bash
# Search by query
curl "http://localhost:8001/api/products?q=laptop&page=1&limit=10"
```

### Environment Variables Reference

All configuration is in the root `.env` file:

##### Database Configuration
- `MONGODB_URI` - MongoDB connection string
- `MONGO_ADMIN_USER` - MongoDB admin username
- `MONGO_ADMIN_PASS` - MongoDB admin password
- `MONGODB_PORT` - MongoDB port (default: 27017)
- `MONGODB_DATABASE` - Database name

##### AI/LLM Configuration
- `GEMINI_API_KEY` - **REQUIRED** Google Gemini API key for AI shopping assistant
  - Get [yours](https://makersuite.google.com/app/apikey).
  - Used for product recommendations and conversational AI
  - Falls back to mock responses if not provided

##### Frontend/Backend Ports
- `FRONTEND_PORT` - Frontend port (default: 3000)
- `BACKEND_PORT` - Backend API port (default: 8001)
- `FRONTEND_URL` - Frontend URL for CORS (auto-configured from FRONTEND_PORT)

##### Security
- `SESSION_SECRET` - Secret key for session management
- `BCRYPT_ROUNDS` - Password hashing rounds

##### Qdrant (Vector Database)
- `QDRANT_HOST` - Qdrant hostname (default: qdrant)
- `QDRANT_PORT` - Qdrant port (default: 6333)

**Note:** The `OPENAI_API_KEY` is defined but not currently used. The application uses Google Gemini for AI features.

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

**Note:** Frontend environment variables are configured through the root `.env` file and automatically passed to the frontend container via Docker Compose.

---

## AI Shopping Assistant Implementation

### How It Works

The application uses **Google Gemini 2.5 Flash** via LangChain for intelligent product recommendations:

1. **User Query Processing**
   - User sends a message (e.g., "I need running shoes under 60000 KRW")
   - Query is analyzed to extract search criteria (keywords, price range, category)

2. **Product Search**
   - Relevant products are searched from MongoDB
   - Results are ranked by relevance to user query
   - Top 5 products are selected as context

3. **AI Response Generation**
   - Product context is formatted for Gemini
   - System prompt defines COBI as a friendly shopping assistant
   - Gemini generates personalized recommendations with explanations

4. **Response Structure**
   - AI response with product recommendations
   - List of recommended products with details
   - Conversation stored in MongoDB for history

### Configuration

Set your Gemini API key in `.env`:

```bash
GEMINI_API_KEY=your_actual_api_key_here
```

[**Get your API key**](https://makersuite.google.com/app/apikey)

### Features

- ✅ **Context-Aware Recommendations** - Considers user preferences and past behavior
- ✅ **Natural Language Processing** - Understands complex queries with price ranges, categories, brands
- ✅ **Personalized Responses** - Explains WHY products are recommended
- ✅ **Intelligent Greetings** - Doesn't recommend products for simple greetings
- ✅ **Fallback Support** - Works with or without Gemini API key (mock responses)

### Customizing AI Behavior

Edit prompts in `backend/llm_api/prompts.py`:

```python
SHOPPING_ASSISTANT_SYSTEM_PROMPT = """You are COBI, a helpful shopping assistant...
```

---

---

## Troubleshooting

### Issue: Backend can't connect to MongoDB
- **Check:** `.env` has correct `MONGODB_URI`
- **Check:** MongoDB container is running: `docker compose ps`
- **Fix:** `docker compose -f compose.yaml -f compose.override.yaml down && docker compose -f compose.yaml -f compose.override.yaml up --build`

### Issue: Frontend can't reach Backend
- **Check:** Backend is accessible: `curl http://localhost:8001/health`
- **Check:** Root `.env` has correct `BACKEND_PORT=8001`
- **Fix:** Restart services with `./compose_down.sh && ./compose_up.sh`

### Issue: AI Assistant not working (returns "Echo" responses)
- **Check:** `GEMINI_API_KEY` is set in `.env`
- **Check:** Backend logs for Gemini errors: `docker compose -f compose.yaml -f compose.override.yaml logs backend`
- **Check:** API key is [valid](https://makersuite.google.com/app/apikey).
- **Note:** If Gemini is unavailable, the app falls back to mock responses

### Issue: Ports already in use
- **Check:** `docker ps -a` for existing containers
- **Fix:** Change ports in `.env` or kill existing containers

### Issue: Dependencies not installing during startup
- **Check:** Docker build logs for errors
- **Fix:** 
  ```bash
  docker compose -f compose.yaml -f compose.override.yaml exec frontend npm install
  docker compose -f compose.yaml -f compose.override.yaml exec backend pip install -r requirements.txt
  ```

## Learn More
- [More Documentation about Feature](/docs/README.md)

## Contributers
- @MussaCharles
- @imbibekk
- @EdenKangdw
- @Jayun Won