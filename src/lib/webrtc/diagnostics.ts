export interface QualityReport {
  status: "excellent" | "good" | "poor" | "critical";
  rttMs: number;
  fractionLost: number;
  jitterSec: number;
}

/**
 * Evaluates WebRTC connection stats into a human-readable quality metric
 */
export function evaluateConnectionQuality(
  rttMs: number,
  fractionLost: number,
  jitterSec: number
): QualityReport {
  if (rttMs > 400 || fractionLost > 0.15) {
    return { status: "critical", rttMs, fractionLost, jitterSec };
  }
  if (rttMs > 200 || fractionLost > 0.05) {
    return { status: "poor", rttMs, fractionLost, jitterSec };
  }
  if (rttMs > 100 || fractionLost > 0.02) {
    return { status: "good", rttMs, fractionLost, jitterSec };
  }
  return { status: "excellent", rttMs, fractionLost, jitterSec };
}
