#!/usr/bin/env bash
# 紧急修复：公网 IP 只显示 Welcome to nginx!
# 用法（在服务器任意目录均可）:
#   curl -fsSL 不行则 git pull 后:
#   bash /path/to/Dobara/UI/deploy/fix-nginx-welcome.sh
set -euo pipefail

SITE_DIR="/var/www/dobara"
NGINX_CONF="/etc/nginx/conf.d/dobara.conf"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "======== 1) Diagnose ========"
echo "-- nginx processes --"
ps aux | grep -E '[n]ginx' || true
echo "-- listen :80 --"
ss -lntp 2>/dev/null | grep ':80 ' || netstat -lntp 2>/dev/null | grep ':80 ' || true
echo "-- conf includes --"
grep -nE 'include|conf\.d|sites-' /etc/nginx/nginx.conf 2>/dev/null || true
echo "-- conf.d / sites-enabled --"
ls -la /etc/nginx/conf.d/ 2>/dev/null || true
ls -la /etc/nginx/sites-enabled/ 2>/dev/null || true
echo "-- site files --"
ls -la "${SITE_DIR}/index.html" 2>/dev/null || echo "MISSING ${SITE_DIR}/index.html"
ls -la "${SITE_DIR}/consumer/index.html" 2>/dev/null || echo "MISSING consumer index"
echo "-- which server blocks claim port 80 --"
sudo nginx -T 2>/dev/null | grep -nE 'listen |server_name |root |Welcome|default_server' | head -n 80 || true

echo ""
echo "======== 2) Disable ALL default / welcome sites ========"
# RHEL / CentOS / Alibaba / Amazon
for f in \
  /etc/nginx/conf.d/default.conf \
  /etc/nginx/conf.d/default.conf.bak \
  /etc/nginx/conf.d/welcome.conf
do
  if [ -f "$f" ]; then
    sudo mv "$f" "${f}.disabled.$(date +%s)"
    echo "disabled $f"
  fi
done
# Debian / Ubuntu
sudo rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true
if [ -f /etc/nginx/sites-available/default ]; then
  sudo mv /etc/nginx/sites-available/default "/etc/nginx/sites-available/default.disabled.$(date +%s)" || true
fi

# 若主配置里内嵌了 listen 80 的欢迎站，备份并改用最小主配置 include
if grep -qE 'root\s+/usr/share/nginx/html' /etc/nginx/nginx.conf 2>/dev/null \
  && grep -qE 'listen\s+80' /etc/nginx/nginx.conf 2>/dev/null; then
  echo "WARN: main nginx.conf contains listen 80 + /usr/share/nginx/html"
  echo "Backing up nginx.conf and stripping inline server blocks is risky;"
  echo "will rely on conf.d default_server instead."
fi

echo ""
echo "======== 3) Install Dobara server (default_server) ========"
if [ -f "${SCRIPT_DIR}/nginx.conf" ]; then
  sudo cp "${SCRIPT_DIR}/nginx.conf" "${NGINX_CONF}"
else
  echo "nginx.conf not beside script; writing embedded conf"
  sudo tee "${NGINX_CONF}" >/dev/null <<'EOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;
    root /var/www/dobara;
    index index.html;

    location ^~ /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable" always;
        try_files $uri =404;
    }
    location ^~ /consumer/assets/ { expires 1y; add_header Cache-Control "public, immutable" always; }
    location ^~ /tablet/assets/ { expires 1y; add_header Cache-Control "public, immutable" always; }
    location ^~ /management/assets/ { expires 1y; add_header Cache-Control "public, immutable" always; }
    location ^~ /ops/assets/ { expires 1y; add_header Cache-Control "public, immutable" always; }

    location = /consumer { return 302 /consumer/; }
    location = /tablet { return 302 /tablet/; }
    location = /management { return 302 /management/; }
    location = /ops { return 302 /ops/; }

    location ^~ /consumer/ {
        add_header Cache-Control "no-cache, no-store, must-revalidate" always;
        try_files $uri $uri/ /consumer/index.html;
    }
    location ^~ /tablet/ {
        add_header Cache-Control "no-cache, no-store, must-revalidate" always;
        try_files $uri $uri/ /tablet/index.html;
    }
    location ^~ /management/ {
        add_header Cache-Control "no-cache, no-store, must-revalidate" always;
        try_files $uri $uri/ /management/index.html;
    }
    location ^~ /ops/ {
        add_header Cache-Control "no-cache, no-store, must-revalidate" always;
        try_files $uri $uri/ /ops/index.html;
    }

    location / {
        add_header Cache-Control "no-cache, no-store, must-revalidate" always;
        try_files $uri $uri/ /index.html;
    }
}
EOF
fi

# 确保 conf.d 被主配置 include
if ! grep -qE 'include\s+.*conf\.d/\*\.conf' /etc/nginx/nginx.conf 2>/dev/null; then
  echo "ERROR: /etc/nginx/nginx.conf does not include conf.d/*.conf"
  echo "Add this inside http { }:  include /etc/nginx/conf.d/*.conf;"
  exit 1
fi

echo ""
echo "======== 4) Test & restart (not just reload) ========"
sudo nginx -t
# restart 比 reload 更能清掉旧 default_server
sudo systemctl restart nginx
sleep 1
sudo systemctl is-active nginx

echo ""
echo "======== 5) Local smoke test ========"
echo "-- curl localhost Host --"
curl -sI http://127.0.0.1/ | head -n 15 || true
echo "-- curl body head --"
BODY="$(curl -s http://127.0.0.1/ | head -c 400 || true)"
echo "$BODY"
if echo "$BODY" | grep -qi 'Welcome to nginx'; then
  echo ""
  echo "FAIL: still welcome page on 127.0.0.1"
  echo "Dumping active server blocks:"
  sudo nginx -T 2>/dev/null | grep -nE 'listen |server_name |root ' | head -n 100
  exit 2
fi

if [ ! -f "${SITE_DIR}/index.html" ]; then
  echo ""
  echo "WARN: site files missing under ${SITE_DIR}."
  echo "Config is OK, but you must run:  bash deploy/deploy.sh"
  exit 3
fi

if echo "$BODY" | grep -qi 'Dobara\|root\|<!DOCTYPE'; then
  echo ""
  echo "OK: localhost no longer shows welcome page."
else
  echo ""
  echo "WARN: not welcome, but body unexpected — check ${SITE_DIR}/index.html"
fi

IP="$(curl -s --max-time 3 ifconfig.me 2>/dev/null || true)"
echo "Open: http://${IP:-YOUR_PUBLIC_IP}/"
echo "If public IP still shows welcome but localhost OK → 安全组/另一台机器/CDN 指错了。"
