#!/usr/bin/env bash
# deploy.sh — Point-management-FE production deployment
#
# Invoked by the GitHub Actions workflow (.github/workflows/deploy.yml)
# via:  DEPLOY_COMMIT="<sha>" REPO_URL="<url>" bash /var/www/html/Point-management-FE-deploy/scripts/deploy.sh
#
# Every stage is logged as:
#   [stage] description
#   FATAL [stage] line N: reason (exit code X)
# Secrets are never echoed and never expand into logs (no set -x).

set -euo pipefail

# ── Paths ─────────────────────────────────────────────────────────────────────
DEPLOY_BASE="/var/www/html/Point-management-FE-deploy"
RELEASES_DIR="${DEPLOY_BASE}/releases"
SHARED_DIR="${DEPLOY_BASE}/shared"
CURRENT_LINK="${DEPLOY_BASE}/current"
SCRIPTS_DIR="${DEPLOY_BASE}/scripts"
LOCK_FILE="${SCRIPTS_DIR}/.deploy.lock"
LOG_DIR="${DEPLOY_BASE}/logs"

REPO_URL="${REPO_URL:-git@github.com:abdulmuti12/point-management-frontend.git}"
DEPLOY_COMMIT="${DEPLOY_COMMIT:-}"
PORT="3003"
HEALTH_URL="http://127.0.0.1:${PORT}"
HEALTH_RETRIES=15
HEALTH_SLEEP=3

# ── Helpers: stage + fatal diagnostics ────────────────────────────────────────
STAGE=""
stage() { STAGE="$1"; echo ""; echo "==== [$STAGE] $2 ===="; }
fatal() { # $1=reason  $2=optional context (never include secrets)
  echo ""
  echo "FATAL [${STAGE:-startup}] line ${1:-?}: $2"
  exit 1
}

trap 'echo "FATAL [${STAGE:-script}] line $LINENO: command failed (exit ${?}): ${BASH_COMMAND}"' ERR
trap 'rm -f "${LOCK_FILE}"' EXIT

# ── [0] Config validation ─────────────────────────────────────────────────────
stage 0 "Config validation"
echo "  deploy base: ${DEPLOY_BASE}"
echo "  commit:      ${DEPLOY_COMMIT:-<unset>}"
echo "  repo url:    ${REPO_URL}"
echo "  port:        ${PORT}"

[[ -d "${DEPLOY_BASE}" ]] || fatal 0 "${DEPLOY_BASE} does not exist"
[[ -d "${SHARED_DIR}" ]] || fatal 0 "${SHARED_DIR} does not exist"

if [[ -z "${DEPLOY_COMMIT}" ]]; then
  fatal 0 "DEPLOY_COMMIT env var is required (full 40-char git SHA)"
fi
[[ "${DEPLOY_COMMIT}" =~ ^[0-9a-f]{40}$ ]] || {
  fatal 0 "DEPLOY_COMMIT must be a full 40-char hex SHA, got: ${DEPLOY_COMMIT:0:12}…"
}
if [[ ! -f "${SHARED_DIR}/env/.env.production" ]]; then
  fatal 0 "${SHARED_DIR}/env/.env.production not found — set it up first"
fi

# ── [1] Tool availability in this non-interactive session ────────────────────
stage 1 "Tool availability"
echo "  HOME=${HOME}  PATH=${PATH}"
for tool in node npm pm2 git ssh rsync; do
  if ! command -v "${tool}" >/dev/null 2>&1; then
    fatal 1 "${tool} not found in PATH"
  fi
  echo "  ${tool}: $(command -v ${tool})"
done
node --version
pm2 --version

# ── [2] Lock ──────────────────────────────────────────────────────────────────
stage 2 "Lock"
if [[ -e "${LOCK_FILE}" ]]; then
  HOLDER=$(cat "${LOCK_FILE}" 2>/dev/null || echo "?")
  if kill -0 "${HOLDER}" 2>/dev/null; then
    fatal 2 "another deployment is in progress (lock held by pid ${HOLDER})"
  fi
  echo "  stale lock from dead pid ${HOLDER} — removing"
  rm -f "${LOCK_FILE}"
fi
mkdir -p "${LOG_DIR}"
echo $$ > "${LOCK_FILE}"
RELEASE_ID="${DEPLOY_COMMIT:0:12}-$(date +%Y%m%d%H%M%S)"
RELEASE_DIR="${RELEASES_DIR}/${RELEASE_ID}"
PREV_CURRENT=""
echo "  release: ${RELEASE_ID}"

# ── [3] Create release directory ──────────────────────────────────────────────
stage 3 "Create release directory"
rm -rf "${RELEASE_DIR}"
mkdir -p "${RELEASE_DIR}"

# ── [4] Clone / checkout the exact commit ─────────────────────────────────────
stage 4 "Checkout ${DEPLOY_COMMIT}"
git clone --quiet --no-checkout "${REPO_URL}" "${RELEASE_DIR}/src" 2>&1 || {
  fatal 4 "git clone failed (repo: ${REPO_URL})"
}
cd "${RELEASE_DIR}/src"
# Ensure the exact commit is available even in a shallow/partial clone
if ! git cat-file -e "${DEPLOY_COMMIT}" 2>/dev/null; then
  echo "  commit not in clone, fetching…"
  git fetch --quiet --depth 1 origin "${DEPLOY_COMMIT}"
fi
git checkout --quiet "${DEPLOY_COMMIT}"
echo "  HEAD: $(git log -1 --format='%h %s')"

# ── [5] Prepare shared resources ───────────────────────────────────────────────
stage 5 "Shared environment"
cp "${SHARED_DIR}/env/.env.production" "${RELEASE_DIR}/src/.env.local"
echo "  .env.local in place (contents never logged)"

