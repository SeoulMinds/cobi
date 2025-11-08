#!/bin/bash
set -e

echo "🛑 Stopping COBI services..."
echo

# Export TAG if not set
export TAG=${TAG:-latest}

# Stop all services
docker compose -f compose.yaml -f compose.override.yaml down

echo
echo "✅ All services have been stopped."
echo
echo "💡 To remove volumes as well, run:"
echo "   docker compose -f compose.yaml -f compose.override.yaml down -v"
echo
