#!/usr/bin/env sh
# check-ports.sh — find free ports starting from the values in .env
# Usage: eval $(scripts/check-ports.sh)

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# Load .env defaults (command-line env vars take precedence)
if [ -f "$ROOT/.env" ]; then
  while IFS='=' read -r key value; do
    case "$key" in
      '#'*|'') continue ;;
    esac
    key=$(echo "$key" | tr -d ' ')
    value=$(echo "$value" | tr -d ' ')
    [ -z "$key" ] || [ -z "$value" ] && continue
    eval "[ -z \"\${${key}+set}\" ] && export ${key}=\"${value}\""
  done < "$ROOT/.env"
fi

find_free_port() {
  port="${1}"
  while true; do
    if command -v lsof >/dev/null 2>&1; then
      lsof -iTCP:"$port" -sTCP:LISTEN -t >/dev/null 2>&1 || break
    elif command -v nc >/dev/null 2>&1; then
      nc -z 127.0.0.1 "$port" 2>/dev/null || break
    else
      break
    fi
    port=$((port + 1))
  done
  echo "$port"
}

FREE_PORT=$(find_free_port "${PORT}")
FREE_VITE_PORT=$(find_free_port "${VITE_PORT}")

# Avoid both landing on the same port
[ "$FREE_VITE_PORT" = "$FREE_PORT" ] && FREE_VITE_PORT=$((FREE_VITE_PORT + 1))

[ "$FREE_PORT" != "${PORT}" ] && \
  echo "# Port ${PORT} in use — using ${FREE_PORT} for API" >&2
[ "$FREE_VITE_PORT" != "${VITE_PORT}" ] && \
  echo "# Port ${VITE_PORT} in use — using ${FREE_VITE_PORT} for client" >&2

echo "export PORT=${FREE_PORT}"
echo "export VITE_PORT=${FREE_VITE_PORT}"
