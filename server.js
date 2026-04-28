const http = require("http");
const WebSocket = require("ws");

const PORT = process.env.PORT || 3000;
const PRAYERS = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
const RATE_LIMIT_WINDOW = 60 * 1000;
const MAX_REMINDERS_PER_WINDOW = 5;

const server = http.createServer();
const wss = new WebSocket.Server({ server });

const rateLimits = new Map();

const isValidToken = (token) => {
  return typeof token === "string" && /^[0-9a-fA-F-]{36}$/.test(token);
};

const isValidPrayer = (prayer) => PRAYERS.includes(prayer);

const sendJson = (ws, payload) => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload));
  }
};

const broadcast = (payload) => {
  const message = JSON.stringify(payload);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
};

const createError = (message) => ({ type: "error", message });

wss.on("connection", (ws) => {
  ws.isAlive = true;
  ws.clientToken = null;

  sendJson(ws, { type: "connected" });

  ws.on("pong", () => {
    ws.isAlive = true;
  });

  ws.on("message", (message) => {
    let data;

    try {
      data = JSON.parse(message.toString());
    } catch (err) {
      sendJson(ws, createError("Invalid JSON format."));
      return;
    }

    if (data.type === "join") {
      if (!isValidToken(data.token)) {
        sendJson(ws, createError("Invalid authentication token."));
        return;
      }

      ws.clientToken = data.token;
      sendJson(ws, { type: "connected" });
      return;
    }

    if (data.type === "reminder") {
      if (!ws.clientToken || ws.clientToken !== data.token) {
        sendJson(ws, createError("Unauthorized reminder event."));
        return;
      }

      if (!isValidPrayer(data.prayer)) {
        sendJson(ws, createError("Invalid prayer name."));
        return;
      }

      const now = Date.now();
      const bucket = rateLimits.get(ws.clientToken) || {
        count: 0,
        resetAt: now + RATE_LIMIT_WINDOW,
      };

      if (now > bucket.resetAt) {
        bucket.count = 0;
        bucket.resetAt = now + RATE_LIMIT_WINDOW;
      }

      if (bucket.count >= MAX_REMINDERS_PER_WINDOW) {
        rateLimits.set(ws.clientToken, bucket);
        sendJson(ws, createError("Rate limit exceeded. Please wait a moment."));
        return;
      }

      bucket.count += 1;
      rateLimits.set(ws.clientToken, bucket);

      broadcast({
        type: "reminder",
        prayer: data.prayer,
        timestamp: data.timestamp || new Date().toISOString(),
      });
      return;
    }

    sendJson(ws, createError("Unsupported message type."));
  });

  ws.on("close", () => {
    // Keep rate limit state for the client token; it is not cleaned immediately.
  });
});

const healthCheckInterval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) {
      return ws.terminate();
    }

    ws.isAlive = false;
    ws.ping(() => {});
  });
}, 30000);

wss.on("close", () => {
  clearInterval(healthCheckInterval);
});

server.listen(PORT, () => {
  console.log(
    `Salah Reminder Network server running on ws://localhost:${PORT}`,
  );
});
