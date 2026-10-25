"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { HeartHandshake, ShieldCheck, Clock, CheckCircle2, Loader2, ArrowRight, AlertCircle, Sparkles } from "lucide-react";
import Link from "next/link";
import Script from "next/script";

export default function TalkPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const [isDemoSession, setIsDemoSession] = useState(false);
  const [stage, setStage] = useState<"READY" | "PAYING" | "SEARCHING" | "MATCHED" | "NO_PEER">("READY");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionCode, setSessionCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchSecondsLeft, setSearchSecondsLeft] = useState(5 * 60); // 5-minute timeout

  // Redirect if unauthenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin?callbackUrl=/talk");
    }
  }, [status, router]);

  // 5-minute search timeout: cut connection if nobody joins within 5 minutes
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (stage === "SEARCHING") {
      timer = setInterval(() => {
        setSearchSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setStage("NO_PEER");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setSearchSecondsLeft(5 * 60);
    }
    return () => clearInterval(timer);
  }, [stage]);

  // Polling for match status in 10-second intervals (paced rate limiting)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (stage === "SEARCHING" && sessionId) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/matchmaking/status?sessionId=${sessionId}`);
          if (res.ok) {
            const data = await res.json();
            if (data.matched && data.sessionCode) {
              setStage("MATCHED");
              setSessionCode(data.sessionCode);
              clearInterval(interval);
              router.push(`/call/${data.sessionCode}`);
            }
          }
        } catch (err) {
          console.error("Polling error:", err);
        }
      }, 10000);
    }
    return () => clearInterval(interval);
  }, [stage, sessionId, router]);

  if (status === "loading") {
    return (
      <div className="flex-1 flex items-center justify-center py-20 text-slate-500 text-sm">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading...
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 px-4 text-center">
        <h2 className="text-xl font-serif text-slate-900 mb-2">Sign in to talk</h2>
        <p className="text-sm text-slate-600 mb-6 max-w-sm">
          Join with your Google account. Your identity stays 100% private with an anonymous nickname.
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

  const handleStartDemoCall = async () => {
    setIsDemoLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/calls/create-demo", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Could not initialize demo call.");
      }

      setSessionId(data.sessionId);
      setSessionCode(data.sessionCode);
      setIsDemoSession(true);

      if (data.matched && data.sessionCode) {
        setStage("MATCHED");
        router.push(`/call/${data.sessionCode}`);
      } else {
        setStage("SEARCHING");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to start demo call.");
    } finally {
      setIsDemoLoading(false);
    }
  };

  const handleStartCallRequest = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Create order
      const orderRes = await fetch("/api/payments/create-order", {
        method: "POST",
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        throw new Error(orderData.message || "Could not initialize call payment.");
      }

      setSessionId(orderData.sessionId);

      // Ensure Razorpay script is loaded if not already present
      if (!orderData.isMock && !(window as any).Razorpay) {
        await new Promise<void>((resolve) => {
          const script = document.createElement("script");
          script.src = "https://checkout.razorpay.com/v1/checkout.js";
          script.onload = () => resolve();
          script.onerror = () => resolve();
          document.body.appendChild(script);
        });
      }

      // 2. If Mock Payment (in local development without Razorpay keys)
      if (orderData.isMock || !(window as any).Razorpay) {
        setStage("PAYING");
        // Simulate immediate verification
        const verifyRes = await fetch("/api/payments/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: orderData.orderId,
            paymentId: `pay_mock_${Date.now()}`,
            signature: "mock_signature",
            sessionId: orderData.sessionId,
          }),
        });
        const verifyData = await verifyRes.json();
        if (!verifyRes.ok) throw new Error(verifyData.message || "Payment verification failed.");

        if (verifyData.matched && verifyData.sessionCode) {
          setStage("MATCHED");
          setSessionCode(verifyData.sessionCode);
          router.push(`/call/${verifyData.sessionCode}`);
        } else {
          setStage("SEARCHING");
        }
      } else {
        // 3. Real Razorpay Checkout
        const options = {
          key: orderData.keyId,
          amount: orderData.amount || (orderData.amountInr * 100),
          currency: orderData.currency || "INR",
          name: "We Hear",
          description: "30-minute anonymous peer conversation",
          order_id: orderData.orderId,
          handler: async function (response: any) {
            setStage("PAYING");
            const verifyRes = await fetch("/api/payments/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                sessionId: orderData.sessionId,
              }),
            });
            const verifyData = await verifyRes.json();
            if (verifyData.matched && verifyData.sessionCode) {
              setStage("MATCHED");
              router.push(`/call/${verifyData.sessionCode}`);
            } else {
              setStage("SEARCHING");
            }
          },
          theme: {
            color: "#2F6B52",
          },
          modal: {
            ondismiss: function () {
              setLoading(false);
            },
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to start call request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 max-w-lg mx-auto w-full">
        {/* Stage 1: Ready to Request */}
        {stage === "READY" && (
          <div className="w-full bg-surface border border-border rounded-2xl p-8 shadow-xs space-y-6">
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Speaker Dashboard
              </span>
              <h1 className="text-2xl font-serif text-slate-900 font-normal">
                Hello, {nickname}
              </h1>
              <p className="text-sm text-slate-600">Want someone to listen?</p>
            </div>

            <div className="p-6 rounded-xl bg-warm-50 border border-warm-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">Call Duration</span>
                <span className="text-sm font-semibold text-slate-900 flex items-center gap-1">
                  <Clock className="w-4 h-4 text-primary-700" /> 30 minutes
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-warm-200 pt-3">
                <span className="text-sm font-medium text-slate-700">Call Fee</span>
                <span className="text-2xl font-bold text-primary-800">₹20</span>
              </div>
            </div>

            <div className="space-y-3">
              {/* Free Demo Mode Card */}
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-left space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    Free Demo Active
                  </span>
                  <span className="text-[10px] font-bold bg-emerald-200/80 text-emerald-900 px-2 py-0.5 rounded-full">
                    ₹0 Free
                  </span>
                </div>
                <p className="text-xs text-emerald-900/80 leading-relaxed">
                  Try a full 30-minute private call without paying anything. Test our encrypted WebRTC video room and talk anonymously.
                </p>
                <button
                  type="button"
                  disabled={loading || isDemoLoading}
                  onClick={handleStartDemoCall}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-xs transition-all shadow-xs active:scale-[0.99]"
                >
                  {isDemoLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Preparing demo room...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Start Free Demo Call (No Payment)</span>
                    </>
                  )}
                </button>
              </div>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-border"></div>
                <span className="flex-shrink mx-3 text-[10px] uppercase font-semibold text-slate-400">or standard session</span>
                <div className="flex-grow border-t border-border"></div>
              </div>

              <button
                type="button"
                disabled={loading || isDemoLoading}
                onClick={handleStartCallRequest}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-primary-700 hover:bg-primary-800 text-white font-medium text-sm transition-all shadow-xs active:scale-[0.99]"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Preparing session...</span>
                  </>
                ) : (
                  <>
                    <HeartHandshake className="w-4 h-4" />
                    <span>Find Paid Listener (₹20)</span>
                  </>
                )}
              </button>

              <div className="p-3 rounded-lg bg-surface-muted border border-border text-[11px] text-slate-600 text-center leading-relaxed">
                <strong>24-Hour Refund Guarantee:</strong> If no eligible listener is available within 24 hours, your ₹20 payment will be automatically refunded.
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>
        )}

        {/* Stage 2 & 3: Searching for Listener */}
        {stage === "SEARCHING" && (
          <div className="w-full bg-surface border border-border rounded-2xl p-8 shadow-xs space-y-6 text-center">
            <div className="w-16 h-16 rounded-full bg-primary-50 text-primary-700 flex items-center justify-center mx-auto">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-medium border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>{isDemoSession ? "Free Demo Call Active (₹0)" : "Payment successful (₹20)"}</span>
              </div>
              <h2 className="text-xl font-serif text-slate-900 font-normal">
                Finding someone who is available...
              </h2>
              <div className="flex items-center justify-center gap-1.5 text-xs font-mono text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-3 py-1 w-fit mx-auto">
                <Clock className="w-3.5 h-3.5" />
                <span>Searching timeout: {Math.floor(searchSecondsLeft / 60)}:{(searchSecondsLeft % 60).toString().padStart(2, "0")}</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
                We are assigning an active peer listener to your private call room. If nobody is available within 5 minutes, your request will be safely closed.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-warm-50 border border-warm-200 text-xs text-slate-600 space-y-1 text-left">
              <p className="font-semibold text-slate-800">What happens next?</p>
              <p>As soon as an available listener accepts, you will be redirected automatically into your private 30-minute WebRTC video room.</p>
            </div>

            {isDemoSession && sessionCode && (
              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  onClick={() => router.push(`/call/${sessionCode}`)}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-xs transition-colors flex items-center justify-center gap-2 shadow-xs active:scale-[0.99]"
                >
                  <span>Enter Demo Room Instantly</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <p className="text-[11px] text-slate-500">
                  You can enter now to test camera/mic or invite a friend via link!
                </p>
              </div>
            )}

            <div className="text-[11px] text-slate-400">
              Session ID: <span className="font-mono">{sessionId?.substring(0, 12)}...</span>
            </div>
          </div>
        )}

        {/* Stage 4: Matched */}
        {stage === "MATCHED" && (
          <div className="w-full bg-surface border border-border rounded-2xl p-8 shadow-xs space-y-6 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-medium text-slate-900">Listener Found!</h2>
              <p className="text-xs text-slate-500 mt-1">Connecting to your secure video room...</p>
            </div>
            {sessionCode && (
              <Link
                href={`/call/${sessionCode}`}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary-700 text-white font-medium text-sm"
              >
                <span>Enter Call Room</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        )}

        {/* Stage 5: Nobody Online Timeout (5-minute cutoff) */}
        {stage === "NO_PEER" && (
          <div className="w-full bg-surface border border-border rounded-2xl p-8 shadow-xs space-y-6 text-center animate-in fade-in">
            <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
              <Clock className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-medium border border-amber-200">
                Connection Closed
              </span>
              <h2 className="text-xl font-serif text-slate-900 font-normal">
                Nobody is currently online
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
                We searched for an available listener for 5 minutes, but everyone is currently offline or occupied.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-surface-muted border border-border text-xs text-slate-600 space-y-1 text-left">
              <p className="font-semibold text-slate-800">What happens now?</p>
              <p>Under our platform rules, your search session has been safely closed. You can try searching again, share a direct demo room link with a peer, or return shortly.</p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setStage("READY");
                  setSessionId(null);
                  setSessionCode(null);
                }}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-primary-700 hover:bg-primary-800 text-white font-medium text-xs transition-colors shadow-xs active:scale-[0.99]"
              >
                Try Again
              </button>
              <Link
                href="/"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-surface border border-border text-slate-700 hover:bg-warm-50 font-medium text-xs transition-colors text-center"
              >
                Back to Home
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
