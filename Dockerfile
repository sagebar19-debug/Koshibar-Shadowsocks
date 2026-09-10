FROM alpine:3.22

RUN apk add --no-cache \
    shadowsocks-libev \
    ca-certificates \
    curl \
    unzip

ARG TARGETARCH

RUN set -eux; \
    if [ "$TARGETARCH" = "amd64" ]; then \
        V2RAY_ARCH="64"; \
    elif [ "$TARGETARCH" = "arm64" ]; then \
        V2RAY_ARCH="arm64-v8a"; \
    else \
        echo "Unsupported architecture: $TARGETARCH"; \
        exit 1; \
    fi; \
    curl -fL \
      "https://github.com/shadowsocks/v2ray-plugin/releases/latest/download/v2ray-plugin-linux-${V2RAY_ARCH}-v1.3.2.tar.gz" \
      -o /tmp/v2ray-plugin.tar.gz; \
    tar -xzf /tmp/v2ray-plugin.tar.gz -C /tmp; \
    find /tmp -type f -name 'v2ray-plugin*' -exec cp {} /usr/local/bin/v2ray-plugin \; ; \
    chmod +x /usr/local/bin/v2ray-plugin; \
    rm -rf /tmp/*

WORKDIR /app

COPY config.json /app/config.json
COPY start.sh /app/start.sh

RUN chmod +x /app/start.sh

EXPOSE 8080

CMD ["/app/start.sh"]
