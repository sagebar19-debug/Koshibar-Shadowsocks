# KÖSHÏBÄR Shadowsocks

Shadowsocks-libev + v2ray-plugin
for Google Cloud Run.

## Configuration

Password:

KOSHIBAR

Cipher:

chacha20-ietf-poly1305

WebSocket path:

/Koshibar/Shadowsocks

Cloud Run container port:

8080

## Environment variables

KOSHIBAR_PASSWORD

Default:

KOSHIBAR

WS_PATH

Default:

/Koshibar/Shadowsocks

## Client

Server:

YOUR-CLOUD-RUN-DOMAIN

Port:

443

Password:

KOSHIBAR

Cipher:

chacha20-ietf-poly1305

Plugin:

v2ray-plugin

Transport:

WebSocket

TLS:

Enabled

Host:

YOUR-CLOUD-RUN-DOMAIN

Path:

/Koshibar/Shadowsocks

## Cloud Run

Cloud Run terminates HTTPS/TLS.

The container listens on the PORT environment
variable supplied by Cloud Run.

The external connection uses:

HTTPS / WSS

The internal container uses:

HTTP / WebSocket

## Important

Cloud Run WebSocket connections are subject to
the Cloud Run request timeout.

Clients must support reconnecting.

This configuration is TCP only.
