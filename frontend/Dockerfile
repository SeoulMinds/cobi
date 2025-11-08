# Frontend Dockerfile - Supports both production and development modes
FROM node:22.19.0-alpine

WORKDIR /cobi/frontend

# Install build dependencies
RUN apk add --no-cache git python3 make g++

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Expose port for Vite dev server
EXPOSE 5173

# Health check
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:5173/ || exit 1

# Default command - can be overridden by compose
CMD ["npm", "run", "dev"]