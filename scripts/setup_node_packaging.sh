#!/bin/bash
set -e

echo "🔧 Setup Node packaging script Triggered"

# Move to project root (works inside/outside container)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${SCRIPT_DIR}/.."
cd "$PROJECT_ROOT"

# Apply ownership to entire workspace early so it covers all backends
chown -R ${USERNAME}:${GID} "$PROJECT_ROOT" 2>/dev/null || true

# --- Node backend: generate package-lock.json if needed (idempotent) ---
NODE_DIR="backend"
if [ -d "$NODE_DIR" ]; then
  if command -v npm >/dev/null 2>&1; then
    pushd "$NODE_DIR" >/dev/null || true
    if [ -f package.json ]; then
      if [ ! -f package-lock.json ] || [ package.json -nt package-lock.json ]; then
        echo "🔧 Generating package-lock.json for $NODE_DIR..."
        npm i --package-lock-only
      else
        echo "🔍 package-lock.json up to date for $NODE_DIR"
      fi
    else
      echo "⚠️ package.json not found in $NODE_DIR, skipping npm lock generation"
    fi
    popd >/dev/null || true
  else
    echo "⚠️ npm not found, skipping backend lock generation"
  fi
else
  echo "🔍 $NODE_DIR not found, skipping node backend step"
fi

# --- Frontend Vue: generate package-lock.json if needed (idempotent) ---
FRONTEND_DIR="frontend"
if [ -d "$FRONTEND_DIR" ]; then
  if command -v npm >/dev/null 2>&1; then
    pushd "$FRONTEND_DIR" >/dev/null || true
    if [ -f package.json ]; then
      if [ ! -f package-lock.json ] || [ package.json -nt package-lock.json ]; then
        echo "🔧 Generating package-lock.json for $FRONTEND_DIR..."
        npm i --package-lock-only
      else
        echo "🔍 package-lock.json up to date for $FRONTEND_DIR"
      fi
    else
      echo "⚠️ package.json not found in $FRONTEND_DIR, skipping npm lock generation"
    fi
    popd >/dev/null || true
  else
    echo "⚠️ npm not found, skipping frontend lock generation"
  fi
else
  echo "🔍 $FRONTEND_DIR not found, skipping frontend step"
fi
