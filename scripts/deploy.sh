#!/usr/bin/env bash
# deploy.sh — Point-management-FE production deployment
#
# Usage (non-interactive SSH, run as root):
#   DEPLOY_COMMIT="<sha>" bash /var/www/html/Point-management-FE-deploy/scripts/deploy.sh
#
# Required env vars:
#   DEPLOY_COMMIT  — full 40-char git SHA to deploy
#
# Optional env vars:
#   REPO_URL       — git remote URL (default: git@github.com:abdulmuti12/point-management-frontend.git)

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

# ── Validation ────────────────────────────────────────────────────────────────
if [[ -z "${DEPLOY_COMMIT}" ]]; then
  echo "ERROR: DEPLOY_COMMIT env var is required (full 40-char git SHA)"
  exit 1
fi
[[ "${DEPLOY_COMMIT}" =~ ^[0-9a-f]{40}$ ]] || {
  echo "ERROR: DEPLOY_COMMIT must be a full 40-char SHA, got: ${DEPLOY_COMMIT}"
  exit 1
}

# ── Lock ──────────────────────────────────────────────────────────────────────
if [[ -e "${LOCK_FILE}" ]]; then
  echo "ERROR: Another deployment is in progress (lock exists: ${LOCK_FILE})"
  echo "  If the lock is stale, remove it: rm ${LOCK_FILE}"
  exit 1
fi
trap 'rm -f "${LOCK_FILE}"' EXIT
echo $$ > "${LOCK_FILE}"

RELEASE_ID="${DEPLOY_COMMIT:0:12}-$(date +%Y%m%d%H%M%S)"
RELEASE_DIR="${RELEASES_DIR}/${RELEASE_ID}"
PREV_CURRENT=""

echo "=== Point-management-FE deployment starting ==="
echo "  commit:  ${DEPLOY_COMMIT}"
echo "  release: ${RELEASE_ID}"
echo "  dir:     ${RELEASE_DIR}"

# ── Preflight checks ──────────────────────────────────────────────────────────
command -v node >/dev/null 2>&1 || { echo "ERROR: node not found in PATH"; exit 1; }
command -v npm  >/dev/null 2>&1 || { echo "ERROR: npm not found in PATH"; exit 1; }
command -v pm2  >/dev/null 2>&1 || { echo "ERROR: pm2 not found in PATH"; exit 1; }
command -v git  >/dev/null 2>&1 || { echo "ERROR: git not found in PATH"; exit 1; }

if [[ ! -f "${SHARED_DIR}/env/.env.production" ]]; then
  echo "ERROR: ${SHARED_DIR}/env/.env.production not found. Set it up first."
  exit 1
fi

# ── [1] Create release directory ─────────────────────────────────────────────
echo "[1/7] Creating release directory: ${RELEASE_ID}"
rm -rf "${RELEASE_DIR}"
mkdir -p "${RELEASE_DIR}"

# ── [2] Clone / checkout the exact commit ────────────────────────────────────
echo "[2/7] Cloning repo and checking out ${DEPLOY_COMMIT}"
git clone --quiet --no-checkout "${REPO_URL}" "${RELEASE_DIR}/src" 2>&1 || {
  echo "ERROR: git clone failed. Check REPO_URL and server SSH access."
  exit 1
}
cd "${RELEASE_DIR}/src"
# Ensure the exact commit is available even in a shallow clone
if ! git cat-file -e "${DEPLOY_COMMIT}" 2>/dev/null; then
  echo "  commit not in shallow clone, fetching..."
  git fetch --quiet --depth 1 origin "${DEPLOY_COMMIT}"
fi
git checkout --quiet "${DEPLOY_COMMIT}"
echo "  HEAD is now: $(git log -1 --format='%h %s')"

# ── [3] Prepare shared resources ─────────────────────────────────────────────
echo "[3/7] Preparing shared environment"
cp "${SHARED_DIR}/env/.env.production" "${RELEASE_DIR}/src/.env.local"

# ── [4] Install dependencies ─────────────────────────────────────────────────
echo "[4/7] Installing dependencies (npm ci — uses package-lock.json)"
npm ci --prefix "${RELEASE_DIR}/src" 2>&1 | tail -15

