#!/usr/bin/env bash
# firebase_sweep.sh — READ-ONLY inventory of every NOIZY Firebase project.
# Day 1 of docs/firebase/3-DAY-CONSOLIDATION-PLAN.md.
#
# Run on a machine already signed in to Firebase (`firebase login`) and gcloud.
# Nothing here creates, changes, or deletes anything.
#
# Usage: ./firebase_sweep.sh [project-id ...]
#        (no arguments = the 13 known projects below)

set -u

FB="npx -y firebase-tools@latest"
STAMP="$(date +%Y%m%d_%H%M)"
OUT="${OUT:-$HOME/firebase_sweep_${STAMP}.md}"

if [ "$#" -gt 0 ]; then
  PROJECTS=("$@")
else
  PROJECTS=(audioregroup myfamily-3474 noizyfish-b2879 noizyfish-eec71 noizykidz-23ee1
            noizylab-27513 noizyplayground noizyvox-a8fe9 noizyworld-3474 noizyworld-c0cc1
            the-dreamchamber the-gathering-3474 the-wizdom-projekt)
fi

have_gcloud=0
command -v gcloud >/dev/null 2>&1 && have_gcloud=1
have_gsutil=0
command -v gsutil >/dev/null 2>&1 && have_gsutil=1

# run <label> <command...> — prints the command's output, or FAILED with the exit code.
run() {
  local label="$1"; shift
  echo "#### ${label}"
  echo '```'
  local out rc
  out="$("$@" 2>&1)"; rc=$?
  printf '%s\n' "${out:-<empty>}"
  [ "$rc" -ne 0 ] && echo "FAILED (exit $rc)"
  echo '```'
}

{
  echo "# Firebase sweep — ${STAMP}"
  echo
  echo "Signed in as:"
  echo '```'
  $FB login:list 2>&1 || true
  echo '```'
  echo
  run "All visible projects" $FB projects:list
} | tee "$OUT"

for p in "${PROJECTS[@]}"; do
  {
    echo
    echo "## ${p}"
    run "Apps"                 $FB apps:list --project "$p"
    run "Firestore databases"  $FB firestore:databases:list --project "$p"
    run "Realtime DB instances" $FB database:instances:list --project "$p"
    run "Hosting sites"        $FB hosting:sites:list --project "$p"
    run "Cloud Functions"      $FB functions:list --project "$p"
    if [ "$have_gcloud" -eq 1 ]; then
      run "Billing"            gcloud billing projects describe "$p" --format="value(billingEnabled,billingAccountName)"
      run "IAM owners"         gcloud projects get-iam-policy "$p" \
                                 --flatten="bindings[].members" \
                                 --filter="bindings.role:roles/owner" \
                                 --format="value(bindings.members)"
      run "Enabled APIs (firebase/firestore/storage/auth)" \
                               sh -c "gcloud services list --enabled --project '$p' --format='value(config.name)' | grep -E 'firebase|firestore|storage|identitytoolkit' || true"
    fi
    if [ "$have_gsutil" -eq 1 ]; then
      run "Storage buckets"    gsutil ls -p "$p"
    fi
  } | tee -a "$OUT"
done

echo
echo "Report written to: $OUT"
