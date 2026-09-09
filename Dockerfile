FROM alpine:3.22

RUN apk add --no-cache \
    shadowsocks-libev \
    v2ray-plugin \
    ca-certificates

COPY config.json /etc/shadowsocks-libev/config.json

EXPOSE 8080/tcp
EXPOSE 80/tcp
EXPOSE 443/tcp

CMD ["ss-server", "-c", "/etc/shadowsocks-libev/config.json"]