# ── [5] Build ────────────────────────────────────────────────────────────────
echo "[5/7] Running production build (next build, output: standalone)"
npm run build --prefix "${RELEASE_DIR}/src" 2>&1 | tail -30

# Verify build produced a valid standalone server
if [[ ! -f "${RELEASE_DIR}/src/.next/standalone/server.js" ]]; then
  echo "ERROR: .next/standalone/server.js not found after build — aborting before activation"
  exit 1
fi

# Copy client assets into standalone tree. Next's standalone output contains
# only server-runtime files; without .next/static the server 404s every
# /_next/static/chunks/* request (login page white-screens, browser refuses
# the HTML-bodied 404 as a script).
cp -r "${RELEASE_DIR}/src/.next/static" "${RELEASE_DIR}/src/.next/standalone/.next/static" || {
  echo "ERROR: failed to copy .next/static into standalone tree"
  exit 1
}
echo "  Build OK: ${RELEASE_DIR}/src/.next/standalone/server.js (+ static assets copied)"

# ── [6] Activate: point PM2 at new release ───────────────────────────────────
echo "[6/7] Activating release ${RELEASE_ID}"

# Remember what was active so we can roll back
if [[ -L "${CURRENT_LINK}" ]]; then
  PREV_CURRENT="$(readlink "${CURRENT_LINK}")"
fi
echo "  previous current: ${PREV_CURRENT:-none}"

# Atomically swap the symlink
ln -sfn "${RELEASE_DIR}" "${CURRENT_LINK}"

# Write the ecosystem config for this release (using standalone server.js)
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

# Stop the old process (releases port), start the new one
pm2 delete fe-point >/dev/null 2>&1 || true
pm2 start "${ECOSYSTEM_NEW}" >/dev/null 2>&1
echo "  PM2 restarted fe-point → ${RELEASE_DIR}"

# ── [7] Health check ──────────────────────────────────────────────────────────
echo "[7/7] Health check via HTTP on port ${PORT}"
HEALTH_OK=false

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
  echo "=== Deployment ${RELEASE_ID} successful ==="
  echo "  commit:   ${DEPLOY_COMMIT}"
  echo "  current:  ${RELEASE_DIR}"
  exit 0
fi

# ── Rollback ──────────────────────────────────────────────────────────────────
echo ""
echo "ERROR: Health check failed after ${HEALTH_RETRIES} attempts. Initiating rollback..."

ROLLBACK_STATUS="failed"

if [[ -n "${PREV_CURRENT}" && -d "${PREV_CURRENT}" && -f "${PREV_CURRENT}/ecosystem.config.js" ]]; then
  echo "  Rolling back to: ${PREV_CURRENT}"
  ln -sfn "${PREV_CURRENT}" "${CURRENT_LINK}"

  pm2 delete fe-point >/dev/null 2>&1 || true
  pm2 start "${PREV_CURRENT}/ecosystem.config.js" >/dev/null 2>&1

  ROLLBACK_OK=false
  for attempt in $(seq 1 10); do
    sleep 2
    RSTATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "${HEALTH_URL}/" 2>/dev/null || echo "000")
    echo "  rollback attempt ${attempt}/10: HTTP ${RSTATUS}"
    if [[ "${RSTATUS}" == "200" || "${RSTATUS}" == "302" ]]; then
      ROLLBACK_OK=true
      break
    fi
  done

  if [[ "${ROLLBACK_OK}" == "true" ]]; then
    ROLLBACK_STATUS="verified"
    echo "  Rollback verified. Previous release is live."
    pm2 save >/dev/null 2>&1
  else
    ROLLBACK_STATUS="failed"
    echo "  CRITICAL: Rollback health check also failed. Manual intervention required."
    pm2 list 2>&1
  fi
else
  echo "  No previous release to roll back to (first deployment or missing ecosystem config)."
  ROLLBACK_STATUS="no-previous-release"
fi

echo ""
echo "=== Deployment ${RELEASE_ID} FAILED — rollback: ${ROLLBACK_STATUS} ==="
echo "  Failed commit:  ${DEPLOY_COMMIT}"
echo "  Active release: $(readlink ${CURRENT_LINK} 2>/dev/null || echo 'unknown')"
exit 1
