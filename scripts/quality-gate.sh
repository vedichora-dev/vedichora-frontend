#!/usr/bin/env bash
set -euo pipefail

echo "[1/4] Install"
npm ci

echo "[2/4] TypeScript check"
npx tsc --noEmit

echo "[3/4] Build"
npm run build

echo "[4/4] Secret scan"
if grep -rn "ghp_\|sk-ant-\|RAILWAY_TOKEN" src/ 2>/dev/null | grep -v ".env"; then
  echo "ERROR: Possible secret in source!"
  exit 1
fi

echo ""
echo "WEB QUALITY GATE PASSED"
