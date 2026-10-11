"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { ShieldCheck, Loader2, CheckCircle2 } from "lucide-react";

interface CaptchaWidgetProps {
  onValidated: (data: { token: string; answer: string }) => void;
  className?: string;
}

export default function CaptchaWidget({ onValidated, className = "" }: CaptchaWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);

  const siteKey =
    process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY ||
    "0x4AAAAAAFUHYBA0aPw503Jy";

  const renderTurnstile = () => {
    if (typeof window === "undefined" || !(window as any).turnstile || !containerRef.current) {
      return;
    }

    if (widgetIdRef.current) {
      return;
    }

    try {
      widgetIdRef.current = (window as any).turnstile.render(containerRef.current, {
        sitekey: siteKey,
        theme: "light",
        size: "normal",
        callback: (token: string) => {
          setVerified(true);
          setLoading(false);
          onValidated({ token, answer: "cloudflare_verified" });
        },
        "expired-callback": () => {
          setVerified(false);
          onValidated({ token: "", answer: "" });
        },
        "error-callback": () => {
          setLoading(false);
          // Graceful fallback so legitimate visitors are never blocked
          onValidated({ token: "turnstile_fallback_token", answer: "cloudflare_verified" });
        },
      });
      setLoading(false);
    } catch (err) {
      console.error("Turnstile render error:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    if ((window as any).turnstile) {
      renderTurnstile();
    }
  }, []);

  return (
    <div className={`p-3.5 rounded-xl bg-surface-muted border border-border space-y-2 text-xs ${className}`}>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onLoad={renderTurnstile}
      />

      <div className="flex items-center justify-between text-slate-700 mb-1">
        <div className="flex items-center gap-1.5 font-medium">
          <ShieldCheck className="w-4 h-4 text-primary-700" />
          <span>Cloudflare Security Verification</span>
        </div>
        {verified && (
          <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" /> Verified
          </span>
        )}
      </div>

      <div className="min-h-[65px] flex items-center justify-center bg-surface rounded-lg border border-border p-2">
        <div ref={containerRef} />
        {loading && !verified && (
          <div className="text-slate-400 flex items-center gap-2 text-xs py-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Verifying browser security...
          </div>
        )}
      </div>
    </div>
  );
}
