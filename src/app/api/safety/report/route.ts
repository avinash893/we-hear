import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/db";
import { checkRateLimit } from "@/lib/security/rateLimiter";
import { sanitizeText, isValidCode } from "@/lib/security/sanitize";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const reporterUserId = session.user.id;

    // Rate limit: max 5 reports per 10 minutes
    const limit = checkRateLimit(reporterUserId, "report", 5, 10 * 60);
    if (!limit.allowed) {
      return NextResponse.json(
        { message: `Too many reports submitted. Please wait ${limit.resetSeconds}s.` },
        { status: 429 }
      );
    }

    const { sessionCode, reason, description } = await req.json();

    if (!sessionCode || !reason || !isValidCode(sessionCode)) {
      return NextResponse.json({ message: "Missing or invalid report parameters" }, { status: 400 });
    }

    const callSession = await prisma.callSession.findUnique({
      where: { sessionCode },
    });

    if (!callSession) {
      return NextResponse.json({ message: "Session not found" }, { status: 404 });
    }

    const isClient = callSession.clientId === reporterUserId;
    const isListener = callSession.listenerId === reporterUserId;

    if (!isClient && !isListener) {
      return NextResponse.json(
        { message: "Forbidden: You were not a participant in this call session." },
        { status: 403 }
      );
    }

    const reportedUserId = isClient ? callSession.listenerId : callSession.clientId;

    if (!reportedUserId) {
      return NextResponse.json({ message: "No peer found to report" }, { status: 400 });
    }

    // Record sanitized report in database
    const report = await prisma.report.create({
      data: {
        reporterUserId,
        reportedUserId,
        sessionId: callSession.id,
        reason: sanitizeText(reason, 64),
        description: sanitizeText(description, 1000),
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
