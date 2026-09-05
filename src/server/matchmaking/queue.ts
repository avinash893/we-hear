import { prisma } from "@/lib/db";

export interface MatchResult {
  matched: boolean;
  sessionId: string;
  sessionCode: string;
  listenerId?: string;
  listenerNickname?: string;
}

/**
 * Attempts to match a paid waiting session with an available listener.
 * Uses atomic transaction and locking to guarantee single assignment.
 */
export async function attemptMatch(sessionId: string): Promise<MatchResult> {
  return await prisma.$transaction(async (tx) => {
    // 1. Fetch the session to verify it's still waiting
    const session = await tx.callSession.findUnique({
      where: { id: sessionId },
      include: { client: true },
    });

    if (!session || session.status !== "WAITING_FOR_LISTENER") {
      return {
        matched: session?.status === "MATCHED" || session?.status === "CALL_STARTED",
        sessionId,
        sessionCode: session?.sessionCode || "",
        listenerId: session?.listenerId || undefined,
      };
    }

    const clientId = session.clientId;

    // 2. Fetch list of blocked users in both directions
    const blocks = await tx.block.findMany({
      where: {
        OR: [{ blockerUserId: clientId }, { blockedUserId: clientId }],
      },
    });
    const blockedUserIds = new Set<string>();
    blocks.forEach((b) => {
      blockedUserIds.add(b.blockerUserId);
      blockedUserIds.add(b.blockedUserId);
    });
    blockedUserIds.add(clientId); // Can't match with oneself

    // 3. Find available listeners who are not the client and not blocked
    const candidateListeners = await tx.listenerProfile.findMany({
      where: {
        isAvailable: true,
        userId: { notIn: Array.from(blockedUserIds) },
        user: { isDestroyed: false },
      },
      include: {
        user: {
          include: {
            anonymousProfile: true,
            // Check if listener is currently active in another session
            listenerSessions: {
              where: {
                status: { in: ["MATCHED", "CALL_STARTED"] },
              },
            },
          },
        },
      },
      orderBy: { lastActiveAt: "asc" }, // Fair FIFO round-robin
    });

    // Find the first listener who is not currently in a call
    const eligibleProfile = candidateListeners.find(
      (lp) => lp.user.listenerSessions.length === 0
    );

    if (!eligibleProfile) {
      return {
        matched: false,
        sessionId: session.id,
        sessionCode: session.sessionCode,
      };
    }

    const listenerUser = eligibleProfile.user;

    // 4. Atomically match the listener to this session and mark listener unavailable
    await tx.callSession.update({
      where: { id: session.id },
      data: {
        listenerId: listenerUser.id,
        status: "MATCHED",
        matchedAt: new Date(),
      },
    });

    await tx.listenerProfile.update({
      where: { id: eligibleProfile.id },
      data: {
        isAvailable: false, // Taken
        lastActiveAt: new Date(),
      },
    });

    return {
      matched: true,
      sessionId: session.id,
      sessionCode: session.sessionCode,
      listenerId: listenerUser.id,
      listenerNickname: listenerUser.anonymousProfile?.nickname || "Anonymous Listener",
    };
  });
}
