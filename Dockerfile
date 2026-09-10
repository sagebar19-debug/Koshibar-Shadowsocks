FROM alpine:3.22 AS builder

RUN apk add --no-cache \
    git \
    go \
    build-base

RUN git clone --depth 1 https://github.com/shadowsocks/v2ray-plugin.git /src/v2ray-plugin

WORKDIR /src/v2ray-plugin

RUN go build -o /v2ray-plugin .


FROM alpine:3.22

RUN apk add --no-cache \
    shadowsocks-libev \
    ca-certificates

COPY --from=builder /v2ray-plugin /usr/local/bin/v2ray-plugin

WORKDIR /app

COPY config.json /app/config.json
COPY start.sh /app/start.sh

RUN chmod +x /app/start.sh

EXPOSE 8080

CMD ["/app/start.sh"]
