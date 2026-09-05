"use client";

import { useState } from "react";
import { SUBSCRIPTION_PLANS, SubscriptionPlan } from "@/lib/subscriptions/config";
import { Check, HeartHandshake, Headphones, ShieldCheck, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function PricingPage() {
  const [activeTab, setActiveTab] = useState<"CLIENT" | "LISTENER">("CLIENT");
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const { data: session } = useSession();
  const router = useRouter();

  const plans = SUBSCRIPTION_PLANS.filter((p) => p.role === activeTab);

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    if (!session) {
      router.push("/auth/signin");
      return;
    }

    setSubscribing(plan.id);
    try {
      const res = await fetch("/api/subscriptions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: plan.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create subscription");

      alert(`Subscription plan "${plan.name}" initiated successfully.`);
      if (activeTab === "CLIENT") router.push("/talk");
      else router.push("/listen");
    } catch (err: any) {
      alert(err.message || "Subscription error");
    } finally {
      setSubscribing(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-16 sm:px-6 w-full space-y-12">
      {/* Title */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <span className="text-xs font-semibold uppercase tracking-wider text-primary-700 bg-primary-50 px-3 py-1 rounded-full border border-primary-200">
          Simple, Transparent Pricing
        </span>
        <h1 className="text-3xl sm:text-4xl font-serif text-slate-900 font-normal">
          Fair pricing for everyone.
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          Standard calls are always available on demand. Optional subscriptions provide priority matching and platform benefits for frequent participants.
        </p>
      </div>

      {/* Pay-as-you-go Banner */}
      <div className="rounded-2xl bg-surface border border-border p-6 sm:p-8 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Standard Pay-As-You-Go
          </span>
          <h3 className="text-xl font-medium text-slate-900">₹20 per 30-minute conversation</h3>
          <p className="text-xs text-slate-600 max-w-lg">
            No subscription required. Speakers pay ₹20 per call with a 24-hour auto-refund guarantee. Listeners earn ₹15 on eligible completed calls.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => router.push("/talk")}
            className="px-5 py-2.5 rounded-xl bg-primary-700 hover:bg-primary-800 text-white text-xs font-semibold transition-colors"
          >
            Start a Call (₹20)
          </button>
        </div>
      </div>

      {/* Subscription Tabs */}
      <div className="flex justify-center">
        <div className="p-1 bg-surface-muted border border-border rounded-xl inline-flex gap-1">
          <button
            onClick={() => setActiveTab("CLIENT")}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-medium transition-all ${
              activeTab === "CLIENT"
                ? "bg-white text-slate-900 shadow-xs font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <HeartHandshake className="w-4 h-4 text-primary-600" />
            <span>Speaker Plans</span>
          </button>
          <button
            onClick={() => setActiveTab("LISTENER")}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-medium transition-all ${
              activeTab === "LISTENER"
                ? "bg-white text-slate-900 shadow-xs font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Headphones className="w-4 h-4 text-primary-600" />
            <span>Listener Passes</span>
          </button>
        </div>
      </div>

      {/* Subscription Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className="rounded-2xl bg-surface border border-border p-6 sm:p-8 flex flex-col justify-between shadow-xs hover:border-slate-300 transition-all"
          >
            <div className="space-y-4">
              <div>
                <span className="text-xs font-bold text-primary-700 uppercase tracking-wider">
                  {plan.durationDays} Days Plan
                </span>
                <h3 className="text-xl font-medium text-slate-900 mt-1">{plan.name}</h3>
                <p className="text-xs text-slate-500 mt-1">{plan.description}</p>
              </div>

              <div className="pt-2 pb-4 border-b border-border">
                <span className="text-3xl font-bold text-slate-900">₹{plan.priceInr}</span>
                <span className="text-xs text-slate-500 ml-1">/ {plan.durationDays} days</span>
              </div>

              <ul className="space-y-2.5 text-xs text-slate-600">
                {plan.features.map((f, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary-600 shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-6 mt-6 border-t border-border">
              <button
                type="button"
                disabled={subscribing === plan.id}
                onClick={() => handleSubscribe(plan)}
                className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs transition-colors flex items-center justify-center gap-2"
              >
                {subscribing === plan.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span>Choose {plan.durationDays} Days</span>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
