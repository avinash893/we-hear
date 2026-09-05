import { describe, it, expect } from "vitest";

describe("Call Matching & Queue Rules", () => {
  it("prevents double-assignment of an available listener", () => {
    interface ListenerSlot {
      userId: string;
      isAvailable: boolean;
      assignedSessionId: string | null;
    }

    const listener: ListenerSlot = {
      userId: "listener_1",
      isAvailable: true,
      assignedSessionId: null,
    };

    function assignClient(sessionId: string) {
      if (!listener.isAvailable || listener.assignedSessionId !== null) {
        return false;
      }
      listener.isAvailable = false;
      listener.assignedSessionId = sessionId;
      return true;
    }

    // Client A requests match
    const matchA = assignClient("session_client_A");
    expect(matchA).toBe(true);
    expect(listener.assignedSessionId).toBe("session_client_A");

    // Client B simultaneously requests match
    const matchB = assignClient("session_client_B");
    expect(matchB).toBe(false);
    expect(listener.assignedSessionId).toBe("session_client_A"); // Still assigned only to A
  });

  it("filters out blocked users from matchmaking", () => {
    const clientId = "client_alpha";
    const availableListeners = [
      { id: "listener_blocked_1", name: "Quiet Sparrow" },
      { id: "listener_eligible_2", name: "Soft Cloud" },
    ];

    const blockList = new Set<string>(["listener_blocked_1"]);

    const eligible = availableListeners.filter((l) => !blockList.has(l.id));
    expect(eligible.length).toBe(1);
    expect(eligible[0].id).toBe("listener_eligible_2");
    expect(eligible[0].name).toBe("Soft Cloud");
  });

  it("identifies expired sessions after 24 hours for auto-refund", () => {
    const now = Date.now();
    const twentyFiveHoursAgo = new Date(now - 25 * 60 * 60 * 1000);
    const tenHoursAgo = new Date(now - 10 * 60 * 60 * 1000);

    const sessions = [
      { id: "sess_expired", startedAt: twentyFiveHoursAgo, status: "WAITING_FOR_LISTENER" },
      { id: "sess_active", startedAt: tenHoursAgo, status: "WAITING_FOR_LISTENER" },
    ];

    const expirationThreshold = new Date(now - 24 * 60 * 60 * 1000);

    const needsRefund = sessions.filter(
      (s) => s.status === "WAITING_FOR_LISTENER" && s.startedAt <= expirationThreshold
    );

    expect(needsRefund.length).toBe(1);
    expect(needsRefund[0].id).toBe("sess_expired");
  });
});
