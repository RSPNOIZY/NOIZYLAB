#!/usr/bin/env bash
# prune00_collect.sh — READ-ONLY licence inventory for the M2 Ultra (macOS).
# Steps 1–2 of docs/prune00/PRUNE00-LICENSE-STAGE.md: collect + detect.
# Moves, deletes and clones nothing. Output goes to a new timestamped folder.
#
# Usage: ./prune00_collect.sh [output-dir]
# Optional tools used when present: brew, mas, jq, scancode (pass SCANCODE=1).

set -u

OUTDIR="${1:-$HOME/prune00_$(date +%Y%m%d_%H%M)}"
mkdir -p "$OUTDIR"
echo "Writing to $OUTDIR"

# 1a. Homebrew: formulae carry a licence field; casks do not.
if command -v brew >/dev/null 2>&1; then
  brew bundle dump --file="$OUTDIR/Brewfile" --force >/dev/null 2>&1 \
    || echo "brew bundle dump FAILED" >&2
  brew info --json=v2 --installed > "$OUTDIR/brew_info.json" 2>/dev/null \
    || echo "brew info FAILED" >&2
  if command -v jq >/dev/null 2>&1 && [ -s "$OUTDIR/brew_info.json" ]; then
    jq -r '.formulae[] | [.name, (.license // "UNKNOWN"), (.homepage // "")] | @tsv' \
      "$OUTDIR/brew_info.json" > "$OUTDIR/brew_formulae_licenses.tsv"
    jq -r '.casks[] | [.token, (.homepage // "")] | @tsv' \
      "$OUTDIR/brew_info.json" > "$OUTDIR/brew_casks.tsv"
  fi
else
  echo "brew not found — skipping Homebrew pass" >&2
fi

# 1b. Mac App Store apps.
if command -v mas >/dev/null 2>&1; then
  mas list > "$OUTDIR/mas_list.txt" 2>&1 || echo "mas list FAILED" >&2
else
  echo "mas not found — skipping App Store pass (brew install mas)" >&2
fi

# 2. App bundles: identity, scripting dictionary, and any licence evidence inside.
APPS_TSV="$OUTDIR/apps.tsv"
printf 'name\tbundle_id\tversion\tscripting_dictionary\tlicense_files\tpath\n' > "$APPS_TSV"

plist_get() {  # plist_get <Info.plist> <key>
  /usr/libexec/PlistBuddy -c "Print :$2" "$1" 2>/dev/null || true
}

for root in /Applications "$HOME/Applications"; do
  [ -d "$root" ] || continue
  find "$root" -maxdepth 2 -name '*.app' -type d -prune -print0 2>/dev/null |
  while IFS= read -r -d '' app; do
    info="$app/Contents/Info.plist"
    name="$(basename "$app" .app)"
    bid="$(plist_get "$info" CFBundleIdentifier)"
    ver="$(plist_get "$info" CFBundleShortVersionString)"
    if find "$app/Contents/Resources" -maxdepth 2 -name '*.sdef' -print -quit 2>/dev/null | grep -q .; then
      sdef=true
    else
      sdef=false
    fi
    lic="$(find "$app/Contents" -maxdepth 4 -type f \
            \( -iname 'LICENSE*' -o -iname 'LICENCE*' -o -iname 'COPYING*' \
               -o -iname '*acknowledg*' -o -iname 'NOTICE*' \) 2>/dev/null |
           sed "s|^$app/||" | head -20 | paste -sd ';' -)"
    printf '%s\t%s\t%s\t%s\t%s\t%s\n' "$name" "$bid" "$ver" "$sdef" "${lic:-NONE}" "$app" >> "$APPS_TSV"
  done
done

# 2b. Optional deep scan of licence evidence with ScanCode (slow: hours for /Applications).
if [ "${SCANCODE:-0}" = "1" ] && command -v scancode >/dev/null 2>&1; then
  scancode --license --copyright --info --json-pp "$OUTDIR/scancode.json" \
    --ignore '*.dylib' --ignore '*.car' --ignore '*.nib' \
    /Applications 2>"$OUTDIR/scancode.log" \
    || echo "scancode FAILED — see scancode.log" >&2
fi

count="$(($(wc -l < "$APPS_TSV") - 1))"
nolic="$(awk -F'\t' 'NR>1 && $5=="NONE"' "$APPS_TSV" | wc -l | tr -d ' ')"
echo "Apps inventoried: $count  (no licence evidence: $nolic → review/proprietary)"
echo "Done. Nothing on the machine was changed."
