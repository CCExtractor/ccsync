#!/bin/bash
# CCSync Deployment Script
# Location on VPS: /opt/ccsync/scripts/deploy.sh
#
# Usage: ./deploy.sh <image_tag>
# Example: ./deploy.sh abc1234
#
# This script:
# 1. Pulls new Docker images from GHCR
# 2. Starts the services with the new images
# 3. Verifies health checks pass
# 4. Rolls back automatically on failure

set -euo pipefail

# Configuration
DEPLOY_DIR="/opt/ccsync"
IMAGE_TAG="${1:?Usage: deploy.sh <image_tag>}"
HEALTH_URL="http://127.0.0.1:8000/health"
HEALTH_TIMEOUT=120
ROLLBACK_ON_FAILURE=true

cd "$DEPLOY_DIR"

# --- Logging ---
log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }
log_error() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $*" >&2; }

# --- Locking ---
LOCK_FILE="/var/lock/ccsync-deploy.lock"
exec 9>"$LOCK_FILE"
if ! flock -n 9; then
    log_error "Another deployment is in progress"
    exit 1
fi

# --- Get current tag for rollback ---
PREVIOUS_TAG=""
if [[ -f .env ]]; then
    PREVIOUS_TAG=$(grep -oP 'IMAGE_TAG=\K.*' .env || true)
fi

log "Starting deployment: $IMAGE_TAG (previous: ${PREVIOUS_TAG:-none})"

# --- Pull new images ---
log "Pulling images for tag: $IMAGE_TAG"
export IMAGE_TAG
if ! docker compose pull frontend backend; then
    log_error "Failed to pull images"
    exit 1
fi

# --- Deploy ---
log "Starting services..."
if ! docker compose up -d --remove-orphans; then
    log_error "Failed to start services"
    if [[ -n "$PREVIOUS_TAG" && "$ROLLBACK_ON_FAILURE" == "true" ]]; then
        log "Rolling back to $PREVIOUS_TAG"
        export IMAGE_TAG="$PREVIOUS_TAG"
        docker compose up -d
    fi
    exit 1
fi

# --- Health check ---
log "Waiting for health check (timeout: ${HEALTH_TIMEOUT}s)..."
HEALTHY=false
for i in $(seq 1 $((HEALTH_TIMEOUT / 5))); do
    sleep 5
    if curl -sf "$HEALTH_URL" > /dev/null 2>&1; then
        HEALTHY=true
        break
    fi
    log "Health check attempt $i failed, retrying..."
done

if [[ "$HEALTHY" != "true" ]]; then
    log_error "Health check failed after ${HEALTH_TIMEOUT}s"

    # Show container status for debugging
    log "Container status:"
    docker compose ps

    if [[ -n "$PREVIOUS_TAG" && "$ROLLBACK_ON_FAILURE" == "true" ]]; then
        log "Rolling back to $PREVIOUS_TAG"
        export IMAGE_TAG="$PREVIOUS_TAG"
        echo "IMAGE_TAG=$PREVIOUS_TAG" > .env
        docker compose up -d
        log "Rollback complete"
    fi
    exit 1
fi

log "Health check passed"

# --- Persist the new tag ---
echo "IMAGE_TAG=$IMAGE_TAG" > .env

# --- Record deployment ---
DEPLOY_RECORD="deployments/$(date '+%Y%m%d-%H%M%S')-$IMAGE_TAG"
mkdir -p "$DEPLOY_RECORD"
echo "tag=$IMAGE_TAG" > "$DEPLOY_RECORD/info.txt"
echo "deployed_at=$(date -Iseconds)" >> "$DEPLOY_RECORD/info.txt"
echo "previous_tag=${PREVIOUS_TAG:-none}" >> "$DEPLOY_RECORD/info.txt"

# Update current symlink
ln -sfn "$(basename "$DEPLOY_RECORD")" deployments/current

# --- Cleanup old images ---
log "Cleaning up old images..."
docker image prune -f --filter "until=168h" > /dev/null 2>&1 || true

# --- Keep only last 10 deployment records ---
cd deployments
ls -1t | grep -v '^current$' | tail -n +11 | xargs -r rm -rf
cd ..

log "Deployment of $IMAGE_TAG successful"
