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

    const reporterUserId = session.user.id;
    const { sessionCode, reason, description } = await req.json();

    if (!sessionCode || !reason) {
      return NextResponse.json({ message: "Missing required report parameters" }, { status: 400 });
    }

    const callSession = await prisma.callSession.findUnique({
      where: { sessionCode },
    });

    if (!callSession) {
      return NextResponse.json({ message: "Session not found" }, { status: 404 });
    }

    // Determine reported user (the other participant in the session)
    const isClient = callSession.clientId === reporterUserId;
    const reportedUserId = isClient ? callSession.listenerId : callSession.clientId;

    if (!reportedUserId) {
      return NextResponse.json({ message: "No peer found to report" }, { status: 400 });
    }

    // Record report in database
    const report = await prisma.report.create({
      data: {
        reporterUserId,
        reportedUserId,
        sessionId: callSession.id,
        reason,
        description: description?.substring(0, 1000) || "",
        status: "SUBMITTED",
      },
    });

    return NextResponse.json({
      success: true,
      reportId: report.id,
      message: "Report logged securely.",
    });
  } catch (error: any) {
    console.error("Report submission error:", error);
    return NextResponse.json({ message: "Failed to submit report" }, { status: 500 });
  }
}
