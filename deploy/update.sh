#!/usr/bin/env bash
# Update LoveMate on the server to the latest code and restart it (about a minute).
#   bash /opt/lovemate/deploy/update.sh
set -euo pipefail
cd /opt/lovemate
BRANCH="$(git rev-parse --abbrev-ref HEAD)"
git pull --ff-only origin "$BRANCH"
npm ci
npm run build
pm2 reload lovemate --update-env
pm2 save
echo "Updated to $(git log --oneline -1)"
