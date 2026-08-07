#!/usr/bin/env bash
set -euo pipefail
echo "[bootstrap] Installing frontend dependencies..."
npm ci
echo "[bootstrap] Installing Playwright browsers..."
npx playwright install chromium --with-deps
echo "[bootstrap] Frontend ready"
