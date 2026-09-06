import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/db";

import { checkRateLimit } from "@/lib/security/rateLimiter";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const blockerUserId = session.user.id;

    // Rate limit: max 10 block actions per minute
    const limit = checkRateLimit(blockerUserId, "block", 10, 60);
    if (!limit.allowed) {
      return NextResponse.json(
        { message: `Too many block actions. Please wait ${limit.resetSeconds}s.` },
        { status: 429 }
      );
    }

    const { sessionCode } = await req.json();

    if (!sessionCode) {
      return NextResponse.json({ message: "Missing session code" }, { status: 400 });
    }

    const callSession = await prisma.callSession.findUnique({
      where: { sessionCode },
    });

    if (!callSession) {
      return NextResponse.json({ message: "Session not found" }, { status: 404 });
    }

    const isClient = callSession.clientId === blockerUserId;
    const isListener = callSession.listenerId === blockerUserId;

    if (!isClient && !isListener) {
      return NextResponse.json(
        { message: "Forbidden: You were not a participant in this call session." },
        { status: 403 }
      );
    }

    const blockedUserId = isClient ? callSession.listenerId : callSession.clientId;

    if (!blockedUserId) {
      return NextResponse.json({ message: "No peer found to block" }, { status: 400 });
    }

    // Upsert block to avoid duplicates
    await prisma.block.upsert({
      where: {
        blockerUserId_blockedUserId: {
          blockerUserId,
          blockedUserId,
        },
      },
      update: {},
      create: {
        blockerUserId,
        blockedUserId,
      },
    });

    return NextResponse.json({ success: true, message: "User blocked from future matching." });
  } catch (error: any) {
    console.error("Block user error:", error);
    return NextResponse.json({ message: "Failed to block user" }, { status: 500 });
  }
}
