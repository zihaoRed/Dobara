#!/usr/bin/env bash
# 紧急修复：公网 IP 只显示 Welcome to nginx!
# 在服务器上执行（仓库 UI 目录下）:
#   bash deploy/fix-nginx-welcome.sh
set -e

SITE_DIR="/var/www/dobara"
NGINX_CONF="/etc/nginx/conf.d/dobara.conf"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "== Disable default welcome site =="
sudo mv /etc/nginx/conf.d/default.conf /etc/nginx/conf.d/default.conf.disabled 2>/dev/null || true
sudo rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true

echo "== Install Dobara nginx conf =="
sudo cp "${SCRIPT_DIR}/nginx.conf" "${NGINX_CONF}"

echo "== Check site files =="
if [ ! -f "${SITE_DIR}/index.html" ]; then
  echo "WARN: ${SITE_DIR}/index.html missing — run full deploy/deploy.sh after this."
else
  ls -la "${SITE_DIR}/index.html" "${SITE_DIR}/consumer/index.html" 2>/dev/null || true
fi

echo "== nginx -t && reload =="
sudo nginx -t
sudo systemctl reload nginx

echo "OK. Open http://$(curl -s ifconfig.me 2>/dev/null || echo YOUR_IP)/"