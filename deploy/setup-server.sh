#!/usr/bin/env bash
# LoveMate server setup for Ubuntu 24.04 (Oracle Cloud ARM/AMD, Hostinger, any VPS).
# Run as the normal login user (e.g. "ubuntu"), not root:
#   bash setup-server.sh                  # first run: installs everything and prints a key for GitHub
#   bash setup-server.sh lovemateai.in    # later: adds free HTTPS for your domain
# Safe to run again: every step checks what is already done.
set -euo pipefail

DOMAIN="${1:-}"
APP_DIR="/opt/lovemate"
REPO="git@github.com:Girruusen1/LoveMateAI.git"
BRANCH="${LOVEMATE_BRANCH:-vps}"
PORT=8787
say() { printf '\n\033[1;35m==> %s\033[0m\n' "$*"; }

say "1/8 Updating Ubuntu"
sudo apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get upgrade -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y curl git nginx netfilter-persistent iptables-persistent

say "2/8 Extra swap memory (helps small servers build the app)"
if [ "$(swapon --show | wc -l)" -eq 0 ]; then
  sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile
  echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab >/dev/null
fi

say "3/8 Opening web ports 80 and 443 in the server firewall"
# Oracle's Ubuntu images block everything except SSH in iptables; open only http/https.
for p in 80 443; do
  sudo iptables -C INPUT -p tcp --dport "$p" -m state --state NEW -j ACCEPT 2>/dev/null ||
    sudo iptables -I INPUT 5 -p tcp --dport "$p" -m state --state NEW -j ACCEPT
done
sudo netfilter-persistent save >/dev/null

say "4/8 Installing Node.js 24 and PM2"
if ! node -v 2>/dev/null | grep -q '^v24'; then
  curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi
command -v pm2 >/dev/null || sudo npm install -g pm2@7.0.4
node -v && pm2 -v

say "5/8 Getting the LoveMate code from GitHub"
if [ ! -f ~/.ssh/lovemate_deploy ]; then
  ssh-keygen -t ed25519 -f ~/.ssh/lovemate_deploy -N "" -C "lovemate-server" -q
fi
export GIT_SSH_COMMAND="ssh -i ~/.ssh/lovemate_deploy -o StrictHostKeyChecking=accept-new"
if [ ! -d "$APP_DIR/.git" ]; then
  if ! git ls-remote "$REPO" >/dev/null 2>&1; then
    echo
    echo "GitHub doesn't know this server yet. Add this key (read-only) and run the script again:"
    echo "  GitHub -> LoveMateAI repo -> Settings -> Deploy keys -> Add deploy key (leave 'Allow write access' OFF)"
    echo
    cat ~/.ssh/lovemate_deploy.pub
    exit 0
  fi
  sudo mkdir -p "$APP_DIR" && sudo chown "$USER":"$USER" "$APP_DIR"
  git clone --branch "$BRANCH" "$REPO" "$APP_DIR"
else
  git -C "$APP_DIR" fetch origin "$BRANCH" && git -C "$APP_DIR" checkout "$BRANCH" && git -C "$APP_DIR" pull --ff-only origin "$BRANCH"
fi
git config --global core.sshCommand "ssh -i ~/.ssh/lovemate_deploy"

say "6/8 Settings (.env)"
if [ ! -f "$APP_DIR/.env" ]; then
  cp "$APP_DIR/.env.example" "$APP_DIR/.env"
  chmod 600 "$APP_DIR/.env"
  echo
  echo "Created $APP_DIR/.env from the example. Fill in your keys, then run this script again:"
  echo "  nano $APP_DIR/.env      (paste the values from your .env.local; Ctrl+O, Enter, Ctrl+X to save)"
  exit 0
fi
chmod 600 "$APP_DIR/.env"

say "7/8 Building and starting LoveMate"
cd "$APP_DIR"
npm ci
npm run build
if pm2 describe lovemate >/dev/null 2>&1; then pm2 reload lovemate --update-env; else PORT=$PORT pm2 start npm --name lovemate -- start; fi
pm2 save
sudo env PATH="$PATH:/usr/bin" pm2 startup systemd -u "$USER" --hp "$HOME" >/dev/null

say "8/8 Web server (Nginx)"
SERVER_NAME="${DOMAIN:-_}"
sudo tee /etc/nginx/sites-available/lovemate >/dev/null <<NGINX
server {
    listen 80;
    listen [::]:80;
    server_name $SERVER_NAME;
    client_max_body_size 8m;   # screenshots for the analyzer

    location / {
        proxy_pass http://127.0.0.1:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        # Overwrite (never append) so visitors can't fake their IP for the rate limit.
        proxy_set_header X-Forwarded-For \$remote_addr;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_buffering off;       # AI chat streams word by word
        proxy_read_timeout 120s;
    }
}
NGINX
sudo ln -sf /etc/nginx/sites-available/lovemate /etc/nginx/sites-enabled/lovemate
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

if [ -n "$DOMAIN" ]; then
  say "Free HTTPS certificate for $DOMAIN"
  sudo apt-get install -y certbot python3-certbot-nginx
  sudo certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --register-unsafely-without-email --redirect
fi

IP=$(curl -s https://api.ipify.org || echo "your-server-ip")
say "Done! LoveMate is running"
echo "  Open: http://$IP   ${DOMAIN:+and https://$DOMAIN}"
echo "  Status: pm2 status    Logs: pm2 logs lovemate    Update later: bash $APP_DIR/deploy/update.sh"
curl -s "http://127.0.0.1:$PORT/api/ai/status" && echo
