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

    let activeCallSession = callSession;
    let isClient = activeCallSession.clientId === userId;
    let isListener = activeCallSession.listenerId === userId;

    if (!isClient && !isListener) {
      if (
        !activeCallSession.listenerId &&
        (activeCallSession.priceInr === 0 || activeCallSession.sessionCode.startsWith("room_demo_"))
      ) {
        // Automatically join as the peer listener in demo mode
        activeCallSession = await prisma.callSession.update({
          where: { id: activeCallSession.id },
          data: {
            listenerId: userId,
            status: "MATCHED",
            matchedAt: new Date(),
          },
          include: {
            client: { include: { anonymousProfile: true } },
            listener: { include: { anonymousProfile: true } },
          },
        });
        isListener = true;
      } else {
        return NextResponse.json({ message: "Unauthorized for this session" }, { status: 403 });
      }
    }

    // Identify peer's anonymous nickname (STRICT: NEVER EXPOSE EMAIL OR GOOGLE ID)
    const peerUser = isClient ? activeCallSession.listener : activeCallSession.client;
    const isDemo = activeCallSession.priceInr === 0 || activeCallSession.sessionCode.startsWith("room_demo_");
    const peerNickname =
      peerUser?.anonymousProfile?.nickname ||
      (isDemo ? "Demo Peer (Waiting to connect...)" : "Anonymous Peer");
    const role = isClient ? "CLIENT" : "LISTENER";

    // Issue cryptographic room token for WebRTC signaling authorization
    const callToken = generateCallToken(activeCallSession.sessionCode, userId, role);

    return NextResponse.json({
      sessionId: activeCallSession.id,
      sessionCode: activeCallSession.sessionCode,
      callToken,
      role,
      peerNickname,
      status: activeCallSession.status,
      isDemo,
      callStartedAt: activeCallSession.callStartedAt || activeCallSession.createdAt,
      durationMinutes: Number(process.env.SESSION_DURATION_MINUTES || 30),
      minListenerEarningInr: activeCallSession.minListenerEarningInr,
      maxListenerEarningInr: activeCallSession.maxListenerEarningInr,
      speakerRating: activeCallSession.speakerRating,
      isRated: Boolean(activeCallSession.speakerRating),
      isAlreadyEnded:
        activeCallSession.status === "CALL_COMPLETED" ||
        activeCallSession.status === "CALL_ENDED_BY_CLIENT" ||
        activeCallSession.status === "CALL_ENDED_BY_LISTENER" ||
        activeCallSession.status === "REFUNDED",
    });
  } catch (error: any) {
    console.error("Session info error:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
