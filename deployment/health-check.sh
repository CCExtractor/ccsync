#!/bin/bash
# CCSync health monitor
# Intended VPS location: /opt/ccsync-monitor/health-check.sh
#
# This script checks:
# - Docker Compose service health for frontend/backend/syncserver
# - The backend /health endpoint
# - Alert cooldown / de-duplication across repeated cron runs
#
# Required environment for Zulip alerts:
# - ZULIP_SITE=https://your-org.zulipchat.com
# - ZULIP_BOT_EMAIL=bot@example.com
# - ZULIP_BOT_API_KEY=your-api-key
# - ZULIP_STREAM=ops
# Optional:
# - ZULIP_TOPIC=CCSync health

set -euo pipefail

ENV_FILE="${ENV_FILE:-/opt/ccsync-monitor/health-check.env}"

if [[ -f "$ENV_FILE" ]]; then
    # The environment file is owned by the deploy user/root and contains shell assignments.
    # shellcheck disable=SC1090
    source "$ENV_FILE"
fi

COMPOSE_DIR="${COMPOSE_DIR:-/opt/ccsync}"
COMPOSE_FILE="${COMPOSE_FILE:-$COMPOSE_DIR/docker-compose.yml}"
HEALTH_URL="${HEALTH_URL:-http://127.0.0.1:8000/health}"
SERVICES="${SERVICES:-frontend backend syncserver}"
CURL_TIMEOUT_SECONDS="${CURL_TIMEOUT_SECONDS:-10}"
MAX_CONSECUTIVE_FAILURES="${MAX_CONSECUTIVE_FAILURES:-3}"
ALERT_COOLDOWN_SECONDS="${ALERT_COOLDOWN_SECONDS:-3600}"
STATE_DIR="${STATE_DIR:-/var/lib/ccsync-monitor}"
STATE_FILE="${STATE_FILE:-$STATE_DIR/health-check.state}"
LOCK_FILE="${LOCK_FILE:-/var/lock/ccsync-health-check.lock}"

ZULIP_SITE="${ZULIP_SITE:-}"
ZULIP_BOT_EMAIL="${ZULIP_BOT_EMAIL:-}"
ZULIP_BOT_API_KEY="${ZULIP_BOT_API_KEY:-}"
ZULIP_STREAM="${ZULIP_STREAM:-}"
ZULIP_TOPIC="${ZULIP_TOPIC:-CCSync health}"

COMPOSE_CMD=(docker compose --project-directory "$COMPOSE_DIR" -f "$COMPOSE_FILE")
HOSTNAME_VALUE="$(hostname -f 2>/dev/null || hostname)"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"
}

ensure_runtime_dirs() {
    mkdir -p "$STATE_DIR"
    mkdir -p "$(dirname "$LOCK_FILE")"
}

acquire_lock() {
    exec 9>"$LOCK_FILE"
    if ! flock -n 9; then
        log "Another health check run is already in progress, skipping"
        exit 0
    fi
}

load_state() {
    consecutive_failures=0
    last_alert_at=0
    last_failure_reason=""

    if [[ -f "$STATE_FILE" ]]; then
        # The state file is written by this script and only contains shell assignments.
        # shellcheck disable=SC1090
        source "$STATE_FILE"
    fi
}

persist_state() {
    local tmp_file
    tmp_file="$(mktemp "$STATE_DIR/health-check.state.XXXXXX")"

    {
        printf 'consecutive_failures=%q\n' "$consecutive_failures"
        printf 'last_alert_at=%q\n' "$last_alert_at"
        printf 'last_failure_reason=%q\n' "$last_failure_reason"
    } > "$tmp_file"

    mv "$tmp_file" "$STATE_FILE"
}

