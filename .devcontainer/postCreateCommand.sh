#!/bin/bash

echo "Running custom container postCreateCommand commands..."

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd /cobi/frontend && npm install
echo "Frontend dependencies installation complete."

# Install backend dependencies
echo "Installing backend dependencies..."
cd /cobi/backend && npm install
echo "Backend dependencies installation complete."

# Generate open-source JSON so backend can serve it from public/ for legal compliance
echo "Generating open-source JSON..."
node /cobi/scripts/generate-open-source.js || echo "Warning: generate-open-source failed"
echo "Open-source generation complete."

echo "Done running custom container postCreateCommand commands."