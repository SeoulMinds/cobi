#!/bin/bash
set -e

echo "🚀 Starting COBI services without VSCode Dev Container..."
echo

# Load environment variables
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please create a .env file in the project root."
    exit 1
fi

# Export TAG if not set
export TAG=${TAG:-latest}

echo "📝 Running initialize commands..."
echo

# Step 1: Initialize Command (runs on host before containers)
chmod +x scripts/setup_node_packaging.sh
scripts/setup_node_packaging.sh

echo
echo "🐳 Starting Docker Compose services..."
echo

# Step 2: Start all services
docker compose -f compose.yaml -f compose.override.yaml up -d --build

echo
echo "⏳ Waiting for services to be healthy..."
echo

# Wait for backend to be healthy
echo "Waiting for backend service..."
timeout=60
counter=0
until docker compose -f compose.yaml -f compose.override.yaml ps | grep -q "cobi-backend-${TAG}.*healthy" || [ $counter -eq $timeout ]; do
    sleep 1
    counter=$((counter + 1))
    echo -n "."
done
echo

if [ $counter -eq $timeout ]; then
    echo "⚠️  Warning: Backend service didn't become healthy within ${timeout}s"
else
    echo "✅ Backend service is healthy"
fi

echo
echo "📦 Running post-create commands..."
echo

# Step 3: Post-Create Commands (install dependencies)
echo "Installing frontend dependencies..."
docker compose -f compose.yaml -f compose.override.yaml exec -T frontend sh -c "cd /cobi/frontend && npm install"
echo "✅ Frontend dependencies installed."
echo

echo "Installing backend dependencies..."
docker compose -f compose.yaml -f compose.override.yaml exec -T backend sh -c "cd /cobi/backend && pip install -r requirements.txt"
echo "✅ Backend dependencies installed."
echo

echo "Generating open-source JSON..."
docker compose -f compose.yaml -f compose.override.yaml exec -T frontend sh -c "cd /cobi && node scripts/generate-open-source.js" || echo "⚠️  Warning: generate-open-source failed"
echo "✅ Open-source generation complete."
echo

echo "🎉 All services are up and running!"
echo
echo "📊 Service URLs:"
echo "  - Frontend:      http://localhost:${FRONTEND_PORT:-3000}"
echo "  - Backend:       http://localhost:${BACKEND_PORT:-8001}"
echo "  - Mongo Express: http://localhost:${MONGO_EXPRESS_PORT:-8081}"
echo "  - Qdrant:        http://localhost:${QDRANT_PORT:-6333}"
echo
echo "📋 To view logs, run: docker compose -f compose.yaml -f compose.override.yaml logs -f"
echo "🛑 To stop services, run: ./compose_down.sh"
echo
