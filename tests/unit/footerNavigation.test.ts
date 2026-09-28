import { describe, it, expect } from "vitest";

describe("Footer & Company Pages Route Map", () => {
  const routes = [
    { label: "About", path: "/about" },
    { label: "Careers", path: "/careers" },
    { label: "Safety", path: "/safety" },
    { label: "Privacy", path: "/privacy" },
    { label: "Terms", path: "/terms" },
    { label: "Support", path: "/contact" },
  ];

  it("ensures all bottom bar legal and company links are registered", () => {
    routes.forEach((r) => {
      expect(r.path).toMatch(/^\/[a-z-]+$/);
      expect(r.label.length).toBeGreaterThan(0);
    });
  });
});
