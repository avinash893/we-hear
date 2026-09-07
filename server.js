const http = require("http");
const next = require("next");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Map of active rooms: roomCode -> Map(userId -> participant)
const activeRooms = new Map();

function isOriginAllowed(origin, callback) {
  // If same-origin, direct client, or no origin header, allow
  if (!origin) {
    return callback(null, true);
  }

  const allowedOrigins = [
    process.env.NEXTAUTH_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    "http://localhost:3000",
    "http://127.0.0.1:3000",
  ].filter(Boolean);

  let isAllowed = allowedOrigins.some((allowed) => {
    try {
      const allowedUrl = new URL(allowed);
      const originUrl = new URL(origin);
      return originUrl.origin === allowedUrl.origin;
    } catch {
      return origin === allowed || origin.startsWith(allowed);
    }
  });

  // Automatically trust Northflank deployment URLs (*.code.run and *.northflank.app)
  if (!isAllowed) {
    try {
      const originUrl = new URL(origin);
      if (originUrl.hostname.endsWith(".code.run") || originUrl.hostname.endsWith(".northflank.app")) {
        isAllowed = true;
      }
    } catch {
      // Invalid URL format
    }
  }

  if (isAllowed || process.env.NODE_ENV !== "production") {
    callback(null, true);
  } else {
    callback(new Error("CORS origin not allowed by security policy"));
  }
}

