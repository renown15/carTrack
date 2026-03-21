#!/usr/bin/env sh
# check-ports.sh — fail fast if any required port is already in use.
# Usage: ./scripts/check-ports.sh [server_port] [client_port]
#   Defaults: server=3001, client=80

SERVER_PORT="${1:-${SERVER_PORT:-3001}}"
CLIENT_PORT="${2:-${CLIENT_PORT:-80}}"

fail=0

check_port() {
  port="$1"
  label="$2"
  if command -v lsof >/dev/null 2>&1; then
    if lsof -iTCP:"$port" -sTCP:LISTEN -t >/dev/null 2>&1; then
      echo "ERROR: Port $port ($label) is already in use." >&2
      echo "       Run: lsof -iTCP:$port -sTCP:LISTEN" >&2
      fail=1
    fi
  elif command -v nc >/dev/null 2>&1; then
    if nc -z 127.0.0.1 "$port" 2>/dev/null; then
      echo "ERROR: Port $port ($label) is already in use." >&2
      fail=1
    fi
  else
    echo "WARN: Neither lsof nor nc found — skipping port check for $port ($label)." >&2
  fi
}

check_port "$SERVER_PORT" "server"
check_port "$CLIENT_PORT" "client"

if [ "$fail" -eq 1 ]; then
  echo ""
  echo "Resolve the port conflicts above before running 'docker compose up'."
  exit 1
fi

echo "Ports $SERVER_PORT (server) and $CLIENT_PORT (client) are free."
