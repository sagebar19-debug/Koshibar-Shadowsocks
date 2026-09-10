#!/bin/sh

set -eu

PORT="${PORT:-8080}"
PASSWORD="${KOSHIBAR_PASSWORD:-KOSHIBAR}"
WS_PATH="${WS_PATH:-/Koshibar/Shadowsocks}"

echo "=========================================="
echo "        KÖSHÏBÄR SHADOWSOCKS"
echo "=========================================="
echo "Port      : ${PORT}"
echo "Path      : ${WS_PATH}"
echo "Cipher    : chacha20-ietf-poly1305"
echo "Transport : WebSocket"
echo "TLS       : Cloud Run"
echo "=========================================="

cat > /tmp/shadowsocks.json <<EOF
{
  "server": "0.0.0.0",
  "server_port": ${PORT},
  "password": "${PASSWORD}",
  "method": "chacha20-ietf-poly1305",
  "timeout": 300,
  "mode": "tcp_only",
  "plugin": "v2ray-plugin",
  "plugin_opts": "server;path=${WS_PATH}"
}
EOF

echo "Starting ss-server..."

exec ss-server \
    -c /tmp/shadowsocks.json
