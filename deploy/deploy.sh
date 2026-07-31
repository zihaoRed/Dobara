#!/usr/bin/env bash
# ============================================================
# Dobara 一键更新部署脚本
# 使用: bash deploy/deploy.sh
# 每次更新线上版本只需执行这一条命令
# ============================================================
set -e

SITE_DIR="/var/www/dobara"
NGINX_CONF="/etc/nginx/conf.d/dobara.conf"

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
echo "[5/6] Nginx config..."
if [ ! -f "${NGINX_CONF}" ]; then
    cat > /tmp/dobara_nginx.conf << 'NGINXEOF'
server {
    listen 80;
    server_name _;

    root /var/www/dobara;
    index index.html;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml;

    location /assets/ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /consumer {
        alias /var/www/dobara/consumer;
        try_files $uri $uri/ /consumer/index.html;
    }

    location /tablet {
        alias /var/www/dobara/tablet;
        try_files $uri $uri/ /tablet/index.html;
    }

    location /management {
        alias /var/www/dobara/management;
        try_files $uri $uri/ /management/index.html;
    }

    location /ops {
        alias /var/www/dobara/ops;
        try_files $uri $uri/ /ops/index.html;
    }
}
NGINXEOF
    sudo cp /tmp/dobara_nginx.conf "${NGINX_CONF}"
fi

echo ""
echo "[6/6] Reloading Nginx..."
sudo nginx -t && sudo systemctl reload nginx

echo ""
echo "========================================"
echo "  Deploy complete!"
echo "  http://$(curl -s ifconfig.me 2>/dev/null || echo 'YOUR_IP')"
echo "========================================"
