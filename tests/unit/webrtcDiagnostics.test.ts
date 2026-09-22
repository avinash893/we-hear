import { describe, it, expect } from "vitest";
import { evaluateConnectionQuality } from "@/lib/webrtc/diagnostics";

describe("WebRTC Connection Diagnostics", () => {
  it("rates optimal latency and loss as excellent", () => {
    const report = evaluateConnectionQuality(45, 0.005, 0.002);
    expect(report.status).toBe("excellent");
  });

  it("identifies high latency or packet drop as critical", () => {
    const report = evaluateConnectionQuality(450, 0.20, 0.05);
    expect(report.status).toBe("critical");
  });
});