join_with() {
    local delimiter="$1"
    shift || true

    if [[ $# -eq 0 ]]; then
        printf ''
        return 0
    fi

    printf '%s' "$1"
    shift

    for item in "$@"; do
        printf '%s%s' "$delimiter" "$item"
    done
}

FAILURE_REASONS=()

record_failure() {
    FAILURE_REASONS+=("$1")
}

check_compose_service() {
    local service="$1"
    local container_id
    local status

    container_id="$("${COMPOSE_CMD[@]}" ps -q "$service" 2>/dev/null || true)"
    if [[ -z "$container_id" ]]; then
        record_failure "service '$service' is not running"
        return 1
    fi

    status="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$container_id" 2>/dev/null || echo "unknown")"
    if [[ "$status" != "healthy" && "$status" != "running" ]]; then
        record_failure "service '$service' reported status '$status'"
        return 1
    fi

    return 0
}

check_backend_endpoint() {
    if ! curl --silent --show-error --fail --max-time "$CURL_TIMEOUT_SECONDS" "$HEALTH_URL" > /dev/null; then
        record_failure "backend endpoint '$HEALTH_URL' failed"
        return 1
    fi

    return 0
}

run_health_checks() {
    local service

    FAILURE_REASONS=()

    if [[ ! -f "$COMPOSE_FILE" ]]; then
        record_failure "compose file '$COMPOSE_FILE' was not found"
        return 1
    fi

    if ! command -v docker > /dev/null 2>&1; then
        record_failure "docker is not installed or not available in PATH"
        return 1
    fi

    if ! "${COMPOSE_CMD[@]}" version > /dev/null 2>&1; then
        record_failure "docker compose is not available or could not read '$COMPOSE_FILE'"
        return 1
    fi

    for service in $SERVICES; do
        check_compose_service "$service" || true
    done

    check_backend_endpoint || true

    [[ ${#FAILURE_REASONS[@]} -eq 0 ]]
}

send_alert() {
    local message="$1"

    if [[ -z "$ZULIP_SITE" || -z "$ZULIP_BOT_EMAIL" || -z "$ZULIP_BOT_API_KEY" || -z "$ZULIP_STREAM" ]]; then
        log "Alert not sent because Zulip environment variables are not fully configured"
        return 1
    fi

    curl --silent --show-error --fail \
        -u "$ZULIP_BOT_EMAIL:$ZULIP_BOT_API_KEY" \
        --data-urlencode "type=stream" \
        --data-urlencode "to=$ZULIP_STREAM" \
        --data-urlencode "topic=$ZULIP_TOPIC" \
        --data-urlencode "content=$message" \
        "${ZULIP_SITE%/}/api/v1/messages" > /dev/null
}

main() {
    local now
    local failure_summary
    local message
    local cooldown_remaining

    ensure_runtime_dirs
    acquire_lock
    load_state

    if run_health_checks; then
        if (( consecutive_failures > 0 )); then
            log "Health check recovered after $consecutive_failures consecutive failure(s)"
        fi

        consecutive_failures=0
        last_failure_reason=""
        persist_state
        exit 0
    fi

    now="$(date +%s)"
    consecutive_failures=$((consecutive_failures + 1))
    failure_summary="$(join_with '; ' "${FAILURE_REASONS[@]}")"
    last_failure_reason="$failure_summary"

    log "Health check failed ($consecutive_failures/$MAX_CONSECUTIVE_FAILURES before alert): $failure_summary"

    if (( consecutive_failures < MAX_CONSECUTIVE_FAILURES )); then
        persist_state
        exit 1
    fi

    if (( now - last_alert_at < ALERT_COOLDOWN_SECONDS )); then
        cooldown_remaining=$((ALERT_COOLDOWN_SECONDS - (now - last_alert_at)))
        log "Alert suppressed by cooldown (${cooldown_remaining}s remaining)"
        persist_state
        exit 1
    fi

    message=$(cat <<EOF
:warning: CCSync health check failed on **$HOSTNAME_VALUE**.

- Consecutive failures: $consecutive_failures
- Health URL: $HEALTH_URL
- Failure summary: $failure_summary
- Cooldown before next alert: ${ALERT_COOLDOWN_SECONDS}s
EOF
)

    if send_alert "$message"; then
        last_alert_at="$now"
        log "Alert sent to Zulip"
    else
        log "Alert delivery failed"
    fi

    persist_state
    exit 1
}

main "$@"
