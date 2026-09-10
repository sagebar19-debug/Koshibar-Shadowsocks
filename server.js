"use strict";

const http = require("http");
const net = require("net");
const crypto = require("crypto");
const WebSocket = require("ws");

const PORT = Number(process.env.PORT || 8080);

const WS_PATH =
  process.env.WS_PATH || "/Koshibar/Shadowsocks";

const PASSWORD =
  process.env.KOSHIBAR_PASSWORD || "KOSHIBAR";

const METHOD =
  process.env.SS_METHOD || "chacha20-ietf-poly1305";

const MAX_PAYLOAD = 0x3fff;
const TAG_LENGTH = 16;
const SALT_LENGTH = 32;

const INFO = Buffer.from("ss-subkey");

console.log("==========================================");
console.log("       KÖSHÏBÄR SHADOWSOCKS");
console.log("==========================================");
console.log("Port :", PORT);
console.log("Path :", WS_PATH);
console.log("Method :", METHOD);
console.log("==========================================");


/*
 * ============================================================
 * Shadowsocks key derivation
 * ============================================================
 */

function getMasterKey(password) {
  return crypto
    .createHash("sha256")
    .update(password, "utf8")
    .digest();
}


function hkdfExtract(salt, ikm) {
  return crypto
    .createHmac("sha1", salt)
    .update(ikm)
    .digest();
}


function hkdfExpand(prk, info, length) {
  const blocks = [];
  let previous = Buffer.alloc(0);

  let counter = 1;

  while (Buffer.concat(blocks).length < length) {
    previous = crypto
      .createHmac("sha1", prk)
      .update(previous)
      .update(info)
      .update(Buffer.from([counter]))
      .digest();

    blocks.push(previous);
    counter++;
  }

  return Buffer.concat(blocks).subarray(0, length);
}


function deriveSubkey(masterKey, salt) {
  const prk = hkdfExtract(salt, masterKey);

  return hkdfExpand(
    prk,
    INFO,
    32
  );
}


/*
 * ============================================================
 * Nonce
 * ============================================================
 */

function incrementNonce(nonce) {
  for (let i = 0; i < nonce.length; i++) {
    nonce[i]++;

    if (nonce[i] !== 0) {
      break;
    }
  }
}


/*
 * ============================================================
 * AEAD decrypt
 * ============================================================
 */

function decryptChunk(
  encrypted,
  key,
  nonce
) {
  if (encrypted.length < TAG_LENGTH) {
    throw new Error("Encrypted chunk too small");
  }

  const ciphertext =
    encrypted.subarray(
      0,
      encrypted.length - TAG_LENGTH
    );

  const tag =
    encrypted.subarray(
      encrypted.length - TAG_LENGTH
    );

  const decipher =
    crypto.createDecipheriv(
      "chacha20-poly1305",
      key,
      nonce,
      {
        authTagLength: TAG_LENGTH
      }
    );

  decipher.setAuthTag(tag);

  const plaintext =
    Buffer.concat([
      decipher.update(ciphertext),
      decipher.final()
    ]);

  return plaintext;
}


/*
 * ============================================================
 * AEAD encrypt
 * ============================================================
 */

function encryptChunk(
  plaintext,
  key,
  nonce
) {
  const cipher =
    crypto.createCipheriv(
      "chacha20-poly1305",
      key,
      nonce,
      {
        authTagLength: TAG_LENGTH
      }
    );

  const encrypted =
    Buffer.concat([
      cipher.update(plaintext),
      cipher.final()
    ]);

  const tag = cipher.getAuthTag();

  return Buffer.concat([
    encrypted,
    tag
  ]);
}


/*
 * ============================================================
 * Shadowsocks address parser
 * ============================================================
 */

function parseAddress(buffer) {
  if (!buffer || buffer.length < 1) {
    throw new Error("Missing address");
  }

  const type = buffer[0];

  let offset = 1;
  let host;

  if (type === 0x01) {
    if (buffer.length < offset + 4 + 2) {
      throw new Error("Invalid IPv4 address");
    }

    host = Array.from(
      buffer.subarray(offset, offset + 4)
    ).join(".");

    offset += 4;

  } else if (type === 0x03) {
    if (buffer.length < offset + 1) {
      throw new Error("Missing domain length");
    }

    const length = buffer[offset];

    offset += 1;

    if (
      buffer.length <
      offset + length + 2
    ) {
      throw new Error("Invalid domain address");
    }

    host =
      buffer
        .subarray(offset, offset + length)
        .toString("utf8");

    offset += length;

  } else if (type === 0x04) {
    if (buffer.length < offset + 16 + 2) {
      throw new Error("Invalid IPv6 address");
    }

    const raw =
      buffer.subarray(offset, offset + 16);

    const parts = [];

    for (let i = 0; i < 16; i += 2) {
      parts.push(
        raw.readUInt16BE(i).toString(16)
      );
    }

    host = parts.join(":");

    offset += 16;

  } else {
    throw new Error(
      `Unsupported address type: ${type}`
    );
  }

  const port =
    buffer.readUInt16BE(offset);

  offset += 2;

  return {
    host,
    port,
    remaining: buffer.subarray(offset)
  };
}


