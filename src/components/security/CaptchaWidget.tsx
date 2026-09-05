"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, RefreshCw, Loader2 } from "lucide-react";

interface CaptchaWidgetProps {
  onValidated: (data: { token: string; answer: string }) => void;
  className?: string;
}

export default function CaptchaWidget({ onValidated, className = "" }: CaptchaWidgetProps) {
  const [question, setQuestion] = useState<string>("");
  const [token, setToken] = useState<string>("");
  const [userAnswer, setUserAnswer] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  const fetchChallenge = async () => {
    setLoading(true);
    setUserAnswer("");
    try {
      const res = await fetch("/api/security/captcha");
      if (res.ok) {
        const data = await res.json();
        setQuestion(data.question);
        setToken(data.token);
      }
    } catch (e) {
      console.error("Failed to load captcha", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallenge();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setUserAnswer(val);
    onValidated({ token, answer: val });
  };

  return (
    <div className={`p-3.5 rounded-xl bg-surface-muted border border-border space-y-2 text-xs ${className}`}>
      <div className="flex items-center justify-between text-slate-700">
        <div className="flex items-center gap-1.5 font-medium">
          <ShieldCheck className="w-4 h-4 text-primary-700" />
          <span>Human Verification</span>
        </div>
        <button
          type="button"
          onClick={fetchChallenge}
          disabled={loading}
          className="p-1 rounded hover:bg-warm-100 text-slate-400 hover:text-slate-600 transition-colors"
          title="Reload Challenge"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex-1 py-1.5 px-3 rounded-lg bg-surface border border-border text-slate-900 font-mono font-medium">
          {loading ? (
            <span className="text-slate-400 flex items-center gap-1.5 text-[11px]">
              <Loader2 className="w-3 h-3 animate-spin" /> Loading puzzle...
            </span>
          ) : (
            question
          )}
        </div>
        <input
          type="text"
          value={userAnswer}
          onChange={handleChange}
          placeholder="Answer"
          className="w-20 py-1.5 px-3 rounded-lg border border-slate-300 text-center font-mono font-bold text-slate-900 focus:border-primary-600 focus:ring-1 focus:ring-primary-600"
        />
      </div>
    </div>
  );
}
