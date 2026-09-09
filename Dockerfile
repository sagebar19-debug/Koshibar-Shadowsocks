FROM alpine:3.22 AS builder

RUN apk add --no-cache \
    git \
    go \
    build-base \
    linux-headers

WORKDIR /build

RUN git clone --depth 1 https://github.com/shadowsocks/v2ray-plugin.git

WORKDIR /build/v2ray-plugin

RUN go build -trimpath -ldflags="-s -w" -o /usr/local/bin/v2ray-plugin


FROM alpine:3.22

RUN apk add --no-cache \
    shadowsocks-libev \
    ca-certificates

COPY --from=builder /usr/local/bin/v2ray-plugin /usr/local/bin/v2ray-plugin

COPY config.json /etc/shadowsocks-libev/config.json
COPY entrypoint.sh /entrypoint.sh

RUN chmod +x /entrypoint.sh

ENV PORT=8080
ENV KOSHIBAR_PASSWORD=KOSHIBAR

EXPOSE 8080

ENTRYPOINT ["/entrypoint.sh"]