/*
 * ============================================================
 * Shadowsocks connection state
 * ============================================================
 */

class ShadowsocksConnection {

  constructor(ws) {

    this.ws = ws;

    this.masterKey =
      getMasterKey(PASSWORD);

    this.subkey = null;

    this.recvNonce =
      Buffer.alloc(12);

    this.sendNonce =
      Buffer.alloc(12);

    this.buffer = Buffer.alloc(0);

    this.remote = null;

    this.connected = false;

    this.closed = false;

    this.pendingChunks = [];
  }


  append(data) {

    if (this.closed) {
      return;
    }

    this.buffer =
      Buffer.concat([
        this.buffer,
        data
      ]);

    try {

      if (!this.subkey) {

        if (
          this.buffer.length <
          SALT_LENGTH
        ) {
          return;
        }

        const salt =
          this.buffer.subarray(
            0,
            SALT_LENGTH
          );

        this.buffer =
          this.buffer.subarray(
            SALT_LENGTH
          );

        this.subkey =
          deriveSubkey(
            this.masterKey,
            salt
          );

        console.log(
          "Shadowsocks salt received"
        );
      }

      this.process();

    } catch (error) {

      console.error(
        "Shadowsocks processing error:",
        error.message
      );

      this.close();
    }
  }


  process() {

    while (!this.closed) {

      /*
       * ------------------------------------------------------
       * Encrypted length
       * ------------------------------------------------------
       */

      if (this.buffer.length < 2 + TAG_LENGTH) {
        return;
      }

      const encryptedLength =
        this.buffer.subarray(
          0,
          2 + TAG_LENGTH
        );

      let lengthPlaintext;

      try {

        lengthPlaintext =
          decryptChunk(
            encryptedLength,
            this.subkey,
            this.recvNonce
          );

      } catch (error) {

        throw new Error(
          "Invalid Shadowsocks length authentication"
        );
      }

      incrementNonce(
        this.recvNonce
      );

      if (lengthPlaintext.length !== 2) {
        throw new Error(
          "Invalid decrypted length"
        );
      }

      const payloadLength =
        lengthPlaintext.readUInt16BE(0);

      if (
        payloadLength < 1 ||
        payloadLength > MAX_PAYLOAD
      ) {
        throw new Error(
          "Invalid Shadowsocks payload length"
        );
      }


      /*
       * ------------------------------------------------------
       * Wait for encrypted payload
       * ------------------------------------------------------
       */

      const encryptedPayloadLength =
        payloadLength + TAG_LENGTH;

      if (
        this.buffer.length <
        2 + TAG_LENGTH +
        encryptedPayloadLength
      ) {
        return;
      }

      const encryptedPayload =
        this.buffer.subarray(
          2 + TAG_LENGTH,
          2 +
          TAG_LENGTH +
          encryptedPayloadLength
        );

      this.buffer =
        this.buffer.subarray(
          2 +
          TAG_LENGTH +
          encryptedPayloadLength
        );


      let payload;

      try {

        payload =
          decryptChunk(
            encryptedPayload,
            this.subkey,
            this.recvNonce
          );

      } catch (error) {

        throw new Error(
          "Invalid Shadowsocks payload authentication"
        );
      }

      incrementNonce(
        this.recvNonce
      );


      /*
       * ------------------------------------------------------
       * First payload contains destination address
       * ------------------------------------------------------
       */

      if (!this.remote) {

        const address =
          parseAddress(payload);

        this.connectRemote(
          address.host,
          address.port,
          address.remaining
        );

      } else {

        this.writeRemote(
          payload
        );
      }
    }
  }


  connectRemote(
    host,
    port,
    remaining
  ) {

    if (this.connected || this.remote) {
      return;
    }

    console.log(
      `Connecting to ${host}:${port}`
    );

    const socket =
      new net.Socket();

    this.remote = socket;

    socket.setNoDelay(true);

    socket.on(
      "connect",
      () => {

        this.connected = true;

        console.log(
          `Connected to ${host}:${port}`
        );

        if (remaining.length > 0) {
          socket.write(remaining);
        }
      }
    );


    socket.on(
      "data",
      (data) => {

        this.sendToClient(
          data
        );
      }
    );


    socket.on(
      "end",
      () => {

        console.log(
          `Remote ended ${host}:${port}`
        );

        this.close();
      }
    );


    socket.on(
      "close",
      () => {

        this.close();
      }
    );


    socket.on(
      "error",
      (error) => {

        console.error(
          `Remote error ${host}:${port}:`,
          error.message
        );

        this.close();
      }
    );


    socket.connect(
      port,
      host
    );
  }


