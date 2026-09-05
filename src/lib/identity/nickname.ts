import crypto from "crypto";

const ADJECTIVES = [
  "Quiet",
  "Blue",
  "Kind",
  "Soft",
  "Calm",
  "Amber",
  "Gentle",
  "Warm",
  "Silver",
  "Golden",
  "Peaceful",
  "Serene",
  "Patient",
  "Humble",
  "Tranquil",
  "Mellow",
  "Green",
  "Starlit",
  "Morning",
  "Evening",
  "Cedar",
  "Mossy",
  "Breezy",
  "Still",
];

const NOUNS = [
  "Sparrow",
  "Leaf",
  "Fox",
  "Cloud",
  "River",
  "Brook",
  "Meadow",
  "Pebble",
  "Pine",
  "Willow",
  "Owl",
  "Breeze",
  "Fawn",
  "Robin",
  "Clover",
  "Grove",
  "Haven",
  "Valley",
  "Harbor",
  "Horizon",
  "Petal",
  "Stream",
  "Dune",
  "Birch",
];

const AVATAR_PALETTES = [
  "#2D5A46", // Forest
  "#4A7C59", // Sage
  "#3A6073", // Slate Blue
  "#726A95", // Lavender Slate
  "#B38C67", // Warm Sand
  "#8C5E58", // Muted Rust
  "#437C90", // Teal
  "#5C7B6B", // Moss
];

/**
 * Generates a calm, serene anonymous nickname
 */
export function generateAnonymousNickname(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  return `${adj} ${noun}`;
}

/**
 * Generates an opaque anonymous ID (e.g. usr_8f32a7b1...)
 */
export function generateAnonymousId(): string {
  const randomHex = crypto.randomBytes(6).toString("hex");
  return `usr_${randomHex}`;
}

/**
 * Picks a deterministic or random calm palette color for anonymous avatars
 */
export function getAvatarColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_PALETTES.length;
  return AVATAR_PALETTES[index];
}
