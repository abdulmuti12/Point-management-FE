#!/usr/bin/env bash
# Build a deployable standalone output.
#
# `next build` with output:"standalone" emits .next/standalone/ (server.js +
# prod-only node_modules + .next/server) but does NOT include the client
# assets (.next/static) or the public/ folder. This script copies them in so
# the resulting .next/standalone/ directory is self-contained and can be
# shipped to any host as-is.
#
# Run:  ./scripts/build-standalone.sh
# Then: node .next/standalone/server.js   (with PORT + NEXT_PUBLIC_API_URL set)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> next build (output: standalone)"
npm run build

# Copy client static assets.
mkdir -p .next/standalone/.next
rm -rf .next/standalone/.next/static
cp -R .next/static .next/standalone/.next/static

# Copy the public folder (served at the app root by the Next server).
if [ -d public ]; then
  rm -rf .next/standalone/public
  cp -R public .next/standalone/public
fi

echo "==> done. Self-contained output at: .next/standalone/"
echo "    start with:  node .next/standalone/server.js"