  writeRemote(data) {

    if (
      !this.remote ||
      !this.connected ||
      this.remote.destroyed
    ) {
      this.pendingChunks.push(data);
      return;
    }

    this.remote.write(data);
  }


  sendToClient(data) {

    if (
      this.closed ||
      !this.subkey ||
      !this.ws ||
      this.ws.readyState !==
        WebSocket.OPEN
    ) {
      return;
    }

    let offset = 0;

    while (offset < data.length) {

      const size =
        Math.min(
          MAX_PAYLOAD,
          data.length - offset
        );

      const chunk =
        data.subarray(
          offset,
          offset + size
        );

      offset += size;

      const length =
        Buffer.alloc(2);

      length.writeUInt16BE(
        chunk.length,
        0
      );

      const encryptedLength =
        encryptChunk(
          length,
          this.subkey,
          this.sendNonce
        );

      incrementNonce(
        this.sendNonce
      );

      const encryptedPayload =
        encryptChunk(
          chunk,
          this.subkey,
          this.sendNonce
        );

      incrementNonce(
        this.sendNonce
      );

      const packet =
        Buffer.concat([
          encryptedLength,
          encryptedPayload
        ]);

      this.ws.send(
        packet
      );
    }
  }


  close() {

    if (this.closed) {
      return;
    }

    this.closed = true;

    if (
      this.remote &&
      !this.remote.destroyed
    ) {
      this.remote.destroy();
    }

    if (
      this.ws &&
      this.ws.readyState ===
        WebSocket.OPEN
    ) {
      this.ws.close();
    }
  }
}


/*
 * ============================================================
 * HTTP server
 * ============================================================
 */

const server =
  http.createServer(
    (req, res) => {

      const url =
        new URL(
          req.url,
          `http://${req.headers.host || "localhost"}`
        );


      if (url.pathname === "/") {

        res.writeHead(
          200,
          {
            "Content-Type":
              "text/plain; charset=utf-8"
          }
        );

        res.end(
          "KÖSHÏBÄR Shadowsocks is running.\n"
        );

        return;
      }


      if (url.pathname === "/health") {

        res.writeHead(
          200,
          {
            "Content-Type":
              "application/json"
          }
        );

        res.end(
          JSON.stringify({
            status: "ok",
            service: "koshibar-shadowsocks",
            protocol: "shadowsocks",
            transport: "websocket",
            path: WS_PATH,
            method: METHOD
          })
        );

        return;
      }


      res.writeHead(
        404,
        {
          "Content-Type":
            "text/plain; charset=utf-8"
        }
      );

      res.end(
        "Not found\n"
      );
    }
  );


/*
 * ============================================================
 * WebSocket server
 * ============================================================
 */

const wss =
  new WebSocket.Server({
    noServer: true,
    maxPayload: 1024 * 1024
  });


server.on(
  "upgrade",
  (req, socket, head) => {

    try {

      const url =
        new URL(
          req.url,
          `http://${req.headers.host || "localhost"}`
        );


      if (
        url.pathname !==
        WS_PATH
      ) {

        socket.write(
          "HTTP/1.1 404 Not Found\r\n" +
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

          wss.emit(
            "connection",
            ws,
            req
          );
        }
      );

    } catch (error) {

      console.error(
        "WebSocket upgrade error:",
        error.message
      );

      socket.destroy();
    }
  }
);


/*
 * ============================================================
 * WebSocket connection
 * ============================================================
 */

wss.on(
  "connection",
  (ws, req) => {

    console.log(
      "Shadowsocks WebSocket connected from",
      req.socket.remoteAddress
    );

    const connection =
      new ShadowsocksConnection(ws);


    ws.on(
      "message",
      (data, isBinary) => {

        try {

          const buffer =
            Buffer.isBuffer(data)
              ? data
              : Buffer.from(data);

          connection.append(buffer);

        } catch (error) {

          console.error(
            "Message processing error:",
            error.message
          );

          connection.close();
        }
      }
    );


    ws.on(
      "close",
      () => {

        console.log(
          "Shadowsocks WebSocket disconnected"
        );

        connection.close();
      }
    );


    ws.on(
      "error",
      (error) => {

        console.error(
          "WebSocket error:",
          error.message
        );

        connection.close();
      }
    );
  }
);


/*
 * ============================================================
 * Start
 * ============================================================
 */

server.listen(
  PORT,
  "0.0.0.0",
  () => {

    console.log(
      "=========================================="
    );

    console.log(
      "KÖSHÏBÄR Shadowsocks started"
    );

    console.log(
      `Listening on 0.0.0.0:${PORT}`
    );

    console.log(
      `WebSocket path: ${WS_PATH}`
    );

    console.log(
      `Cipher: ${METHOD}`
    );

    console.log(
      "=========================================="
    );
  }
);
