# KÖSHÏBÄR WebSocket

WebSocket service designed for Google Cloud Run.

## Configuration

Password:

KOSHIBAR

WebSocket path:

/Koshibar/Shadowsocks

Port:

8080

## Local test

npm install

npm start

## Docker test

docker build -t koshibar-shadowsocks .

docker run --rm \
  -p 8080:8080 \
  -e KOSHIBAR_PASSWORD=KOSHIBAR \
  koshibar-shadowsocks

## Cloud Run

Cloud Run provides the PORT environment variable.

The application listens on:

0.0.0.0:$PORT

Default:

8080

Health check:

/health

WebSocket:

/Koshibar/Shadowsocks