# ── [6] Install dependencies ──────────────────────────────────────────────────
stage 6 "npm ci"
npm ci --prefix "${RELEASE_DIR}/src" 2>&1 | tail -15

# ── [7] Build ──────────────────────────────────────────────────────────────────
stage 7 "next build (standalone)"
# Keep fe-point on the currently active release during the whole build.
echo "  active release during build: $(readlink ${CURRENT_LINK} 2>/dev/null || echo 'none')"
npm run build --prefix "${RELEASE_DIR}/src" 2>&1 | tail -30

if [[ ! -f "${RELEASE_DIR}/src/.next/standalone/server.js" ]]; then
  fatal 7 ".next/standalone/server.js not found after build"
fi

# Copy client assets into the standalone tree. Next's standalone output holds
# only server-runtime files; without .next/static the server 404s every
# /_next/static/chunks/* request and the app white-screens.
cp -r "${RELEASE_DIR}/src/.next/static" "${RELEASE_DIR}/src/.next/standalone/.next/static" || {
  fatal 7 "failed to copy .next/static into standalone tree"
}

# Copy public/ if present (favicon, robots.txt, etc. are served from it).
if [[ -d "${RELEASE_DIR}/src/public" ]]; then
  cp -r "${RELEASE_DIR}/src/public" "${RELEASE_DIR}/src/.next/standalone/public" || {
    fatal 7 "failed to copy public/ into standalone tree"
  }
fi
echo "  Build OK: server.js + .next/static (+ public) ready"

# ── [8] Activate: point PM2 at the new release ───────────────────────────────
stage 8 "Activate ${RELEASE_ID}"
if [[ -L "${CURRENT_LINK}" ]]; then
  PREV_CURRENT="$(readlink "${CURRENT_LINK}")"
fi
echo "  previous current: ${PREV_CURRENT:-none}"
ln -sfn "${RELEASE_DIR}" "${CURRENT_LINK}"

ECOSYSTEM_NEW="${RELEASE_DIR}/ecosystem.config.js"
cat > "${ECOSYSTEM_NEW}" <<EOF
module.exports = {
  apps: [
    {
      name: "fe-point",
      cwd: "${RELEASE_DIR}/src",
      script: "node",
      args: ".next/standalone/server.js",
      interpreter: "none",
      env: {
        NODE_ENV: "production",
        PORT: "${PORT}",
      },
      out_file: "${LOG_DIR}/fe-point-out.log",
      error_file: "${LOG_DIR}/fe-point-err.log",
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
    },
  ],
};
EOF

pm2 delete fe-point >/dev/null 2>&1 || true
pm2 start "${ECOSYSTEM_NEW}" || fatal 8 "pm2 start failed"
echo "  PM2 started fe-point → ${RELEASE_DIR}"

# ── [9] Health check via HTTP on port ${PORT} ─────────────────────────────────
stage 9 "Health check (${HEALTH_RETRIES} attempts × ${HEALTH_SLEEP}s)"
HEALTH_OK=false
STATUS="000"
for attempt in $(seq 1 "${HEALTH_RETRIES}"); do
  sleep "${HEALTH_SLEEP}"
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "${HEALTH_URL}/" 2>/dev/null || echo "000")
  echo "  attempt ${attempt}/${HEALTH_RETRIES}: HTTP ${STATUS}"
  if [[ "${STATUS}" == "200" || "${STATUS}" == "302" ]]; then
    HEALTH_OK=true
    break
  fi
done

if [[ "${HEALTH_OK}" == "true" ]]; then
  echo "  Health check passed (HTTP ${STATUS})"
  pm2 save >/dev/null 2>&1
  echo ""
  echo "=== Deployment ${RELEASE_ID} successful ==="
  echo "  commit:   ${DEPLOY_COMMIT}"
  echo "  current:  ${RELEASE_DIR}"
  exit 0
fi

# ── [10] Rollback ──────────────────────────────────────────────────────────────
stage 10 "Health check failed — rolling back"
echo "  last status: HTTP ${STATUS}"
echo "  tail of fe-point error log:"
tail -20 "${LOG_DIR}/fe-point-err.log" 2>/dev/null | sed 's/^/    /' || echo "    (no log yet)"

ROLLBACK_STATUS="failed"
if [[ -n "${PREV_CURRENT}" && -d "${PREV_CURRENT}" && -f "${PREV_CURRENT}/ecosystem.config.js" ]]; then
  echo "  Rolling back to: ${PREV_CURRENT}"
  ln -sfn "${PREV_CURRENT}" "${CURRENT_LINK}"
  pm2 delete fe-point >/dev/null 2>&1 || true
  pm2 start "${PREV_CURRENT}/ecosystem.config.js" || fatal 10 "rollback: pm2 start failed"
  for attempt in $(seq 1 10); do
    sleep 2
    RSTATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "${HEALTH_URL}/" 2>/dev/null || echo "000")
    echo "  rollback attempt ${attempt}/10: HTTP ${RSTATUS}"
    if [[ "${RSTATUS}" == "200" || "${RSTATUS}" == "302" ]]; then
      ROLLBACK_STATUS="verified"
      break
    fi
  done
  if [[ "${ROLLBACK_STATUS}" == "verified" ]]; then
    echo "  Rollback verified. Previous release is live."
  else
    echo "  CRITICAL: rollback health check also failed — manual intervention required."
  fi
else
  echo "  No previous release to roll back to."
fi

echo ""
echo "=== Deployment ${RELEASE_ID} FAILED — rollback: ${ROLLBACK_STATUS} ==="
echo "  active release: $(readlink ${CURRENT_LINK} 2>/dev/null || echo 'unknown')"
exit 1
