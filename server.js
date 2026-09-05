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

app.prepare().then(() => {
  const httpServer = http.createServer((req, res) => {
    handle(req, res);
  });

  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
    pingInterval: 10000,
    pingTimeout: 5000,
  });

  io.on("connection", (socket) => {
    let currentRoomCode = null;
    let currentUserRole = null;
    let currentUserId = null;

    socket.on("join-room", ({ sessionCode, userId, role }) => {
      if (!sessionCode || !userId) return;

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

    // WebRTC Signaling relays
    socket.on("offer", ({ sessionCode, sdp }) => {
      socket.to(sessionCode).emit("offer", { sdp, fromRole: currentUserRole });
    });

    socket.on("answer", ({ sessionCode, sdp }) => {
      socket.to(sessionCode).emit("answer", { sdp, fromRole: currentUserRole });
    });

    socket.on("ice-candidate", ({ sessionCode, candidate }) => {
      socket.to(sessionCode).emit("ice-candidate", { candidate });
    });

    socket.on("media-state", ({ sessionCode, isAudioMuted, isVideoOff }) => {
      socket.to(sessionCode).emit("peer-media-state", { isAudioMuted, isVideoOff });
    });

    socket.on("end-call", ({ sessionCode, endedByRole }) => {
      if (currentRoomCode) {
        io.to(currentRoomCode).emit("call-ended", {
          endedByRole: endedByRole || currentUserRole,
          reason: "USER_ENDED",
        });
        activeRooms.delete(currentRoomCode);
      }
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

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
