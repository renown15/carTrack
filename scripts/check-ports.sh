#!/usr/bin/env sh
# check-ports.sh — find free ports for server and client.
# Prints exports ready to be eval'd: eval $(scripts/check-ports.sh)
# Usage: eval $(scripts/check-ports.sh)

find_free_port() {
  preferred="$1"
  port="$preferred"
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

SERVER_PORT=$(find_free_port "${SERVER_PORT:-3001}")
CLIENT_PORT=$(find_free_port "${CLIENT_PORT:-5173}")

echo "export SERVER_PORT=$SERVER_PORT"
echo "export CLIENT_PORT=$CLIENT_PORT"

if [ "$SERVER_PORT" != "${1:-3001}" ] || [ "$CLIENT_PORT" != "${2:-5173}" ]; then
  echo "# Preferred ports were in use — using SERVER_PORT=$SERVER_PORT CLIENT_PORT=$CLIENT_PORT" >&2
fi
