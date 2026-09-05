import { Server as SocketIOServer, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import { prisma } from "../lib/db";

interface RoomParticipant {
  socketId: string;
  userId: string;
  role: "CLIENT" | "LISTENER";
  joinedAt: Date;
  lastHeartbeat: Date;
}

// Memory map of active signaling rooms: sessionCode -> Set of participants
const activeRooms = new Map<string, Map<string, RoomParticipant>>();

export function setupSignaling(httpServer: HttpServer): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
    pingInterval: 10000,
    pingTimeout: 5000,
  });

  io.on("connection", (socket: Socket) => {
    let currentRoomCode: string | null = null;
    let currentUserRole: ("CLIENT" | "LISTENER") | null = null;
    let currentUserId: string | null = null;

    socket.on("join-room", async (data: { sessionCode: string; userId: string }) => {
      try {
        const { sessionCode, userId } = data;
        if (!sessionCode || !userId) return;

        // Authorize participant against database
        const session = await prisma.callSession.findUnique({
          where: { sessionCode },
          include: {
            client: { include: { anonymousProfile: true } },
            listener: { include: { anonymousProfile: true } },
          },
        });

        if (!session) {
          socket.emit("error-message", { message: "Call session not found." });
          return;
        }

        const isClient = session.clientId === userId;
        const isListener = session.listenerId === userId;

        if (!isClient && !isListener) {
          socket.emit("error-message", { message: "Unauthorized for this room." });
          return;
        }

        currentRoomCode = sessionCode;
        currentUserId = userId;
        currentUserRole = isClient ? "CLIENT" : "LISTENER";

        socket.join(sessionCode);

        // Track room participants
        if (!activeRooms.has(sessionCode)) {
          activeRooms.set(sessionCode, new Map());
        }
        const roomMap = activeRooms.get(sessionCode)!;

        // Room capacity check: only 2 participants allowed
        if (roomMap.size >= 2 && !roomMap.has(userId)) {
          socket.emit("error-message", { message: "Room is full." });
          socket.leave(sessionCode);
          return;
        }

        roomMap.set(userId, {
          socketId: socket.id,
          userId,
          role: currentUserRole,
          joinedAt: new Date(),
          lastHeartbeat: new Date(),
        });

        // If session hasn't started yet, mark CALL_STARTED
        if (session.status === "MATCHED" && roomMap.size === 2) {
          await prisma.callSession.update({
            where: { id: session.id },
            data: {
              status: "CALL_STARTED",
              callStartedAt: new Date(),
            },
          });
        }

        // Notify other peer in room
        socket.to(sessionCode).emit("peer-joined", {
          role: currentUserRole,
          participantCount: roomMap.size,
        });

        socket.emit("room-joined", {
          sessionCode,
          role: currentUserRole,
          participantCount: roomMap.size,
          callStartedAt: session.callStartedAt || new Date(),
          durationMinutes: Number(process.env.SESSION_DURATION_MINUTES || 30),
        });
      } catch (err) {
        console.error("join-room error:", err);
      }
    });

    // WebRTC Signaling relays
    socket.on("offer", (data: { sessionCode: string; sdp: RTCSessionDescriptionInit }) => {
      socket.to(data.sessionCode).emit("offer", { sdp: data.sdp, fromRole: currentUserRole });
    });

    socket.on("answer", (data: { sessionCode: string; sdp: RTCSessionDescriptionInit }) => {
      socket.to(data.sessionCode).emit("answer", { sdp: data.sdp, fromRole: currentUserRole });
    });

    socket.on("ice-candidate", (data: { sessionCode: string; candidate: RTCIceCandidateInit }) => {
      socket.to(data.sessionCode).emit("ice-candidate", { candidate: data.candidate });
    });

    socket.on("media-state", (data: { sessionCode: string; isAudioMuted: boolean; isVideoOff: boolean }) => {
      socket.to(data.sessionCode).emit("peer-media-state", data);
    });

    socket.on("heartbeat", (data: { sessionCode: string }) => {
      if (currentRoomCode && currentUserId && activeRooms.has(currentRoomCode)) {
        const participant = activeRooms.get(currentRoomCode)?.get(currentUserId);
        if (participant) {
          participant.lastHeartbeat = new Date();
        }
      }
    });

    socket.on("end-call", (data: { sessionCode: string }) => {
      if (currentRoomCode) {
        io.to(currentRoomCode).emit("call-ended", {
          endedByRole: currentUserRole,
          reason: "USER_ENDED",
        });
        activeRooms.delete(currentRoomCode);
      }
    });

    socket.on("disconnect", () => {
      if (currentRoomCode && currentUserId && activeRooms.has(currentRoomCode)) {
        const roomMap = activeRooms.get(currentRoomCode)!;
        roomMap.delete(currentUserId);

        // Notify remaining peer of disconnection with 15s reconnect window
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

  return io;
}
