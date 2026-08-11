#!/usr/bin/env bash
# 紧急修复：公网 IP 只显示 Welcome to nginx!
# 根因常见于：/etc/nginx/nginx.conf 内嵌 server { server_name <公网IP>; root /usr/share/nginx/html; }
# Host=公网IP 时精确命中欢迎站，而 curl 127.0.0.1 会落到 dobara default_server。
set -euo pipefail

SITE_DIR="/var/www/dobara"
NGINX_CONF="/etc/nginx/conf.d/dobara.conf"
MAIN_CONF="/etc/nginx/nginx.conf"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PUB_IP="$(curl -s --max-time 3 ifconfig.me 2>/dev/null || true)"

echo "======== 1) Diagnose ========"
echo "Public IP: ${PUB_IP:-unknown}"
ls -la /etc/nginx/conf.d/ 2>/dev/null || true
ls -la "${SITE_DIR}/index.html" 2>/dev/null || echo "MISSING ${SITE_DIR}/index.html"
echo "-- server blocks (listen / server_name / root) --"
sudo nginx -T 2>/dev/null | grep -nE 'listen |server_name |root ' | head -n 80 || true

echo ""
echo "======== 2) Disable conf.d welcome files ========"
for f in /etc/nginx/conf.d/default.conf /etc/nginx/conf.d/welcome.conf; do
  if [ -f "$f" ]; then
    sudo mv "$f" "${f}.disabled.$(date +%s)"
    echo "disabled $f"
  fi
done
sudo rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true

echo ""
echo "======== 3) Neutralize welcome server in main nginx.conf ========"
if [ -f "$MAIN_CONF" ] && grep -qE 'root\s+/usr/share/nginx/html' "$MAIN_CONF"; then
  BAK="${MAIN_CONF}.bak.$(date +%s)"
  sudo cp "$MAIN_CONF" "$BAK"
  echo "backup: $BAK"

  # 1) 把指向欢迎页的 root 改掉（防止漏网）
  sudo sed -i -E 's#root[[:space:]]+/usr/share/nginx/html;#root /var/www/dobara;#' "$MAIN_CONF"

  # 2) 关键：改掉精确匹配公网 IP 的 server_name，否则 Host=IP 永远进欢迎 server
  if [ -n "${PUB_IP}" ]; then
    ESC_IP="$(printf '%s' "$PUB_IP" | sed 's/\./\\./g')"
    sudo sed -i -E "s/server_name[[:space:]]+${ESC_IP}[[:space:]]*;/server_name __disabled_welcome__;/" "$MAIN_CONF"
    echo "renamed server_name ${PUB_IP} -> __disabled_welcome__"
  fi

  echo "main nginx.conf sanitized (welcome root / IP server_name)"
else
  echo "No /usr/share/nginx/html root in main conf (ok)"
fi

# 若仍存在 server_name = 公网IP（可能空格不同），强制再处理一次
if [ -n "${PUB_IP}" ] && sudo nginx -T 2>/dev/null | grep -qE "server_name[[:space:]]+${PUB_IP}"; then
  echo "Still found server_name ${PUB_IP} in effective config — forcing sed on main conf"
  ESC_IP="$(printf '%s' "$PUB_IP" | sed 's/\./\\./g')"
  sudo sed -i -E "s/server_name[[:space:]]+${ESC_IP}[[:space:]]*;/server_name __disabled_welcome__;/" "$MAIN_CONF"
fi

echo ""
echo "======== 4) Install Dobara default_server ========"
if [ -f "${SCRIPT_DIR}/nginx.conf" ]; then
  sudo cp "${SCRIPT_DIR}/nginx.conf" "${NGINX_CONF}"
else
  echo "ERROR: ${SCRIPT_DIR}/nginx.conf missing"
  exit 1
fi

# 同时让 dobara 也显式声明公网 IP，双保险
if [ -n "${PUB_IP}" ]; then
  sudo sed -i -E "s/server_name _;/server_name ${PUB_IP} _;/" "${NGINX_CONF}"
  echo "dobara server_name includes ${PUB_IP}"
fi

if ! grep -qE 'include\s+.*/conf\.d/\*\.conf' "$MAIN_CONF"; then
  echo "ERROR: main nginx.conf does not include conf.d/*.conf"
  exit 1
fi

echo ""
echo "======== 5) Test & restart ========"
sudo nginx -t
sudo systemctl restart nginx
sleep 1

echo ""
echo "======== 6) Smoke test with Host=公网IP ========"
HOST_HEADER="${PUB_IP:-127.0.0.1}"
echo "curl -H Host: ${HOST_HEADER}"
curl -sI -H "Host: ${HOST_HEADER}" http://127.0.0.1/ | head -n 20 || true
BODY="$(curl -s -H "Host: ${HOST_HEADER}" http://127.0.0.1/ | head -c 500 || true)"
echo "$BODY"

if echo "$BODY" | grep -qi 'Welcome to nginx'; then
  echo ""
  echo "FAIL: Host=${HOST_HEADER} still welcome page"
  echo "Effective matching servers:"
  sudo nginx -T 2>/dev/null | grep -nE 'listen |server_name |root ' | head -n 120
  exit 2
fi

if echo "$BODY" | grep -qi 'Dobara\|DOCTYPE'; then
  echo ""
  echo "OK: Host=${HOST_HEADER} serves Dobara."
  echo "Open: http://${HOST_HEADER}/"
else
  echo ""
  echo "WARN: unexpected body — check ${SITE_DIR}/index.html"
fi
