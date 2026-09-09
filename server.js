const http = require("http");
const crypto = require("crypto");
const WebSocket = require("ws");

const PORT = Number(process.env.PORT || 8080);

const PASSWORD = process.env.KOSHIBAR_PASSWORD || "KOSHIBAR";

const WS_PATH = "/Koshibar/Shadowsocks";

const server = http.createServer((req, res) => {
  const url = new URL(
    req.url,
    `http://${req.headers.host || "localhost"}`
  );

  if (url.pathname === "/") {
    res.writeHead(200, {
      "Content-Type": "text/plain; charset=utf-8"
    });

    res.end(
      "KÖSHÏBÄR WebSocket service is running.\n"
    );

    return;
  }

  if (url.pathname === "/health") {
    res.writeHead(200, {
      "Content-Type": "application/json"
    });

    res.end(
      JSON.stringify({
        status: "ok",
        service: "koshibar-shadowsocks",
        websocket_path: WS_PATH
      })
    );

    return;
  }

  res.writeHead(404, {
    "Content-Type": "text/plain; charset=utf-8"
  });

  res.end("Not found\n");
});

const wss = new WebSocket.Server({
  noServer: true
});

server.on("upgrade", (req, socket, head) => {
  try {
    const url = new URL(
      req.url,
      `http://${req.headers.host || "localhost"}`
    );

    if (url.pathname !== WS_PATH) {
      socket.write(
        "HTTP/1.1 404 Not Found\r\n" +
        "Connection: close\r\n" +
        "\r\n"
      );

      socket.destroy();
      return;
    }

    const suppliedPassword =
      url.searchParams.get("password");

    if (!suppliedPassword) {
      socket.write(
        "HTTP/1.1 401 Unauthorized\r\n" +
        "Connection: close\r\n" +
        "\r\n"
      );

      socket.destroy();
      return;
    }

    const supplied = Buffer.from(
      suppliedPassword,
      "utf8"
    );

    const expected = Buffer.from(
      PASSWORD,
      "utf8"
    );

    if (
      supplied.length !== expected.length ||
      !crypto.timingSafeEqual(supplied, expected)
    ) {
      socket.write(
        "HTTP/1.1 401 Unauthorized\r\n" +
        "Connection: close\r\n" +
        "\r\n"
      );

      socket.destroy();
      return;
    }

    wss.handleUpgrade(
      req,
      socket,
      head,
      (ws) => {
        wss.emit("connection", ws, req);
      }
    );

  } catch (error) {
    console.error("WebSocket upgrade error:", error);

    socket.destroy();
  }
});

wss.on("connection", (ws) => {
  console.log("KOSHIBAR WebSocket connected");

  ws.send(
    JSON.stringify({
      service: "KOSHIBAR",
      status: "connected",
      path: WS_PATH
    })
  );

  ws.on("message", (message) => {
    ws.send(message);
  });

  ws.on("close", () => {
    console.log("KOSHIBAR WebSocket disconnected");
  });

  ws.on("error", (error) => {
    console.error(
      "WebSocket error:",
      error.message
    );
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(
    `KOSHIBAR service listening on ${PORT}`
  );

  console.log(
    `WebSocket path: ${WS_PATH}`
  );

  console.log(
    "Password authentication: enabled"
  );
});
