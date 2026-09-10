#!/bin/sh

set -eu

PORT="${PORT:-8080}"
PASSWORD="${KOSHIBAR_PASSWORD:-KOSHIBAR}"
PATH_WS="${WS_PATH:-/Koshibar/Shadowsocks}"

echo "=========================================="
echo "       KÖSHÏBÄR SHADOWSOCKS"
echo "=========================================="
echo "Port      : ${PORT}"
echo "Password  : configured"
echo "Path      : ${PATH_WS}"
echo "Cipher    : chacha20-ietf-poly1305"
echo "Transport : WebSocket"
echo "=========================================="

cat > /tmp/shadowsocks.json <<EOF
{
  "server": "0.0.0.0",
  "server_port": ${PORT},
  "password": "${PASSWORD}",
  "method": "chacha20-ietf-poly1305",
  "timeout": 300,
  "mode": "tcp_only"
}
EOF

exec ss-server \
  -c /tmp/shadowsocks.json \
  --plugin v2ray-plugin \
  --plugin-opts "server;path=${PATH_WS}"
