#!/usr/bin/env bash
# Tests scripts/sync-publish.sh and scripts/validate-data.py with a throw-away git "remote" (nothing real is touched).
#   bash tests/test_sync.sh
set -uo pipefail
HERE="$(cd "$(dirname "$0")/.." && pwd)"
T="$(mktemp -d)"; trap 'rm -rf "$T"' EXIT
PY="${PYTHON:-python}"
n=0; fails=0
ok()   { n=$((n+1)); echo "$n ok: $1"; }
fail() { n=$((n+1)); fails=$((fails+1)); echo "$n FAIL: $1"; [ -f "$T/log.txt" ] && tail -6 "$T/log.txt" | sed "s/^/       | /"; }
check() { if eval "$2"; then ok "$1"; else fail "$1"; fi; }

# a pretend CMS answer, and a "generator" that writes the data files from it
cms() { # $1 = number of designs, $2 = reels
  "$PY" - "$1" "$2" > "$T/cms.json" <<'EOF'
import json, sys
n, r = int(sys.argv[1]), int(sys.argv[2])
prods = [{"id": f"p{i}", "name": f"Design {i}", "price": 300, "variants": [{"colour": "Red", "price": 300}, {"colour": "Blue", "price": 300}]} for i in range(n)]
print(json.dumps({"groups": [{"slug": "g"}], "collections": [{"slug": "c", "group": "g"}], "products": prods, "reels": [{"id": f"r{i}", "title": f"Reel {i}"} for i in range(r)]}))
EOF
}
cat > "$T/gen.py" <<'EOF'
import json, os, sys
cms = json.load(open(os.environ["CMS_FILE"]))
d = os.path.join("src", "data"); os.makedirs(d, exist_ok=True)
json.dump({"groups": cms["groups"], "collections": cms["collections"], "products": cms["products"]}, open(os.path.join(d, "catalog.json"), "w"), indent=1)
json.dump({"reels": cms["reels"]}, open(os.path.join(d, "reels.json"), "w"), indent=1)
json.dump({"reviews": []}, open(os.path.join(d, "reviews.json"), "w"))
json.dump({"faqs": []}, open(os.path.join(d, "faqs.json"), "w"))
EOF
export CMS_FILE="$T/cms.json"

newrepo() { # builds a bare "GitHub" at $T/remote.git with the scripts and one good commit; clones it to $1
  rm -rf "$T/remote.git" "$T/seed" "$1" "$T/b"
  git init -q --bare -b main "$T/remote.git"
  git clone -q -c core.autocrlf=false "$T/remote.git" "$T/seed" 2>/dev/null
  ( cd "$T/seed" && git config user.email t@t && git config user.name t && mkdir -p scripts && cp "$HERE/scripts/validate-data.py" "$HERE/scripts/sync-publish.sh" scripts/ && cms 10 5 && "$PY" "$T/gen.py" && git add -A && git commit -qm seed && git push -q origin main )
  git clone -q -c core.autocrlf=false "$T/remote.git" "$1" 2>/dev/null
  ( cd "$1" && git config user.email t@t && git config user.name t )
}
run() { ( cd "$1" && SYNC_GEN="$PY $T/gen.py" SYNC_PRUNE="true" SYNC_VALIDATE="$PY scripts/validate-data.py" SYNC_SUMMARISE="echo summary" GITHUB_OUTPUT="$T/out.txt" bash scripts/sync-publish.sh ) ; }
remote_designs() { git -C "$T/remote.git" show main:src/data/catalog.json | "$PY" -c "import sys,json; print(len(json.load(sys.stdin)['products']))"; }

# ---- 1. a normal sync publishes
newrepo "$T/a"; cms 12 5; ( cd "$T/a" && "$PY" "$T/gen.py" ); : > "$T/out.txt"
run "$T/a" > "$T/log.txt" 2>&1; rc=$?
check "a normal sync publishes the new data (exit 0, remote now has 12 designs)" "[ $rc -eq 0 ] && [ \"\$(remote_designs)\" = 12 ] && grep -q changed=true $T/out.txt"

