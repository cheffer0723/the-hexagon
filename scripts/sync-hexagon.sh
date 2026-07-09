#!/usr/bin/env bash
# Pull the Hexagon component from its canonical home (webapp-frontend) into this
# microsite. Source of truth is webapp-frontend — never hand-edit the files below
# here; edit them there and re-run this.
set -euo pipefail

RAW="https://raw.githubusercontent.com/cheffer0723/webapp-frontend/main"
DEST="src/components/hexagon"
FILES=("Hexagon.tsx" "sample.ts")

mkdir -p "$DEST"
for f in "${FILES[@]}"; do
  echo "syncing $f ..."
  curl -fsSL "$RAW/src/components/hexagon/$f" -o "$DEST/$f"
done
echo "done. review 'git diff', then commit."
