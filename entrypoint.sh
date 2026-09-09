#!/bin/sh

set -eu

PORT="${PORT:-8080}"
PASSWORD="${KOSHIBAR_PASSWORD:-KOSHIBAR}"

echo "=========================================="
echo "        KÖSHÏBÄR SHADOWSOCKS"
echo "=========================================="
echo "Port : ${PORT}"
echo "Path : /Koshibar/Shadowsocks"
echo "Mode : WebSocket"
echo "=========================================="

cat > /tmp/config.json <<EOF
{
  "server": "0.0.0.0",
  "server_port": ${PORT},
  "password": "${PASSWORD}",
  "method": "chacha20-ietf-poly1305",
  "timeout": 300,
  "mode": "tcp_only",
  "plugin": "/usr/local/bin/v2ray-plugin",
  "plugin_opts": "server;mode=websocket;path=/Koshibar/Shadowsocks"
}
EOF

exec ss-server \
  -c /tmp/config.json \
  -v
