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

# Set default frontend port (can be overridden at runtime)
ENV FRONTEND_PORT=8080

# Expose port for Vite dev server (dynamically set via ENV)
EXPOSE ${FRONTEND_PORT}

# Health check
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD sh -c "wget --quiet --tries=1 --spider http://localhost:${FRONTEND_PORT}/ || exit 1"

# Default command - can be overridden by compose
CMD ["npm", "run", "dev"]