const { WebSocketServer, WebSocket } = require("ws");

const PORT = process.env.WS_PORT || 3001;

const wss = new WebSocketServer({ port: PORT }, () => {
  console.log(`[WebSocket Server] Running on ws://localhost:${PORT}`);
});

// Map of userId -> Set of WebSocket client connections
const onlineUsers = new Map();
// Map of userId -> Last seen ISO string timestamp
const lastSeenMap = new Map();

// Helper to broadcast online users list & last seen timestamps to all connected clients
function broadcastOnlineUsers() {
  const onlineUserIds = Array.from(onlineUsers.keys());
  const lastSeenObj = {};
  for (const [uid, ts] of lastSeenMap.entries()) {
    lastSeenObj[uid] = ts;
  }

  const payload = JSON.stringify({
    type: "online_users",
    onlineUserIds,
    lastSeenMap: lastSeenObj,
  });

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

wss.on("connection", (ws) => {
  let registeredUserId = null;
  ws.isAlive = true;

  ws.on("pong", () => {
    ws.isAlive = true;
  });

  ws.on("message", (rawMessage) => {
    try {
      const data = JSON.parse(rawMessage.toString());

      if (data.type === "register" && data.userId) {
        registeredUserId = String(data.userId);

        if (!onlineUsers.has(registeredUserId)) {
          onlineUsers.set(registeredUserId, new Set());
        }
        onlineUsers.get(registeredUserId).add(ws);

        console.log(`[WebSocket] User connected: ${registeredUserId} (Total online: ${onlineUsers.size})`);
        
        // Broadcast updated online list to all users
        broadcastOnlineUsers();
      }

      // Handle real-time chat message relay
      if (data.type === "send_message" && data.message) {
        const { receiverId } = data.message;
        const targetSockets = onlineUsers.get(String(receiverId));

        if (targetSockets) {
          const payload = JSON.stringify({
            type: "new_message",
            message: data.message,
          });

          targetSockets.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(payload);
            }
          });
        }
      }
      // Handle real-time typing indicator relay
      if (data.type === "typing" && data.receiverId) {
        const { receiverId, isTyping } = data;
        const targetSockets = onlineUsers.get(String(receiverId));

        if (targetSockets) {
          const payload = JSON.stringify({
            type: "typing",
            senderId: registeredUserId,
            isTyping: isTyping
          });

          targetSockets.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(payload);
            }
          });
        }
      }
    } catch (err) {
      console.error("[WebSocket Error] Failed to parse message:", err);
    }
  });

  ws.on("close", () => {
    if (registeredUserId && onlineUsers.has(registeredUserId)) {
      const userSockets = onlineUsers.get(registeredUserId);
      userSockets.delete(ws);

      if (userSockets.size === 0) {
        onlineUsers.delete(registeredUserId);
        lastSeenMap.set(registeredUserId, new Date().toISOString());
        console.log(`[WebSocket] User disconnected: ${registeredUserId} (Total online: ${onlineUsers.size})`);
      }
      
      // Broadcast updated online list to all users
      broadcastOnlineUsers();
    }
  });

  ws.on("error", (err) => {
    console.error("[WebSocket Socket Error]:", err.message);
  });
});

// Ping interval every 15s to keep connections alive & catch dropped sockets
const interval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) return ws.terminate();
    ws.isAlive = false;
    ws.ping();
  });
}, 15000);

wss.on("close", () => {
  clearInterval(interval);
});
