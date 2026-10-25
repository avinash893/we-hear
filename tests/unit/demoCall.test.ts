import { describe, it, expect } from "vitest";

describe("Demo Free Call Mode Tests", () => {
  it("generates unique room_demo session codes with zero price", () => {
    function createDemoSessionData(clientId: string) {
      const randomCode = Math.random().toString(36).substring(2, 10);
      return {
        sessionCode: `room_demo_${randomCode}`,
        clientId,
        status: "WAITING_FOR_LISTENER",
        priceInr: 0,
        listenerEarningInr: 0,
      };
    }

    const demo = createDemoSessionData("user_demo_123");
    expect(demo.sessionCode).toMatch(/^room_demo_[a-z0-9]+$/);
    expect(demo.priceInr).toBe(0);
    expect(demo.listenerEarningInr).toBe(0);
    expect(demo.status).toBe("WAITING_FOR_LISTENER");
  });

  it("permits peer auto-joining in free demo calls", () => {
    interface MockSession {
      clientId: string;
      listenerId: string | null;
      priceInr: number;
      sessionCode: string;
      status: string;
    }

    function evaluateAccess(session: MockSession, visitingUserId: string) {
      const isClient = session.clientId === visitingUserId;
      const isListener = session.listenerId === visitingUserId;

      if (!isClient && !isListener) {
        if (!session.listenerId && (session.priceInr === 0 || session.sessionCode.startsWith("room_demo_"))) {
          return { allowed: true, role: "LISTENER", autoAssigned: true };
        }
        return { allowed: false, role: null, autoAssigned: false };
      }

      return { allowed: true, role: isClient ? "CLIENT" : "LISTENER", autoAssigned: false };
    }

    const hostUserId = "host_111";
    const guestUserId = "guest_222";
    const demoSession: MockSession = {
      clientId: hostUserId,
      listenerId: null,
      priceInr: 0,
      sessionCode: "room_demo_abc123",
      status: "WAITING_FOR_LISTENER",
    };

    // Host visits room
    const hostAccess = evaluateAccess(demoSession, hostUserId);
    expect(hostAccess.allowed).toBe(true);
    expect(hostAccess.role).toBe("CLIENT");

    // Peer visits link
    const peerAccess = evaluateAccess(demoSession, guestUserId);
    expect(peerAccess.allowed).toBe(true);
    expect(peerAccess.role).toBe("LISTENER");
    expect(peerAccess.autoAssigned).toBe(true);

    // Paid session with no listener should not allow random unauthenticated guest
    const paidSession: MockSession = {
      clientId: hostUserId,
      listenerId: null,
      priceInr: 20,
      sessionCode: "room_paid_999",
      status: "WAITING_FOR_LISTENER",
    };
    const unauthorizedAccess = evaluateAccess(paidSession, guestUserId);
    expect(unauthorizedAccess.allowed).toBe(false);
  });
});