# ---- 2. nothing changed
newrepo "$T/a"; cms 10 5; ( cd "$T/a" && "$PY" "$T/gen.py" ); : > "$T/out.txt"
run "$T/a" > "$T/log.txt" 2>&1; rc=$?
check "when nothing changed it says so and does nothing (exit 0, changed=false)" "[ $rc -eq 0 ] && grep -q changed=false $T/out.txt && grep -q 'nothing to publish' $T/log.txt"

# ---- 3. THE COLLISION: someone else pushes between this run's checkout and its push
newrepo "$T/a"; newrepo_b="$T/b"; git clone -q -c core.autocrlf=false "$T/remote.git" "$newrepo_b" 2>/dev/null; ( cd "$newrepo_b" && git config user.email t@t && git config user.name t )
cms 11 5; ( cd "$newrepo_b" && "$PY" "$T/gen.py" && git add -A && git commit -qm "other run" && git push -q origin main )   # the other run lands first (11 designs)
cms 14 5; ( cd "$T/a" && "$PY" "$T/gen.py" ); : > "$T/out.txt"                                                                     # this run saw the newer CMS (14)
run "$T/a" > "$T/log.txt" 2>&1; rc=$?
check "a colliding push is retried from the other run's version and succeeds (exit 0)" "[ $rc -eq 0 ] && grep -q 'Starting again' $T/log.txt"
check "...and the final live data is the newest (14 designs), not the other run's older 11" "[ \"\$(remote_designs)\" = 14 ]"
check "...with the history in a straight line (no merge commits to untangle)" "[ \"\$(git -C $T/remote.git rev-list --merges main | wc -l | tr -d ' ')\" = 0 ]"

# ---- 4. the data check blocks bad data (and the remote stays as it was)
newrepo "$T/a"; cms 0 0; ( cd "$T/a" && "$PY" "$T/gen.py" ); before="$(git -C $T/remote.git rev-parse main)"
( cd "$T/a" && "$PY" scripts/validate-data.py > "$T/log.txt" 2>&1 ); rc=$?
check "an EMPTY catalog from the CMS fails the data check (exit 1) with a clear reason" "[ $rc -eq 1 ] && grep -q 'no products' $T/log.txt"
check "...and nothing was published (the live data is untouched)" "[ \"\$(git -C $T/remote.git rev-parse main)\" = \"$before\" ]"

newrepo "$T/a"; cms 4 5; ( cd "$T/a" && "$PY" "$T/gen.py" )
( cd "$T/a" && "$PY" scripts/validate-data.py > "$T/log.txt" 2>&1 ); rc=$?
check "losing 6 of 10 designs at once is refused as a likely CMS fault" "[ $rc -eq 1 ] && grep -q 'dropped from 10 to 4' $T/log.txt"
( cd "$T/a" && ALLOW_SHRINK=true "$PY" scripts/validate-data.py > "$T/log.txt" 2>&1 ); rc=$?
check "...unless the owner explicitly allows it (ALLOW_SHRINK=true)" "[ $rc -eq 0 ]"

newrepo "$T/a"; cms 9 5; ( cd "$T/a" && "$PY" "$T/gen.py" ); ( cd "$T/a" && "$PY" scripts/validate-data.py > "$T/log.txt" 2>&1 ); rc=$?
check "a small normal change (10 to 9 designs) passes" "[ $rc -eq 0 ]"

newrepo "$T/a"; echo "{ broken" > "$T/a/src/data/catalog.json"
( cd "$T/a" && "$PY" scripts/validate-data.py > "$T/log.txt" 2>&1 ); rc=$?
check "a corrupt data file fails the check" "[ $rc -eq 1 ] && grep -q 'cannot be read' $T/log.txt"

newrepo "$T/a"; cms 10 1; ( cd "$T/a" && "$PY" "$T/gen.py" ); ( cd "$T/a" && "$PY" scripts/validate-data.py > "$T/log.txt" 2>&1 ); rc=$?
check "losing 4 of 5 reels at once is refused too" "[ $rc -eq 1 ] && grep -q 'reels dropped from 5 to 1' $T/log.txt"

echo; if [ $fails -eq 0 ]; then echo "ALL SYNC CHECKS PASSED"; else echo "$fails CHECK(S) FAILED"; fi
exit $fails
