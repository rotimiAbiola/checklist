#!/bin/bash
# Idempotent deploy/redeploy: clone-or-pull the repo, install the nginx site,
# bring up the production docker compose stack. Run on the target server.
set -euo pipefail

REPO_DIR="$HOME/checklist"
REPO_URL="https://github.com/rotimiAbiola/checklist.git"

if [ -d "$REPO_DIR/.git" ]; then
  git -C "$REPO_DIR" pull --ff-only
else
  git clone "$REPO_URL" "$REPO_DIR"
fi

cd "$REPO_DIR"

sudo cp deploy/nginx/checklist.conf /etc/nginx/sites-available/checklist.conf
sudo ln -sf /etc/nginx/sites-available/checklist.conf /etc/nginx/sites-enabled/checklist.conf
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

docker compose -f docker-compose.prod.yml up -d --build

echo "Deployed. docker compose -f docker-compose.prod.yml ps:"
docker compose -f docker-compose.prod.yml ps