app.prepare().then(() => {
  const httpServer = http.createServer((req, res) => {
    handle(req, res);
  });

  // Cloud load balancer timeout compatibility (Cloudflare, AWS ALB, Render)
  httpServer.keepAliveTimeout = 65000;
  httpServer.headersTimeout = 66000;

  const io = new Server(httpServer, {
    cors: {
      origin: isOriginAllowed,
      methods: ["GET", "POST"],
      credentials: true,
    },
    maxHttpBufferSize: 65536, // 64 KB max packet size to prevent DoS buffer attacks
    pingInterval: 10000,
    pingTimeout: 5000,
  });

  io.on("connection", (socket) => {
    let currentRoomCode = null;
    let currentUserRole = null;
    let currentUserId = null;

    // Sliding-window message flood shield (anti-DoS per connection)
    let eventCount = 0;
    let windowStart = Date.now();
    const isRateLimited = () => {
      const now = Date.now();
      if (now - windowStart > 5000) {
        windowStart = now;
        eventCount = 1;
        return false;
      }
      eventCount++;
      return eventCount > 60; // Max 60 events per 5 seconds
    };

    socket.on("join-room", ({ sessionCode, callToken, userId, role }) => {
      if (!sessionCode || !userId) return;

      // In production, call token is mandatory
      if (process.env.NODE_ENV === "production" && !callToken) {
        socket.emit("error-message", { message: "Security error: Authorized call token is required." });
        return;
      }

      // Cryptographic room token verification
      const tokenSecret = process.env.NEXTAUTH_SECRET || "we-hear-call-token-secure-salt-key-123456";
      if (callToken) {
        try {
          const decoded = Buffer.from(callToken, "base64").toString("utf8");
          const [tCode, tUser, tRole, tExp, tSig] = decoded.split(":");
          if (Date.now() > parseInt(tExp, 10) || tCode !== sessionCode || tUser !== userId) {
            socket.emit("error-message", { message: "Security authorization error: Token mismatch or expired." });
            return;
          }
          const crypto = require("crypto");
          const payload = `${tCode}:${tUser}:${tRole}:${tExp}`;
          const expectedSig = crypto.createHmac("sha256", tokenSecret).update(payload).digest("hex");
          const expBuf = Buffer.from(expectedSig);
          const sigBuf = Buffer.from(tSig || "");
          if (expBuf.length !== sigBuf.length || !crypto.timingSafeEqual(expBuf, sigBuf)) {
            socket.emit("error-message", { message: "Security error: Tampered room token detected." });
            return;
          }
        } catch (e) {
          socket.emit("error-message", { message: "Security error: Malformed room token." });
          return;
        }
      }

      currentRoomCode = sessionCode;
      currentUserId = userId;
      currentUserRole = role || "PARTICIPANT";

      socket.join(sessionCode);

      if (!activeRooms.has(sessionCode)) {
        activeRooms.set(sessionCode, new Map());
      }
      const roomMap = activeRooms.get(sessionCode);

      // Max 2 participants rule
      if (roomMap.size >= 2 && !roomMap.has(userId)) {
        socket.emit("error-message", { message: "Call room is already full (maximum 2 participants)." });
        socket.leave(sessionCode);
        return;
      }

      roomMap.set(userId, {
        socketId: socket.id,
        userId,
        role: currentUserRole,
        joinedAt: Date.now(),
      });

      // Relay to other peer that someone joined
      socket.to(sessionCode).emit("peer-joined", {
        role: currentUserRole,
        participantCount: roomMap.size,
      });

      socket.emit("room-joined", {
        sessionCode,
        role: currentUserRole,
        participantCount: roomMap.size,
      });
    });

    // WebRTC Signaling relays with strict room membership verification & flood protection
    socket.on("offer", ({ sessionCode, sdp }) => {
      if (isRateLimited() || !currentRoomCode || currentRoomCode !== sessionCode) return;
      socket.to(sessionCode).emit("offer", { sdp, fromRole: currentUserRole });
    });

    socket.on("answer", ({ sessionCode, sdp }) => {
      if (isRateLimited() || !currentRoomCode || currentRoomCode !== sessionCode) return;
      socket.to(sessionCode).emit("answer", { sdp, fromRole: currentUserRole });
    });

    socket.on("ice-candidate", ({ sessionCode, candidate }) => {
      if (isRateLimited() || !currentRoomCode || currentRoomCode !== sessionCode) return;
      socket.to(sessionCode).emit("ice-candidate", { candidate });
    });

    socket.on("media-state", ({ sessionCode, isAudioMuted, isVideoOff }) => {
      if (isRateLimited() || !currentRoomCode || currentRoomCode !== sessionCode) return;
      socket.to(sessionCode).emit("peer-media-state", { isAudioMuted, isVideoOff });
    });

    socket.on("recording-device-alert", ({ sessionCode, deviceType }) => {
      if (isRateLimited() || !currentRoomCode || currentRoomCode !== sessionCode) return;
      socket.to(sessionCode).emit("recording-device-warning", {
        deviceType: deviceType || "cell phone",
        timestamp: Date.now(),
      });
    });

    socket.on("end-call", ({ sessionCode, endedByRole }) => {
      if (!currentRoomCode || currentRoomCode !== sessionCode) return;
      io.to(currentRoomCode).emit("call-ended", {
        endedByRole: endedByRole || currentUserRole,
        reason: "USER_ENDED",
      });
      activeRooms.delete(currentRoomCode);
    });

    socket.on("disconnect", () => {
      if (currentRoomCode && currentUserId && activeRooms.has(currentRoomCode)) {
        const roomMap = activeRooms.get(currentRoomCode);
        roomMap.delete(currentUserId);

        socket.to(currentRoomCode).emit("peer-disconnected", {
          role: currentUserRole,
          graceSeconds: 15,
        });

        if (roomMap.size === 0) {
          activeRooms.delete(currentRoomCode);
        }
      }
    });
  });

  // Garbage collection: purge stale rooms inactive for >45 minutes
  const roomCleanupInterval = setInterval(() => {
    const now = Date.now();
    const maxRoomAgeMs = 45 * 60 * 1000;
    for (const [code, participants] of activeRooms.entries()) {
      let oldestJoin = now;
      for (const p of participants.values()) {
        if (p.joinedAt && p.joinedAt < oldestJoin) oldestJoin = p.joinedAt;
      }
      if (now - oldestJoin > maxRoomAgeMs || participants.size === 0) {
        activeRooms.delete(code);
      }
    }
  }, 5 * 60 * 1000);

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });

  // Graceful shutdown handling (Render, Docker, Kubernetes, AWS)
  const shutdown = (signal) => {
    console.log(`Received ${signal}. Gracefully stopping HTTP and WebSocket server...`);
    clearInterval(roomCleanupInterval);
    io.close(() => {
      httpServer.close(() => {
        console.log("We Hear server closed cleanly.");
        process.exit(0);
      });
    });
    setTimeout(() => {
      console.error("Forcing shutdown after 10s timeout.");
      process.exit(1);
    }, 10000);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
});
