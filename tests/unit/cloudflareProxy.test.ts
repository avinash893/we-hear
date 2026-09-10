import { describe, it, expect } from "vitest";
import { getCloudflareMetadata } from "@/lib/security/cloudflare";

describe("Cloudflare Edge Proxy Metadata", () => {
  it("correctly extracts CF-Connecting-IP, Ray ID, and Country", () => {
    const req = new Request("https://wehearapp.online/api/health", {
      headers: {
        "cf-connecting-ip": "203.0.113.195",
        "cf-ray": "8c41f2389a1b02-BOM",
        "cf-ipcountry": "IN",
      },
    });

    const meta = getCloudflareMetadata(req);
    expect(meta.isCloudflare).toBe(true);
    expect(meta.ip).toBe("203.0.113.195");
    expect(meta.rayId).toBe("8c41f2389a1b02-BOM");
    expect(meta.country).toBe("IN");
  });

  it("gracefully falls back when not routed through Cloudflare", () => {
    const req = new Request("http://localhost:3000/api/health", {
      headers: {
        "x-forwarded-for": "192.168.1.50, 10.0.0.1",
      },
    });

    const meta = getCloudflareMetadata(req);
    expect(meta.isCloudflare).toBe(false);
    expect(meta.ip).toBe("192.168.1.50");
    expect(meta.rayId).toBeNull();
    expect(meta.country).toBe("XX");
  });
});
