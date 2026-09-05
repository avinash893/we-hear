import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/db";
import { generateCallToken } from "@/lib/security/callToken";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(req.url);
    const sessionCode = searchParams.get("sessionCode");

    if (!sessionCode) {
      return NextResponse.json({ message: "Missing session code" }, { status: 400 });
    }

    const callSession = await prisma.callSession.findUnique({
      where: { sessionCode },
      include: {
        client: { include: { anonymousProfile: true } },
        listener: { include: { anonymousProfile: true } },
      },
    });

    if (!callSession) {
      return NextResponse.json({ message: "Session not found" }, { status: 404 });
    }

    const isClient = callSession.clientId === userId;
    const isListener = callSession.listenerId === userId;

    if (!isClient && !isListener) {
      return NextResponse.json({ message: "Unauthorized for this session" }, { status: 403 });
    }

    // Identify peer's anonymous nickname (STRICT: NEVER EXPOSE EMAIL OR GOOGLE ID)
    const peerUser = isClient ? callSession.listener : callSession.client;
    const peerNickname = peerUser?.anonymousProfile?.nickname || "Anonymous Peer";
    const role = isClient ? "CLIENT" : "LISTENER";

    // Issue cryptographic room token for WebRTC signaling authorization
    const callToken = generateCallToken(callSession.sessionCode, userId, role);

    return NextResponse.json({
      sessionId: callSession.id,
      sessionCode: callSession.sessionCode,
      callToken,
      role,
      peerNickname,
      status: callSession.status,
      callStartedAt: callSession.callStartedAt || callSession.createdAt,
      durationMinutes: Number(process.env.SESSION_DURATION_MINUTES || 30),
      isAlreadyEnded:
        callSession.status === "CALL_COMPLETED" ||
        callSession.status === "CALL_ENDED_BY_CLIENT" ||
        callSession.status === "CALL_ENDED_BY_LISTENER" ||
        callSession.status === "REFUNDED",
    });
  } catch (error: any) {
    console.error("Session info error:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
