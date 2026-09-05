import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    if (!body.confirm) {
      return NextResponse.json({ message: "Explicit confirmation required" }, { status: 400 });
    }

    const userId = session.user.id;

    // Execute atomic destruction of user platform profile & availability
    await prisma.$transaction(async (tx) => {
      // 1. Terminate any active sessions where user is client or listener
      await tx.callSession.updateMany({
        where: {
          OR: [{ clientId: userId }, { listenerId: userId }],
          status: { in: ["WAITING_FOR_LISTENER", "MATCHED", "CALL_STARTED"] },
        },
        data: {
          status: "CALL_COMPLETED",
          callEndedBy: "IDENTITY_DESTROYED",
          callEndedAt: new Date(),
        },
      });

      // 2. Clear listener availability
      await tx.listenerProfile.updateMany({
        where: { userId },
        data: {
          isAvailable: false,
        },
      });

      // 3. Delete anonymous profile data
      await tx.anonymousProfile.deleteMany({
        where: { userId },
      });

      // 4. Mark user as destroyed and scrub personally identifiable OAuth tokens
      await tx.user.update({
        where: { id: userId },
        data: {
          isDestroyed: true,
          destroyedAt: new Date(),
          googleId: null,
          email: `purged_${userId.substring(0, 8)}@wehear.scrubbed`,
        },
      });

      // 5. Audit log for compliance & fraud prevention
      await tx.auditLog.create({
        data: {
          userId,
          action: "IDENTITY_DESTROYED",
          metadata: JSON.stringify({ timestamp: new Date().toISOString() }),
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Identity permanently destroyed and active sessions revoked.",
    });
  } catch (error: any) {
    console.error("Failed to destroy identity:", error);
    return NextResponse.json(
      { message: "Server error occurred during identity destruction." },
      { status: 500 }
    );
  }
}
