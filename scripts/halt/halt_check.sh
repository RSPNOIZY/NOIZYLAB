#!/usr/bin/env bash
# halt_check.sh — run before every agent job. Exit 0 = clear to run; anything else = do not run.
# Fails closed: unreachable, non-200, or unparseable status counts as HALTED.
#
# Usage:  HALT_URL=https://noizy-halt.<subdomain>.workers.dev ./halt_check.sh && run_the_job

set -u
URL="${HALT_URL:?set HALT_URL to the HALT worker base URL}"

body="$(curl -fsS --max-time 10 "$URL/status" 2>/dev/null)" || {
  echo "HALT: status unreachable — failing closed" >&2; exit 2; }

case "$body" in
  *'"halted":false'*) exit 0 ;;
  *'"halted":true'*)  echo "HALTED: $body" >&2; exit 1 ;;
  *)                  echo "HALT: unreadable status — failing closed" >&2; exit 2 ;;
esac
