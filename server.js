const http = require("http");
const crypto = require("crypto");
const WebSocket = require("ws");

const PORT = Number(process.env.PORT || 8080);
const PASSWORD = process.env.KOSHIBAR_PASSWORD || "KOSHIBAR";
const WS_PATH = "/Koshibar/Shadowsocks";

const server = http.createServer((req, res) => {
  if (req.url === "/") {
    res.writeHead(200, {
      "Content-Type": "text/plain; charset=utf-8"
    });

    res.end("KÖSHÏBÄR WebSocket service is running.\n");
    return;
  }

  if (req.url === "/health") {
    res.writeHead(200, {
      "Content-Type": "application/json"
    });

    res.end(JSON.stringify({
      status: "ok",
      service: "koshibar-shadowsocks"
    }));

    return;
  }

  res.writeHead(404);
  res.end("Not found");
});

const wss = new WebSocket.Server({
  noServer: true
});

server.on("upgrade", (req, socket, head) => {
  const url = new URL(
    req.url,
    `http://${req.headers.host || "localhost"}`
  );

  if (url.pathname !== WS_PATH) {
    socket.write(
      "HTTP/1.1 404 Not Found\r\n" +
      "Connection: close\r\n\r\n"
    );

    socket.destroy();
    return;
  }

  const suppliedPassword = url.searchParams.get("password");

  if (
    suppliedPassword &&
    crypto.timingSafeEqual(
      Buffer.from(suppliedPassword),
      Buffer.from(PASSWORD)
    )
  ) {
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit("connection", ws, req);
    });

    return;
  }

  socket.write(
    "HTTP/1.1 401 Unauthorized\r\n" +
    "Connection: close\r\n\r\n"
  );

  socket.destroy();
});

wss.on("connection", (ws) => {
  ws.send("KOSHIBAR WebSocket connected");

  ws.on("message", (message) => {
    ws.send(message);
  });

  ws.on("error", () => {
    ws.close();
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`KOSHIBAR service listening on ${PORT}`);
  console.log(`WebSocket path: ${WS_PATH}`);
});
