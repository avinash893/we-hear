"use client";

import { useState } from "react";
import { AlertTriangle, X, ShieldAlert, Trash2 } from "lucide-react";
import { signOut } from "next-auth/react";

interface DestroyIdentityModalProps {
  isOpen: boolean;
  onClose: () => void;
  nickname: string;
}

export default function DestroyIdentityModal({
  isOpen,
  onClose,
  nickname,
}: DestroyIdentityModalProps) {
  const [confirmationInput, setConfirmationInput] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDestroy = async () => {
    if (confirmationInput !== "DESTROY") {
      setError("Please type DESTROY in all caps to confirm.");
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      const res = await fetch("/api/user/destroy-identity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: true }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to destroy identity.");
      }

      // Automatically sign out and redirect to home
      await signOut({ callbackUrl: "/?identity_destroyed=1" });
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-surface border border-red-200 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-red-50/80 px-6 py-4 border-b border-red-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-red-900 font-semibold">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <span>Destroy your identity?</span>
          </div>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-sm text-slate-700">
          <div className="p-3.5 rounded-xl bg-red-50/60 border border-red-200/80 text-xs text-red-950 space-y-2">
            <p className="font-semibold">This action cannot be undone.</p>
            <p className="leading-relaxed">
              This will permanently remove your platform profile, your anonymous identity (<strong>{nickname}</strong>), matching availability, and all user data that the platform is legally permitted to delete.
            </p>
          </div>

          <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
            <p>
              <strong>What will happen immediately:</strong>
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Your anonymous nickname and profile identifiers will be wiped.</li>
              <li>You will be immediately removed from all matchmaking queues and listener availability.</li>
              <li>Any active or pending call sessions will be terminated.</li>
              <li>Active authentication sessions and tokens will be permanently revoked.</li>
            </ul>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
            <p className="flex items-center gap-1.5 font-medium text-slate-800 mb-1">
              <ShieldAlert className="w-4 h-4 text-slate-600 shrink-0" />
              Legal & Accounting Retention Notice:
            </p>
            <p className="leading-relaxed">
              Certain transaction records (such as completed payment IDs, timestamps, and tax records) may be retained strictly as required by Indian taxation, fraud prevention, and banking compliance laws.
            </p>
          </div>

          {/* Explicit Confirmation Input */}
          <div className="pt-2">
            <label className="block text-xs font-semibold text-slate-800 mb-1.5">
              To proceed, please type <span className="font-mono text-red-700 font-bold">DESTROY</span> below:
            </label>
            <input
              type="text"
              value={confirmationInput}
              onChange={(e) => setConfirmationInput(e.target.value)}
              placeholder="DESTROY"
              disabled={isDeleting}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono tracking-wider focus:border-red-500 focus:ring-1 focus:ring-red-500"
            />
          </div>

          {error && (
            <p className="text-xs text-red-600 font-medium">{error}</p>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-border flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDestroy}
            disabled={isDeleting || confirmationInput !== "DESTROY"}
            className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all shadow-xs"
          >
            <Trash2 className="w-4 h-4" />
            <span>{isDeleting ? "Destroying..." : "Permanently Destroy Identity"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
