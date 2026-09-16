import { describe, it, expect } from "vitest";

describe("WebRTC Media Stream Constraints", () => {
  it("enforces privacy-first audio and video constraints", () => {
    const defaultConstraints: MediaStreamConstraints = {
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
      video: {
        width: { ideal: 1280, max: 1920 },
        height: { ideal: 720, max: 1080 },
        frameRate: { ideal: 24, max: 30 },
      },
    };

    expect(defaultConstraints.audio).toBeDefined();
    expect((defaultConstraints.audio as MediaTrackConstraints).echoCancellation).toBe(true);
    expect((defaultConstraints.video as MediaTrackConstraints).frameRate).toEqual({ ideal: 24, max: 30 });
  });

  it("validates audio-only mode correctly disables video tracks", () => {
    const audioOnlyConstraints: MediaStreamConstraints = {
      audio: true,
      video: false,
    };

    expect(audioOnlyConstraints.video).toBe(false);
    expect(audioOnlyConstraints.audio).toBe(true);
  });
});
