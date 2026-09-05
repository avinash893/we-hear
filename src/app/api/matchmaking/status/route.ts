import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/db";
import { attemptMatch } from "@/server/matchmaking/queue";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");

    if (sessionId) {
      // Check status of specific session for client
      let callSession = await prisma.callSession.findUnique({
        where: { id: sessionId },
        include: {
          listener: {
            include: { anonymousProfile: true },
          },
        },
      });

      if (!callSession) {
        return NextResponse.json({ message: "Session not found" }, { status: 404 });
      }

      // If still waiting, try matching again now
      if (callSession.status === "WAITING_FOR_LISTENER") {
        const matchResult = await attemptMatch(sessionId);
        if (matchResult.matched) {
          callSession = await prisma.callSession.findUnique({
            where: { id: sessionId },
            include: {
              listener: {
                include: { anonymousProfile: true },
              },
            },
          });
        }
      }

      return NextResponse.json({
        sessionId: callSession?.id,
        sessionCode: callSession?.sessionCode,
        status: callSession?.status,
        matched: callSession?.status === "MATCHED" || callSession?.status === "CALL_STARTED",
        listenerNickname: callSession?.listener?.anonymousProfile?.nickname || null,
      });
    }

    // If no sessionId provided, check if the current user (as a listener) has an incoming matched session
    const incomingSession = await prisma.callSession.findFirst({
      where: {
        listenerId: session.user.id,
        status: { in: ["MATCHED", "CALL_STARTED"] },
      },
      include: {
        client: {
          include: { anonymousProfile: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      hasIncomingMatch: Boolean(incomingSession),
      sessionCode: incomingSession?.sessionCode || null,
      sessionId: incomingSession?.id || null,
      status: incomingSession?.status || null,
    });
  } catch (error: any) {
    console.error("Matchmaking status error:", error);
    return NextResponse.json({ message: "Error checking status" }, { status: 500 });
  }
}
