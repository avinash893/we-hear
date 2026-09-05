"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Headphones, Radio, Power, Wallet, CheckCircle2, Loader2, ArrowRight, ShieldAlert } from "lucide-react";
import Link from "next/link";

export default function ListenPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [isAvailable, setIsAvailable] = useState(false);
  const [todayEarnings, setTodayEarnings] = useState(0);
  const [todayCalls, setTodayCalls] = useState(0);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [incomingMatch, setIncomingMatch] = useState<string | null>(null);

  // Fetch initial listener profile & availability
  const fetchAvailability = async () => {
    try {
      const res = await fetch("/api/listener/availability");
      if (res.ok) {
        const data = await res.json();
        setIsAvailable(data.isAvailable);
        setTodayEarnings(data.todayEarningsInr || 0);
        setTodayCalls(data.todayCallsCount || 0);
        if (data.activeSessionCode) {
          setIncomingMatch(data.activeSessionCode);
        }
      }
    } catch (err) {
      console.error("Failed to fetch availability:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchAvailability();
    }
  }, [session]);

  // If available, poll for incoming matches
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isAvailable && !incomingMatch) {
      interval = setInterval(async () => {
        try {
          const res = await fetch("/api/matchmaking/status");
          if (res.ok) {
            const data = await res.json();
            if (data.hasIncomingMatch && data.sessionCode) {
              setIncomingMatch(data.sessionCode);
              clearInterval(interval);
              router.push(`/call/${data.sessionCode}`);
            }
          }
        } catch (err) {
          console.error("Match check error:", err);
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isAvailable, incomingMatch, router]);

  const toggleAvailability = async () => {
    setToggling(true);
    try {
      const nextState = !isAvailable;
      const res = await fetch("/api/listener/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAvailable: nextState }),
      });
      if (res.ok) {
        const data = await res.json();
        setIsAvailable(data.isAvailable);
        if (data.matchedSessionCode) {
          setIncomingMatch(data.matchedSessionCode);
          router.push(`/call/${data.matchedSessionCode}`);
        }
      }
    } catch (err) {
      console.error("Failed to toggle availability:", err);
    } finally {
      setToggling(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20 text-slate-500 text-sm">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading listener dashboard...
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 px-4 text-center">
        <h2 className="text-xl font-serif text-slate-900 mb-2">Sign in to listen</h2>
        <p className="text-sm text-slate-600 mb-6 max-w-sm">
          Become a peer listener. Earn ₹15 per successfully completed call while keeping your identity private.
        </p>
        <Link
          href="/auth/signin"
          className="px-6 py-3 rounded-xl bg-primary-700 hover:bg-primary-800 text-white font-medium text-sm transition-colors"
        >
          Sign In Anonymously
        </Link>
      </div>
    );
  }

  const user = session.user as any;
  const nickname = user?.nickname || "Anonymous Peer";

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 max-w-lg mx-auto w-full space-y-6">
      {/* Incoming Call Alert Modal/Banner */}
      {incomingMatch && (
        <div className="w-full p-4 rounded-2xl bg-emerald-50 border border-emerald-300 shadow-md animate-bounce flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Radio className="w-6 h-6 text-emerald-600 animate-pulse" />
            <div>
              <h3 className="text-sm font-semibold text-emerald-950">You have been matched!</h3>
              <p className="text-xs text-emerald-800">A speaker is waiting in your room.</p>
            </div>
          </div>
          <Link
            href={`/call/${incomingMatch}`}
            className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold"
          >
            Join Call Room
          </Link>
        </div>
      )}

      <div className="w-full bg-surface border border-border rounded-2xl p-8 shadow-xs space-y-6">
        {/* Header Greeting */}
        <div className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Listener Dashboard
          </span>
          <h1 className="text-2xl font-serif text-slate-900 font-normal">
            Hello, {nickname}
          </h1>
          <p className="text-sm text-slate-600">Provide non-judgmental human companionship.</p>
        </div>

        {/* Availability Status Card */}
        <div className="p-6 rounded-xl bg-warm-50 border border-warm-200 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">Your Status</span>
            <div className="flex items-center gap-2">
              <span
                className={`w-3 h-3 rounded-full ${
                  isAvailable ? "bg-emerald-500 animate-pulse" : "bg-slate-300"
                }`}
              />
              <span className="text-sm font-semibold text-slate-900">
                {isAvailable ? "Available" : "Offline"}
              </span>
            </div>
          </div>

          <button
            type="button"
            disabled={toggling}
            onClick={toggleAvailability}
            className={`w-full py-3 px-4 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 ${
              isAvailable
                ? "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 shadow-xs"
                : "bg-primary-700 hover:bg-primary-800 text-white shadow-xs"
            }`}
          >
            {toggling ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isAvailable ? (
              <>
                <Power className="w-4 h-4 text-slate-500" />
                <span>Go Offline</span>
              </>
            ) : (
              <>
                <Radio className="w-4 h-4" />
                <span>Set to Available</span>
              </>
            )}
          </button>

          {isAvailable && (
            <p className="text-xs text-primary-800 text-center font-medium">
              You are available to listen. We&apos;ll notify you when someone is matched with you.
            </p>
          )}
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-surface-muted border border-border">
            <span className="text-xs font-medium text-slate-500 block">Today&apos;s Earnings</span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">₹{todayEarnings}</span>
            <span className="text-[10px] text-slate-400">₹15 per eligible call</span>
          </div>

          <div className="p-4 rounded-xl bg-surface-muted border border-border">
            <span className="text-xs font-medium text-slate-500 block">Completed Today</span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">{todayCalls}</span>
            <span className="text-[10px] text-slate-400">Conversations</span>
          </div>
        </div>

        {/* Earning Rules & Peer Boundaries Reminder */}
        <div className="p-4 rounded-xl bg-surface-muted border border-border text-xs text-slate-600 space-y-2">
          <div className="flex items-center gap-1.5 font-medium text-slate-800">
            <ShieldAlert className="w-4 h-4 text-primary-700" />
            <span>Peer Support Reminder</span>
          </div>
          <p className="leading-relaxed">
            You are a supportive human listener, not a therapist. If a speaker is in crisis, guide them to national helplines.
          </p>
          <p className="text-[11px] text-slate-500 pt-1 border-t border-border">
            <strong>Earning Rule:</strong> If the client ends the call, you receive ₹15. If you leave the call before the client, earnings are forfeited.
          </p>
        </div>

        <div className="text-center pt-2">
          <Link
            href="/earnings"
            className="text-xs font-semibold text-primary-700 hover:text-primary-800 flex items-center justify-center gap-1"
          >
            <span>View detailed earnings & payouts</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
