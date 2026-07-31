#!/usr/bin/env bash
# ============================================================
# Dobara 一键构建部署脚本
# 使用: bash deploy/deploy.sh
# ============================================================
set -e

SITE_DIR="/var/www/dobara"
NGINX_CONF="/etc/nginx/sites-available/dobara"

echo "========================================"
echo "  Dobara Deploy Script"
echo "========================================"

# 1. 安装依赖
echo ""
echo "[1/5] Installing dependencies..."
rm -f pnpm-lock.yaml
pnpm approve-builds esbuild msw 2>/dev/null || true
pnpm install

# 2. 构建所有应用
echo ""
echo "[2/5] Building all apps..."
pnpm -r build

# 3. 准备部署目录
echo ""
echo "[3/5] Preparing deploy directory..."
sudo mkdir -p "${SITE_DIR}"

# 4. 复制构建产物
echo ""
echo "[4/5] Copying build artifacts..."

# Portal
sudo rm -rf "${SITE_DIR}/portal"
sudo cp -r apps/portal/dist "${SITE_DIR}/portal"

# Consumer
sudo rm -rf "${SITE_DIR}/consumer"
sudo cp -r apps/consumer/dist "${SITE_DIR}/consumer"

# Store Tablet
sudo rm -rf "${SITE_DIR}/tablet"
sudo cp -r apps/store-tablet/dist "${SITE_DIR}/tablet"

# Management
sudo rm -rf "${SITE_DIR}/management"
sudo cp -r apps/management/dist "${SITE_DIR}/management"

# Ops Admin
sudo rm -rf "${SITE_DIR}/ops"
sudo cp -r apps/ops-admin/dist "${SITE_DIR}/ops"

sudo chown -R www-data:www-data "${SITE_DIR}"

echo ""
echo "[5/5] Nginx configuration..."
if [ -f "${NGINX_CONF}" ]; then
    echo "  Nginx config already exists, testing..."
    sudo nginx -t && sudo nginx -s reload
else
    echo "  Copying nginx config..."
    sudo cp deploy/nginx.conf "${NGINX_CONF}"
    echo "  Enabling site..."
    sudo ln -sf "${NGINX_CONF}" /etc/nginx/sites-enabled/dobara
    echo "  Testing & reloading..."
    sudo nginx -t && sudo nginx -s reload
fi

echo ""
echo "========================================"
echo "  Deploy complete!"
echo "  Site: http://your-domain.com"
echo "========================================"
