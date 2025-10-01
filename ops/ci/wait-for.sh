#!/usr/bin/env bash
set -euo pipefail
URL="${1:?url required}"
TIMEOUT="${2:-600}"
INTERVAL=5
echo "Waiting for $URL (timeout ${TIMEOUT}s)..."
end=$((SECONDS + TIMEOUT))
while (( SECONDS < end )); do
  if curl -sf "$URL" >/dev/null; then
    echo "✓ Ready: $URL"
    exit 0
  fi
  sleep "$INTERVAL"
done
echo "✗ Timeout waiting for $URL after ${TIMEOUT}s"
exit 1
#!/usr/bin/env bash
set -euo pipefail
URL="${1:?url required}"
TIMEOUT="${2:-600}"
INTERVAL=5

echo "Waiting for $URL (timeout ${TIMEOUT}s)..."
end=$((SECONDS + TIMEOUT))
while (( SECONDS < end )); do
  if curl -sf "$URL" >/dev/null; then
    echo "✓ Ready: $URL"
    exit 0
  fi
  sleep "$INTERVAL"
done
echo "✗ Timeout waiting for $URL after ${TIMEOUT}s"
exit 1
