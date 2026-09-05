"use client";

import { useState } from "react";
import { ShieldAlert, X, AlertOctagon, CheckCircle2, UserX } from "lucide-react";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionCode: string;
  reportedRoleName: string;
}

const REPORT_REASONS = [
  { id: "SOLICITING_PII", label: "Asking for personal contact details / financial info" },
  { id: "HARASSMENT", label: "Harassment or offensive language" },
  { id: "THREAT", label: "Threatening behavior or self-harm concerns" },
  { id: "SEXUAL_MISCONDUCT", label: "Inappropriate sexual conduct" },
  { id: "SCAM", label: "Scam, sales pitch, or commercial solicitation" },
  { id: "OTHER", label: "Other platform violation" },
];

export default function ReportModal({
  isOpen,
  onClose,
  sessionCode,
  reportedRoleName,
}: ReportModalProps) {
  const [selectedReason, setSelectedReason] = useState<string>(REPORT_REASONS[0].id);
  const [description, setDescription] = useState("");
  const [alsoBlock, setAlsoBlock] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      // 1. Submit report
      const reportRes = await fetch("/api/safety/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionCode,
          reason: selectedReason,
          description: description.trim(),
        }),
      });

      if (!reportRes.ok) {
        const d = await reportRes.json();
        throw new Error(d.message || "Failed to submit report.");
      }

      // 2. If user selected also block
      if (alsoBlock) {
        await fetch("/api/safety/block", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionCode }),
        });
      }

      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        onClose();
      }, 2500);
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-md bg-surface border border-border rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-surface-muted border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-900 font-semibold text-sm">
            <ShieldAlert className="w-5 h-5 text-amber-700" />
            <span>Report Participant</span>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        {submitted ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-900">Report Received</h3>
            <p className="text-xs text-slate-600 leading-relaxed max-w-xs mx-auto">
              Thank you for keeping We Hear safe. Our moderation team will review this report. Your identity remains strictly confidential.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
            <p className="text-slate-600">
              Report the peer participant in this session. Anonymous reports protect your privacy and ensure community safety.
            </p>

            <div className="space-y-2">
              <label className="font-semibold text-slate-800 block">Reason for Report</label>
              <div className="space-y-1.5">
                {REPORT_REASONS.map((r) => (
                  <label
                    key={r.id}
                    className={`flex items-start gap-2 p-2.5 rounded-xl border cursor-pointer transition-colors ${
                      selectedReason === r.id
                        ? "border-primary-600 bg-primary-50/60 font-medium text-slate-900"
                        : "border-border hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <input
                      type="radio"
                      name="reportReason"
                      value={r.id}
                      checked={selectedReason === r.id}
                      onChange={(e) => setSelectedReason(e.target.value)}
                      className="mt-0.5 text-primary-700 focus:ring-primary-600"
                    />
                    <span>{r.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-800 block">
                Additional Details (Optional)
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Briefly describe what occurred..."
                className="w-full p-3 rounded-xl border border-slate-300 text-xs focus:border-primary-600 focus:ring-1 focus:ring-primary-600"
              />
            </div>

            {/* Block Checkbox */}
            <label className="flex items-center gap-2 cursor-pointer select-none pt-1">
              <input
                type="checkbox"
                checked={alsoBlock}
                onChange={(e) => setAlsoBlock(e.target.checked)}
                className="rounded text-primary-700 focus:ring-primary-600"
              />
              <span className="text-slate-700 flex items-center gap-1">
                <UserX className="w-3.5 h-3.5 text-slate-500" />
                Also prevent this participant from ever being matched with me again
              </span>
            </label>

            {error && <p className="text-red-600 font-medium">{error}</p>}

            <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2 rounded-xl text-slate-700 hover:bg-slate-100 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-xs"
              >
                {submitting ? "Submitting..." : "Submit Report"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
