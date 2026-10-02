#!/bin/bash
# Publishes the working tree to the test site, as one commit each time.
#
# The real invitation lives in thuannv98/our-wedding and nothing here touches it.
# This copies only what the page needs into a separate checkout with its own history,
# so the test repo stays a few megabytes instead of carrying the uncompressed originals.
set -euo pipefail

SRC="$HOME/our-wedding"
OUT="$HOME/our-wedding-deploy"
REMOTE="git@github.com:thuannv98/our-wedding-v2.git"

cd "$SRC"
for t in test/*.test.mjs; do
  node "$t" >/dev/null 2>&1 || { echo "✗ $t đang đỏ, sửa xong hãy deploy"; exit 1; }
done

mkdir -p "$OUT"
rm -rf "${OUT:?}"/css "${OUT:?}"/js "${OUT:?}"/img "${OUT:?}"/media
for p in index.html data.js .nojekyll README.md css js img media; do
  [ -e "$p" ] && cp -R "$p" "$OUT/"
done
find "$OUT" -name '.DS_Store' -delete

cd "$OUT"
[ -d .git ] || {
  git init -q -b main
  git config user.name "Thuan Nguyen"
  git config user.email "198thuannguyen@gmail.com"
  git config core.sshCommand "ssh -i ~/.ssh/id_ed25519_dev -o IdentitiesOnly=yes"
}
git remote get-url origin >/dev/null 2>&1 || git remote add origin "$REMOTE"
git add -A
git diff --cached --quiet && { echo "không có gì thay đổi"; exit 0; }
git -c commit.gpgsign=false commit -q -m "bản thử $(date '+%d/%m %H:%M')"
git push -q origin main
echo "✓ https://thuannv98.github.io/our-wedding-v2/"
