"use client";

import { useEffect, useState, useCallback } from "react";

export interface PrivacyShieldState {
  isShieldActive: boolean;
  shieldReason: string | null;
  captureAttemptsCount: number;
}

export function usePrivacyShield() {
  const [shieldState, setShieldState] = useState<PrivacyShieldState>({
    isShieldActive: false,
    shieldReason: null,
    captureAttemptsCount: 0,
  });

  const triggerShield = useCallback((reason: string, autoRestoreMs = 2500) => {
    setShieldState((prev) => ({
      isShieldActive: true,
      shieldReason: reason,
      captureAttemptsCount: prev.captureAttemptsCount + 1,
    }));

    if (autoRestoreMs > 0) {
      setTimeout(() => {
        setShieldState((prev) => ({
          ...prev,
          isShieldActive: false,
          shieldReason: null,
        }));
      }, autoRestoreMs);
    }
  }, []);

  useEffect(() => {
    // 1. Detect Window Blur & Focus (Snipping tool, OS overlay, Alt-Tab)
    const handleBlur = () => {
      setShieldState((prev) => ({
        ...prev,
        isShieldActive: true,
        shieldReason: "Window focus lost. Video is shielded to protect privacy.",
      }));
    };

    const handleFocus = () => {
      setTimeout(() => {
        setShieldState((prev) => ({
          ...prev,
          isShieldActive: false,
          shieldReason: null,
        }));
      }, 1000);
    };

    // 2. Detect Document Visibility Loss (Tab switching)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setShieldState((prev) => ({
          ...prev,
          isShieldActive: true,
          shieldReason: "Tab hidden. Video is protected against background capture.",
        }));
      } else {
        setTimeout(() => {
          setShieldState((prev) => ({
            ...prev,
            isShieldActive: false,
            shieldReason: null,
          }));
        }, 1000);
      }
    };

    // 3. Detect Screenshot & Recording Key Combinations
    const handleKeyDown = (e: KeyboardEvent) => {
      // PrintScreen key
      if (e.key === "PrintScreen" || e.code === "PrintScreen") {
        e.preventDefault();
        triggerShield("Screenshot attempt intercepted. Video shielded for privacy.", 4000);
        return;
      }

      // Windows Snipping Tool (Win + Shift + S) or Mac Screenshot (Cmd + Shift + 3 / 4 / 5)
      const isCmdOrWin = e.metaKey || e.ctrlKey;
      if (e.shiftKey && (e.key === "S" || e.key === "s" || e.code === "KeyS")) {
        triggerShield("Snipping tool detected. Video shielded.", 4000);
        return;
      }

      if (e.metaKey && e.shiftKey && ["3", "4", "5"].includes(e.key)) {
        triggerShield("Mac capture shortcut detected. Video shielded.", 4000);
        return;
      }

      // Alt + F9 (Common screen recording shortcut in OBS / GeForce)
      if (e.altKey && (e.key === "F9" || e.code === "F9")) {
        triggerShield("Screen recorder shortcut detected. Video shielded.", 4000);
        return;
      }
    };

    // 4. Intercept getDisplayMedia to block in-tab screen capture extensions
    const originalGetDisplayMedia = navigator.mediaDevices?.getDisplayMedia;
    if (navigator.mediaDevices && typeof originalGetDisplayMedia === "function") {
      navigator.mediaDevices.getDisplayMedia = async function (options?: DisplayMediaStreamOptions) {
        triggerShield("Unauthorized screen sharing / capture attempt blocked.", 5000);
        throw new Error("Screen recording or display capture is strictly prohibited during private calls.");
      };
    }

    // 5. Prevent right-click context menu inspect/save on calling page
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("contextmenu", handleContextMenu);

    return () => {
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("contextmenu", handleContextMenu);

      if (navigator.mediaDevices && originalGetDisplayMedia) {
        navigator.mediaDevices.getDisplayMedia = originalGetDisplayMedia;
      }
    };
  }, [triggerShield]);

  return shieldState;
}
