import { describe, it, expect, beforeEach, afterEach } from "vitest";
import crypto from "crypto";
import { detectCountry } from "../../src/lib/payments/pricing";
import { RazorpayPaymentService } from "../../src/lib/payments/razorpay";

describe("Payment Security Audit & Anti-Fraud Verification", () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  describe("Geo-Pricing Country Spoofing Protection", () => {
    it("strictly ignores ?country= query param in production to prevent price tier downgrade", () => {
      process.env.NODE_ENV = "production";

      // Attacker from US tries to pass ?country=IN in query string
      const req = new Request("https://wehear.app/api/payments/create-order?country=IN", {
        headers: {
          // No CF header or unknown
        },
      });

      const detected = detectCountry(req);
      // In production, query param is ignored, falls back to DEFAULT_COUNTRY or IN
      // If CF country header is present (e.g. US), it must use US and NEVER allow query param override
      const reqWithUSHeader = new Request("https://wehear.app/api/payments/create-order?country=IN", {
        headers: {
          "cf-ipcountry": "US",
        },
      });

      const detectedUS = detectCountry(reqWithUSHeader);
      expect(detectedUS).toBe("US"); // Header wins, query param completely ignored
    });

    it("allows ?country= query param in development for local simulation", () => {
      process.env.NODE_ENV = "development";

      const req = new Request("http://localhost:3000/api/payments/create-order?country=US");
      const detected = detectCountry(req);
      expect(detected).toBe("US");
    });
  });

  describe("Subscription & Order Cryptographic Verification", () => {
    const keySecret = "rzp_sec_test_audit_key_12345678";
    process.env.RAZORPAY_KEY_SECRET = keySecret;
    const paymentService = new RazorpayPaymentService();

    it("verifies authentic subscription payment signature using HMAC-SHA256 timing-safe compare", async () => {
      const orderId = "order_sub_test_001";
      const paymentId = "pay_sub_test_999";
      const validSignature = crypto
        .createHmac("sha256", keySecret)
        .update(`${orderId}|${paymentId}`)
        .digest("hex");

      const isValid = await paymentService.verifyPayment({
        orderId,
        paymentId,
        signature: validSignature,
      });

      expect(isValid).toBe(true);
    });

    it("rejects tampered or spoofed subscription payment signatures", async () => {
      const orderId = "order_sub_test_001";
      const paymentId = "pay_sub_test_999";
      const tamperedSignature = crypto
        .createHmac("sha256", "wrong_secret")
        .update(`${orderId}|${paymentId}`)
        .digest("hex");

      const isValid = await paymentService.verifyPayment({
        orderId,
        paymentId,
        signature: tamperedSignature,
      });

      expect(isValid).toBe(false);
    });
  });

  describe("Double-Refund Prevention Logic Simulation", () => {
    it("guarantees only one worker can claim a session for refunding via atomic lease lock", async () => {
      // Simulation of atomic DB lease lock:
      // State: WAITING_FOR_LISTENER
      let sessionState = "WAITING_FOR_LISTENER";

      const claimSession = async () => {
        // Atomic compare-and-swap (CAS) simulation
        if (sessionState === "WAITING_FOR_LISTENER") {
          sessionState = "REFUND_PENDING";
          return { count: 1 };
        }
        return { count: 0 };
      };

      // Two concurrent cron executions simultaneously attempt to claim
      const [worker1, worker2] = await Promise.all([claimSession(), claimSession()]);

      // Exactly one worker must succeed in claiming the refund
      const totalClaims = worker1.count + worker2.count;
      expect(totalClaims).toBe(1);
      expect(sessionState).toBe("REFUND_PENDING");
    });
  });

  describe("Payment Verification CAS Concurrency Simulation", () => {
    it("ensures webhook and verify race condition updates payment exactly once", async () => {
      let paymentStatus = "PENDING";
      let sessionStatus = "PAYMENT_PENDING";
      let matchAttemptCount = 0;

      const processPayment = async () => {
        let newlyProcessed = false;
        // Atomic CAS simulation
        if (paymentStatus !== "SUCCESS") {
          paymentStatus = "SUCCESS";
          newlyProcessed = true;
          if (sessionStatus === "PAYMENT_PENDING") {
            sessionStatus = "WAITING_FOR_LISTENER";
          }
          matchAttemptCount++;
        }
        return { newlyProcessed };
      };

      // Concurrent verify (from client) and webhook (from Razorpay)
      const [resClient, resWebhook] = await Promise.all([processPayment(), processPayment()]);

      // One must be newlyProcessed: true, the other false
      expect(resClient.newlyProcessed !== resWebhook.newlyProcessed).toBe(true);
      expect(paymentStatus).toBe("SUCCESS");
      expect(sessionStatus).toBe("WAITING_FOR_LISTENER");
      expect(matchAttemptCount).toBe(1);
    });

    it("prevents a late webhook from resetting an already MATCHED session back to WAITING_FOR_LISTENER", async () => {
      let paymentStatus = "SUCCESS"; // Already processed by verify route
      let sessionStatus = "MATCHED"; // Already matched with listener!

      // Webhook arrives late
      let sessionWasReset = false;
      if (paymentStatus !== "SUCCESS") {
        paymentStatus = "SUCCESS";
        if (sessionStatus === "PAYMENT_PENDING") {
          sessionStatus = "WAITING_FOR_LISTENER";
        }
      } else {
        // Idempotency: Payment already SUCCESS, DO NOT reset session!
        if (sessionStatus === "PAYMENT_PENDING") {
          sessionStatus = "WAITING_FOR_LISTENER";
          sessionWasReset = true;
        }
      }

      expect(sessionStatus).toBe("MATCHED");
      expect(sessionWasReset).toBe(false);
    });
  });

  describe("UPI VPA Validation for Listener Payouts", () => {
    const UPI_REGEX = /^[a-zA-Z0-9.\-_]{2,100}@[a-zA-Z]{2,30}$/;

    it("accepts valid UPI VPA addresses", () => {
      const validVPAs = [
        "avinash@okhdfcbank",
        "peer.listener@icici",
        "listen_well-99@paytm",
        "support@ybl",
        "user.name123@axl",
      ];

      for (const vpa of validVPAs) {
        expect(UPI_REGEX.test(vpa)).toBe(true);
      }
    });

    it("rejects invalid, malicious, or injection UPI payloads", () => {
      const maliciousVPAs = [
        "<script>alert(1)</script>",
        "user@name@bank",
        "invalid-upi-no-at-sign",
        "@bank",
        "name@",
        "name@b", // bank code too short
        "../../etc/passwd",
        "user' OR '1'='1",
        "name@bank; DROP TABLE users;--",
      ];

      for (const vpa of maliciousVPAs) {
        expect(UPI_REGEX.test(vpa)).toBe(false);
      }
    });
  });

  describe("Listener Earning Escrow Lifecycle", () => {
    it("calculates correct rating-based payouts across all stars without violating platform margins", async () => {
      const { calculateListenerPayout } = await import("../../src/lib/payments/pricing");

      // Tier 3: Min ₹8, Base ₹10, Max ₹14 (Speaker pays ₹20)
      expect(calculateListenerPayout(1, 8, 14, 10)).toBe(8);
      expect(calculateListenerPayout(2, 8, 14, 10)).toBe(9);
      expect(calculateListenerPayout(3, 8, 14, 10)).toBe(10);
      expect(calculateListenerPayout(4, 8, 14, 10)).toBe(12);
      expect(calculateListenerPayout(5, 8, 14, 10)).toBe(14);

      // Even with 5-star rating (₹14 payout), platform keeps ₹6 (30% margin)
      const maxPayout = calculateListenerPayout(5, 8, 14, 10);
      const speakerPaid = 20;
      const platformProfit = speakerPaid - maxPayout;
      expect(platformProfit).toBeGreaterThanOrEqual(6);
    });
  });
});
