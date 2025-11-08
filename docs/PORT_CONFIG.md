# Port Configuration

## Port Setup

React frontend is now on **port 3000** (React development standard).

| Service | Port | URL |
|---------|------|-----|
| Frontend (React) | 3000 | `http://localhost:3000` |
| Backend (FastAPI) | 8001 | `http://localhost:8001` |
| Mongo Express | 8081 | `http://localhost:8081` |
| MongoDB | 27017 | `localhost:27017` (internal) |

## Configuration Files

### `.env`
```properties
FRONTEND_PORT=3000    # React standard port
BACKEND_PORT=8001
MONGO_EXPRESS_PORT=8081
```

## How It Works

- **Inside the container**: Vite (React dev server) runs on port **5173**
- **From your machine**: Docker port mapping exposes it as port **3000**

This is the standard React development port convention.

## To Apply Changes

```bash
# Stop and remove existing containers
docker compose down

# Rebuild with new configuration
docker compose up --build
```

## Accessing the Services

Once running:
- **Frontend**: Open your browser to `http://localhost:3000`
- **Backend API**: `http://localhost:8001`
- **Mongo Express**: `http://localhost:8081`

## Custom Port

If port 3000 is already in use, edit `.env`:

```properties
FRONTEND_PORT=3001  # Or any available port
```

Then access at `http://localhost:3001`

