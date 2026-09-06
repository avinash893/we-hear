"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { HeartHandshake, ShieldCheck, Clock, CheckCircle2, Loader2, ArrowRight, AlertCircle } from "lucide-react";
import Link from "next/link";
import Script from "next/script";

export default function TalkPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState<"READY" | "PAYING" | "SEARCHING" | "MATCHED">("READY");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionCode, setSessionCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Polling for match status when in SEARCHING stage
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
      }, 3000);
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

      // 2. If Mock Payment (in local development or when live Razorpay is not configured)
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
          amount: orderData.amountInr * 100,
          currency: orderData.currency,
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
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

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
              <button
                type="button"
                disabled={loading}
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
                    <span>Find Someone to Talk To (₹20)</span>
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
                <span>Payment successful (₹20)</span>
              </div>
              <h2 className="text-xl font-serif text-slate-900 font-normal">
                Finding someone who is available...
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
                We are assigning an active peer listener to your private call room. You can close this page, but keeping it open is recommended.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-warm-50 border border-warm-200 text-xs text-slate-600 space-y-1 text-left">
              <p className="font-semibold text-slate-800">What happens next?</p>
              <p>As soon as an available listener accepts, you will be redirected automatically into your private 30-minute WebRTC video room.</p>
            </div>

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
      </div>
    </>
  );
}
