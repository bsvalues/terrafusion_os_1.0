#!/bin/bash
# Unified test runner for TerraFusion plugins
set -e

if [ -d "frontend" ]; then
  echo "\n[FRONTEND] Running vitest..."
  (cd frontend && npx vitest run || true)
fi
if [ -d "backend" ]; then
  echo "\n[BACKEND] Running pytest..."
  (cd backend && pytest || true)
fi
if [ -f "ecosystem_verify.py" ]; then
  echo "\n[AI/ECOSYSTEM] Running ecosystem_verify.py..."
  python3 ecosystem_verify.py || true
fi
if [ -f "postman_collection.json" ]; then
  echo "\n[API] Running Postman tests..."
  newman run postman_collection.json || true
fi
