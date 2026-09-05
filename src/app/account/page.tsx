"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import { User, ShieldCheck, Trash2, EyeOff, Lock, AlertTriangle } from "lucide-react";
import DestroyIdentityModal from "@/components/account/DestroyIdentityModal";
import Link from "next/link";

export default function AccountPage() {
  const { data: session, status } = useSession();
  const [isDestroyModalOpen, setIsDestroyModalOpen] = useState(false);

  if (status === "loading") {
    return (
      <div className="flex-1 flex items-center justify-center py-20 text-slate-500 text-sm">
        Loading profile...
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 px-4 text-center">
        <p className="text-slate-600 mb-4">Please sign in to view your account.</p>
        <Link
          href="/auth/signin"
          className="px-5 py-2.5 rounded-xl bg-primary-700 text-white font-medium text-sm"
        >
          Sign In
        </Link>
      </div>
    );
  }

  const user = session.user as any;
  const nickname = user?.nickname || "Anonymous Peer";
  const anonymousId = user?.anonymousId || "usr_pending";

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 sm:px-6 w-full space-y-8">
      <div>
        <h1 className="text-2xl font-serif text-slate-900 font-normal">Account & Identity</h1>
        <p className="mt-1 text-sm text-slate-600">
          Manage your anonymous identity and privacy preferences on We Hear.
        </p>
      </div>

      {/* Anonymous Profile Card */}
      <div className="rounded-2xl bg-surface border border-border p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary-100 border border-primary-200 flex items-center justify-center text-primary-800 font-semibold text-xl">
            {nickname.charAt(0)}
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Visible Nickname
            </span>
            <h2 className="text-xl font-medium text-slate-900">{nickname}</h2>
            <p className="text-xs font-mono text-slate-500 mt-0.5">{anonymousId}</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-warm-50 border border-warm-200 text-xs text-slate-700 space-y-2">
          <div className="flex items-center gap-2 font-semibold text-slate-900">
            <EyeOff className="w-4 h-4 text-primary-700" />
            <span>Strict Identity Shield</span>
          </div>
          <p className="leading-relaxed">
            Other participants only see <strong>{nickname}</strong>. Your Google account name, email address, profile picture, and Google ID are isolated server-side and never sent to other callers or client browsers.
          </p>
        </div>

        <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-2 p-3 rounded-xl bg-surface-muted border border-border">
            <Lock className="w-4 h-4 text-primary-600 shrink-0" />
            <span>Encrypted WebRTC Media</span>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-xl bg-surface-muted border border-border">
            <ShieldCheck className="w-4 h-4 text-primary-600 shrink-0" />
            <span>No Audio/Video Recording</span>
          </div>
        </div>
      </div>

      {/* Destroy Identity Danger Card */}
      <div className="rounded-2xl border border-red-200 bg-red-50/40 p-6 sm:p-8 space-y-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-red-100 text-red-700 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-red-950">Destroy My Identity</h3>
            <p className="mt-1 text-xs text-red-900/80 leading-relaxed">
              Permanently wipe your anonymous profile, matching queues, and listener availability. This action is irreversible.
            </p>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={() => setIsDestroyModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-all shadow-xs"
          >
            <Trash2 className="w-4 h-4" />
            <span>Destroy Identity</span>
          </button>
        </div>
      </div>

      {/* Destroy Identity Confirmation Modal */}
      <DestroyIdentityModal
        isOpen={isDestroyModalOpen}
        onClose={() => setIsDestroyModalOpen(false)}
        nickname={nickname}
      />
    </div>
  );
}
