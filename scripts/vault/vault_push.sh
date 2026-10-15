#!/usr/bin/env bash
# vault_push.sh — copy files into NOIZY VAULT (Proton Drive) with the official
# Proton Drive CLI. Spec: docs/identity/NOIZY-VAULT-SPEC.md.
#
#   1. Once:  proton-drive auth login          (browser sign-in; no password on the command line)
#   2. Preview (default, uploads nothing):     ./vault_push.sh <file-or-folder> <VAULT-FOLDER>
#   3. Upload for real:                         ./vault_push.sh <file-or-folder> <VAULT-FOLDER> --go
#
# Safety:
#   - Only these vault folders: 10-CONSENT 20-AGREEMENTS 30-LEGAL 50-LICENSES 90-INBOX
#     (00-CONTINUITY and 40-RECOVERY are managed by hand).
#   - Refuses any file that looks like it contains a secret (vault is for documents;
#     secrets live in Proton Pass).
#   - 10-CONSENT and 20-AGREEMENTS are under legal hold: never overwrite
#     (--conflict-strategy skip) and print SHA-256 fingerprints for the HEAVEN ledger.
#   - If HALT_URL is set, checks HALT first and stops if halted or unreachable.
# Env: PROTON_DRIVE (path to the CLI, default: proton-drive), VAULT_ROOT (default: /my-files/NOIZY VAULT)

set -euo pipefail

usage() { echo "usage: $0 <file-or-folder> <VAULT-FOLDER> [--go]" >&2; exit 2; }
[ "$#" -ge 2 ] || usage
SRC="$1"; FOLDER="$2"; GO="${3:-}"
CLI="${PROTON_DRIVE:-proton-drive}"
ROOT="${VAULT_ROOT:-/my-files/NOIZY VAULT}"
HERE="$(cd "$(dirname "$0")" && pwd)"

case "$FOLDER" in
  10-CONSENT|20-AGREEMENTS) HOLD=1 ;;
  30-LEGAL|50-LICENSES|90-INBOX) HOLD=0 ;;
  *) echo "✗ '$FOLDER' is not an allowed vault folder (10-CONSENT 20-AGREEMENTS 30-LEGAL 50-LICENSES 90-INBOX)" >&2; exit 2 ;;
esac
[ -e "$SRC" ] || { echo "✗ not found: $SRC" >&2; exit 2; }
[ -z "$GO" ] || [ "$GO" = "--go" ] || usage

# HALT first (fails closed), when configured.
if [ -n "${HALT_URL:-}" ]; then
  "$HERE/../halt/halt_check.sh" || { echo "✗ HALT is on or unreachable — nothing uploaded" >&2; exit 1; }
fi

# Collect files.
FILES=()
while IFS= read -r -d '' f; do FILES+=("$f"); done < <(find "$SRC" -type f ! -name '.*' -print0)
[ "${#FILES[@]}" -gt 0 ] || { echo "✗ no files in $SRC" >&2; exit 2; }

# Refuse anything that looks like a secret.
SECRET_RE='BEGIN [A-Z ]*PRIVATE KEY|password[[:space:]]*[:=]|api[_-]?key[[:space:]]*[:=]|secret[[:space:]]*[:=]|recovery phrase|CANARY-'
BAD=0
for f in "${FILES[@]}"; do
  if grep -Iqi -E "$SECRET_RE" "$f" 2>/dev/null; then echo "✗ looks like a secret, refusing: $f" >&2; BAD=1; fi
done
[ "$BAD" -eq 0 ] || { echo "✗ move secrets to Proton Pass, then try again — nothing uploaded" >&2; exit 1; }

DEST="$ROOT/$FOLDER"
echo "• Destination: $DEST"
echo "• Files: ${#FILES[@]}"
if [ "$HOLD" -eq 1 ]; then
  echo "• Legal hold: existing files are never overwritten. SHA-256 for the HEAVEN ledger:"
  for f in "${FILES[@]}"; do
    if command -v sha256sum >/dev/null; then sha256sum "$f"; else shasum -a 256 "$f"; fi
  done | sed 's/^/    /'
fi

if [ "$GO" != "--go" ]; then
  for f in "${FILES[@]}"; do echo "  would upload: $f"; done
  echo "• Preview only. Add --go to upload."
  exit 0
fi

command -v "$CLI" >/dev/null || { echo "✗ Proton Drive CLI not found ($CLI). Install it from proton.me and run: $CLI auth login" >&2; exit 1; }
"$CLI" filesystem upload --conflict-strategy skip "${FILES[@]}" "$DEST"
echo "• Uploaded ${#FILES[@]} file(s) to $DEST"
[ "$HOLD" -eq 0 ] || echo "• Next: record the fingerprints above in the HEAVEN ledger (SHIRL proposes, RSP_001 approves)."
