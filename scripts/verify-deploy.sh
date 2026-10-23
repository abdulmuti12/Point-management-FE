#!/usr/bin/env bash
# verify-deploy.sh — post-deploy health check (run on the deploy server)
#
# Checks that the Next.js app responds at the expected URL and that the
# JS chunks referenced by the login page are not returning 404.
#
# Usage:
#   bash verify-deploy.sh [APP_URL]
#
# Exits 0 on success, 1 on failure.

set -euo pipefail

APP_URL="${1:-http://127.0.0.1:3003}"

LOGIN_CODE="$(curl -s -o /dev/null -w "%{http_code}" "${APP_URL}/login")"
echo "login page: HTTP ${LOGIN_CODE}"

# Extract up to 3 chunk JS paths from the login HTML and check each one.
# The regex matches chunk file paths without embedding a bare ] inside a
# double-quoted string (the previous one-liner's bug).
CHUNKS="$(curl -s "${APP_URL}/login" \
  | grep -oE '/_next/static/chunks/[^/]+\.js' \
  | head -3 \
  | while read -r p; do
      curl -s -o /dev/null -w "%{http_code} " "${APP_URL}${p}"
    done)"
echo "chunk status: ${CHUNKS}"

if [[ "${LOGIN_CODE}" == "200" ]] && ! grep -q 404 <<<"${CHUNKS}"; then
  echo "POST_DEPLOY_CHECK: OK"
else
  echo "POST_DEPLOY_CHECK: FAILED"
  exit 1
fi
