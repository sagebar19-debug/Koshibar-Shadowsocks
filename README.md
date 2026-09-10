# KÖSHÏBÄR Shadowsocks

Shadowsocks-libev + v2ray-plugin
WebSocket for Google Cloud Run.

## Configuration

Password:

KOSHIBAR

Cipher:

chacha20-ietf-poly1305

WebSocket path:

/Koshibar/Shadowsocks

External port:

443

Internal container port:

8080

TLS:

Managed by Google Cloud Run

## Cloud Run

Cloud Run terminates TLS on the external HTTPS/WSS endpoint.

The container listens on:

0.0.0.0:8080

## Client

Server:

YOUR-CLOUD-RUN-DOMAIN

Port:

443

Password:

KOSHIBAR

Encryption:

chacha20-ietf-poly1305

Plugin:

v2ray-plugin

Transport:

websocket-tls

Host:

YOUR-CLOUD-RUN-DOMAIN

Path:

/Koshibar/Shadowsocks

Concurrent connections:

0

## Important

This service is TCP only.

Cloud Run WebSockets have a maximum request
timeout of 60 minutes.

The client must support reconnection.
