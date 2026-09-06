import { describe, it, expect } from "vitest";
import { getRegionalPricing, calculateListenerPayout } from "../../src/lib/payments/pricing";

describe("Dynamic Experience-Based Listener Payout Suite", () => {
  describe("Regional Tier Min/Max Payout Configurations", () => {
    it("configures domestic Tier 3 (India & SE Asia) with ₹8 min and ₹14 max payout", () => {
      const pricing = getRegionalPricing("IN");
      expect(pricing.speakerPrice).toBe(20.0);
      expect(pricing.listenerEarning).toBe(10.0);
      expect(pricing.minListenerEarning).toBe(8.0);
      expect(pricing.maxListenerEarning).toBe(14.0);

      // Platform retains at least ₹6 (30% margin) even on maximum 5-star performance pay
      const minPlatformRetained = pricing.speakerPrice - pricing.maxListenerEarning;
      expect(minPlatformRetained).toBe(6.0);
    });

    it("configures Tier 1 (US/EU/UK/CA/AU) with $0.35 min and $0.65 max payout", () => {
      const pricing = getRegionalPricing("US");
      expect(pricing.speakerPrice).toBe(0.99);
      expect(pricing.listenerEarning).toBe(0.50);
      expect(pricing.minListenerEarning).toBe(0.35);
      expect(pricing.maxListenerEarning).toBe(0.65);

      // Platform retains at least $0.34 (34% margin) even on maximum 5-star payout
      const minPlatformRetained = pricing.speakerPrice - pricing.maxListenerEarning;
      expect(minPlatformRetained).toBeCloseTo(0.34, 2);
    });

    it("configures Tier 2 (Rest of World) with $0.18 min and $0.35 max payout", () => {
      const pricing = getRegionalPricing("BR"); // Brazil (Tier 2)
      expect(pricing.speakerPrice).toBe(0.50);
      expect(pricing.listenerEarning).toBe(0.25);
      expect(pricing.minListenerEarning).toBe(0.18);
      expect(pricing.maxListenerEarning).toBe(0.35);

      // Platform retains at least $0.15 (30% margin)
      const minPlatformRetained = pricing.speakerPrice - pricing.maxListenerEarning;
      expect(minPlatformRetained).toBeGreaterThanOrEqual(0.15);
    });
  });

  describe("Speaker Rating Payout Calculation", () => {
    const minINR = 8;
    const maxINR = 14;
    const baseINR = 10;

    it("awards minimum payout for 1-star ratings (distracted or absent)", () => {
      const payout = calculateListenerPayout(1, minINR, maxINR, baseINR);
      expect(payout).toBe(8);
    });

    it("awards below-average payout for 2-star ratings", () => {
      const payout = calculateListenerPayout(2, minINR, maxINR, baseINR);
      expect(payout).toBe(9);
    });

    it("awards standard base payout for 3-star ratings (good active listening)", () => {
      const payout = calculateListenerPayout(3, minINR, maxINR, baseINR);
      expect(payout).toBe(10);
    });

    it("awards high payout for 4-star ratings (warm and empathetic)", () => {
      const payout = calculateListenerPayout(4, minINR, maxINR, baseINR);
      expect(payout).toBe(12);
    });

    it("awards maximum payout for 5-star ratings (exceptional and genuine presence)", () => {
      const payout = calculateListenerPayout(5, minINR, maxINR, baseINR);
      expect(payout).toBe(14);
    });

    it("clamps out-of-range ratings safely between 1 and 5", () => {
      expect(calculateListenerPayout(0, minINR, maxINR, baseINR)).toBe(8);
      expect(calculateListenerPayout(-5, minINR, maxINR, baseINR)).toBe(8);
      expect(calculateListenerPayout(10, minINR, maxINR, baseINR)).toBe(14);
      expect(calculateListenerPayout(4.2, minINR, maxINR, baseINR)).toBe(12);
    });

    it("calculates USD payouts correctly with precision", () => {
      const minUSD = 0.35;
      const maxUSD = 0.65;
      const baseUSD = 0.50;

      expect(calculateListenerPayout(1, minUSD, maxUSD, baseUSD)).toBe(0.35);
      expect(calculateListenerPayout(2, minUSD, maxUSD, baseUSD)).toBe(0.43);
      expect(calculateListenerPayout(3, minUSD, maxUSD, baseUSD)).toBe(0.50);
      expect(calculateListenerPayout(4, minUSD, maxUSD, baseUSD)).toBe(0.58);
      expect(calculateListenerPayout(5, minUSD, maxUSD, baseUSD)).toBe(0.65);
    });
  });
});
