import { describe, it, expect } from "vitest";
import {
  generateAnonymousNickname,
  generateAnonymousId,
  getAvatarColor,
} from "../../src/lib/identity/nickname";

describe("Anonymous Identity System", () => {
  it("generates serene two-word nicknames", () => {
    for (let i = 0; i < 20; i++) {
      const name = generateAnonymousNickname();
      const parts = name.split(" ");
      expect(parts.length).toBe(2);
      expect(parts[0].length).toBeGreaterThan(1);
      expect(parts[1].length).toBeGreaterThan(1);
      // Nickname should not contain personal email characters or numbers
      expect(name).not.toMatch(/[@0-9]/);
    }
  });

  it("generates opaque user IDs with usr_ prefix", () => {
    const id1 = generateAnonymousId();
    const id2 = generateAnonymousId();
    expect(id1).toMatch(/^usr_[a-f0-9]{12}$/);
    expect(id2).toMatch(/^usr_[a-f0-9]{12}$/);
    expect(id1).not.toBe(id2);
  });

  it("generates deterministic and valid hex colors from seeds", () => {
    const color1 = getAvatarColor("seed-user-1");
    const color2 = getAvatarColor("seed-user-1");
    const color3 = getAvatarColor("seed-user-2");
    expect(color1).toBe(color2);
    expect(color1).toMatch(/^#[0-9A-Fa-f]{6}$/);
    expect(color3).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });
});
