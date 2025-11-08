FROM python:3.11-slim

WORKDIR /cobi/backend

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Set default backend port (can be overridden at runtime)
ENV BACKEND_PORT=8000

# Expose port (dynamically set via ENV)
EXPOSE ${BACKEND_PORT}

# Run FastAPI with uvicorn (port from environment variable)
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port $BACKEND_PORT"]