#!/usr/bin/env bash
# ============================================================
# Dobara 一键更新部署脚本
# 使用: bash deploy/deploy.sh
# 每次更新线上版本只需执行这一条命令
# ============================================================
set -e

SITE_DIR="/var/www/dobara"
NGINX_CONF="/etc/nginx/conf.d/dobara.conf"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "========================================"
echo "  Dobara Update & Deploy"
echo "========================================"

echo ""
echo "[1/6] Pulling latest code..."
git pull

echo ""
echo "[2/6] Installing dependencies..."
rm -f pnpm-lock.yaml
pnpm approve-builds esbuild msw 2>/dev/null || true
pnpm install

echo ""
echo "[3/6] Building all apps..."
pnpm build:preview

echo ""
echo "[4/6] Deploying to ${SITE_DIR}..."
sudo mkdir -p "${SITE_DIR}"
sudo chown -R nginx:nginx "${SITE_DIR}"

# Portal → 根路径
sudo rm -rf "${SITE_DIR}/index.html" "${SITE_DIR}/assets"
sudo cp -r dist/* "${SITE_DIR}/"

sudo chown -R nginx:nginx "${SITE_DIR}"

echo ""
echo "[5/6] Nginx config (disable welcome page + install Dobara)..."
# RHEL/CentOS/Amazon: default welcome site
sudo mv /etc/nginx/conf.d/default.conf /etc/nginx/conf.d/default.conf.disabled 2>/dev/null || true
# Debian/Ubuntu: default site
sudo rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true

sudo cp "${SCRIPT_DIR}/nginx.conf" "${NGINX_CONF}"

echo ""
echo "[6/6] Reloading Nginx..."
if ! sudo nginx -t; then
  echo "ERROR: nginx -t failed. Dobara conf not applied."
  echo "Check: ls -la /var/www/dobara && cat ${NGINX_CONF}"
  exit 1
fi
sudo systemctl reload nginx

echo ""
echo "========================================"
echo "  Deploy complete!"
echo "  http://$(curl -s ifconfig.me 2>/dev/null || echo 'YOUR_IP')"
echo "========================================"
