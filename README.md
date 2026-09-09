# KÖSHÏBÄR Shadowsocks

KÖSHÏBÄR WebSocket service designed for Google Cloud Run.

## Configuration

Service:

KÖSHÏBÄR

Password:

KOSHIBAR

WebSocket path:

/Koshibar/Shadowsocks

Default port:

8080

## Project structure

koshibar-shadowsocks/
├── Dockerfile
├── package.json
├── server.js
├── .dockerignore
└── README.md

## Cloud Run

The application automatically uses the
PORT environment variable provided by Cloud Run.

Default:

8080

The application listens on:

0.0.0.0:$PORT

## Endpoints

Home:

/

Health:

/health

WebSocket:

/Koshibar/Shadowsocks

## WebSocket authentication

The password is:

KOSHIBAR

The WebSocket test URL uses:

?password=KOSHIBAR

Example:

wss://YOUR-CLOUD-RUN-URL/Koshibar/Shadowsocks?password=KOSHIBAR

## Environment variable

You can change the password with:

KOSHIBAR_PASSWORD

Default:

KOSHIBAR

## Local installation

npm install

npm start

## Docker

Build:

docker build -t koshibar-shadowsocks .

Run:

docker run \
  -p 8080:8080 \
  -e KOSHIBAR_PASSWORD=KOSHIBAR \
  koshibar-shadowsocks

## Cloud Run configuration

Container port:

8080

Authentication:

Allow unauthenticated

Region:

europe-west1

## Important

This project provides a WebSocket tunnel/service.

It is NOT a native Shadowsocks server and does
not generate or accept a standard ss:// Shadowsocks
configuration by itself.

For a native Shadowsocks server, a real Shadowsocks
implementation and compatible client protocol are
required.
