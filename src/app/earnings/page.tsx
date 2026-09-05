"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { Wallet, Clock, CheckCircle2, ShieldCheck, AlertCircle, ArrowUpRight } from "lucide-react";
import Link from "next/link";

export default function EarningsPage() {
  const { data: session, status } = useSession();
  const [data, setData] = useState<{
    availableBalanceInr: number;
    pendingBalanceInr: number;
    completedCallsCount: number;
    minPayoutThresholdInr: number;
    history: any[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session) {
      fetch("/api/listener/earnings")
        .then((res) => res.json())
        .then((resData) => setData(resData))
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [session]);

  if (status === "loading" || loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20 text-slate-500 text-sm">
        Loading earnings...
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 px-4 text-center">
        <p className="text-slate-600 mb-4">Please sign in to view your earnings.</p>
        <Link
          href="/auth/signin"
          className="px-5 py-2.5 rounded-xl bg-primary-700 text-white font-medium text-sm"
        >
          Sign In
        </Link>
      </div>
    );
  }

  const available = data?.availableBalanceInr ?? 0;
  const pending = data?.pendingBalanceInr ?? 0;
  const count = data?.completedCallsCount ?? 0;
  const threshold = data?.minPayoutThresholdInr ?? 100;

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 sm:px-6 w-full space-y-8">
      <div>
        <h1 className="text-2xl font-serif text-slate-900 font-normal">Your Earnings</h1>
        <p className="mt-1 text-sm text-slate-600">
          Peer listener earnings from successfully completed conversations.
        </p>
      </div>

      {/* Primary Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-6 rounded-2xl bg-surface border border-border shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Available
          </span>
          <div className="text-3xl font-bold text-primary-800 mt-2">₹{available}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">Ready for payout</span>
        </div>

        <div className="p-6 rounded-2xl bg-surface border border-border shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Pending
          </span>
          <div className="text-3xl font-bold text-amber-700 mt-2">₹{pending}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">In settlement window</span>
        </div>

        <div className="p-6 rounded-2xl bg-surface border border-border shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Completed
          </span>
          <div className="text-3xl font-bold text-slate-800 mt-2">{count}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">Conversations</span>
        </div>
      </div>

      {/* Payout Information Card */}
      <div className="rounded-2xl bg-warm-50 border border-warm-200 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-slate-900">Payout Settlement</h3>
            <p className="text-xs text-slate-600">
              Minimum payout threshold: <strong>₹{threshold}</strong>. UPI transfers are initiated automatically every Monday or upon request once verified.
            </p>
          </div>
          <button
            disabled={available < threshold}
            className="px-4 py-2 rounded-xl bg-primary-700 hover:bg-primary-800 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-semibold transition-colors shrink-0"
          >
            Request Payout
          </button>
        </div>

        <div className="p-3 rounded-lg bg-surface border border-border text-[11px] text-slate-600 leading-relaxed flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-primary-700 shrink-0 mt-0.5" />
          <span>
            <strong>Fraud Protection:</strong> Payouts are protected against collusion and artificial session terminations. If a listener disconnects before the client ends the call, the session is not eligible for earnings.
          </span>
        </div>
      </div>

      {/* Earnings Activity Log */}
      <div className="rounded-2xl bg-surface border border-border overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-border bg-surface-muted">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
            Recent Eligible Conversations
          </h3>
        </div>

        {data?.history && data.history.length > 0 ? (
          <div className="divide-y divide-border">
            {data.history.map((item) => (
              <div key={item.id} className="p-4 flex items-center justify-between text-xs">
                <div className="space-y-1">
                  <div className="font-medium text-slate-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Peer Support Call Completed</span>
                  </div>
                  <div className="text-slate-500 text-[11px]">
                    {new Date(item.createdAt).toLocaleDateString()} at{" "}
                    {new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-emerald-700 text-sm">+₹{item.amountInr}</span>
                  <span className="block text-[10px] text-slate-400 uppercase tracking-wider">
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-slate-500">
            No completed conversations yet. Set your status to Available to begin listening.
          </div>
        )}
      </div>
    </div>
  );
}
