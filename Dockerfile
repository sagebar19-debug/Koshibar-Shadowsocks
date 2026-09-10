FROM alpine:3.22

RUN apk add --no-cache \
    shadowsocks-libev \
    ca-certificates \
    curl \
    tar

ARG V2RAY_VERSION=v1.3.2

RUN curl -fL \
    "https://github.com/shadowsocks/v2ray-plugin/releases/download/${V2RAY_VERSION}/v2ray-plugin-linux-amd64-${V2RAY_VERSION}.tar.gz" \
    -o /tmp/v2ray-plugin.tar.gz \
    && tar -xzf /tmp/v2ray-plugin.tar.gz -C /tmp \
    && find /tmp -type f -name 'v2ray-plugin_linux_amd64' -exec cp {} /usr/local/bin/v2ray-plugin \; \
    && chmod +x /usr/local/bin/v2ray-plugin \
    && rm -rf /tmp/*

WORKDIR /app

COPY start.sh /app/start.sh

RUN chmod +x /app/start.sh

EXPOSE 8080

CMD ["/app/start.sh"]
