"use client";

import React from "react";
import { Video, ShieldCheck, HeartHandshake, Award, ArrowRight } from "lucide-react";

interface ListenerPreCallModalProps {
  isOpen: boolean;
  onAccept: () => void;
  minEarningInr?: number;
  maxEarningInr?: number;
  baseEarningInr?: number;
}

export default function ListenerPreCallModal({
  isOpen,
  onAccept,
  minEarningInr = 8,
  maxEarningInr = 14,
  baseEarningInr = 10,
}: ListenerPreCallModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-lg bg-surface border border-border rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-left">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
            <Video className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">
              Listener Requirement
            </span>
            <h3 className="text-xl font-serif text-slate-900 font-medium">
              Mandatory Camera & Presence Notice
            </h3>
          </div>
        </div>

        {/* Notice Points */}
        <div className="space-y-3.5 text-xs text-slate-600">
          <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold text-amber-950">Camera Must Remain On</span>
              <p className="text-amber-900/90 leading-relaxed text-[11px]">
                To provide genuine emotional presence and comfort, listeners cannot turn off their camera during the session. Your face and attentive listening must be visible.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-surface-muted border border-border flex items-start gap-3">
            <HeartHandshake className="w-5 h-5 text-primary-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold text-slate-900">Evaluated by Speaker</span>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                Your peer will evaluate your attentiveness, empathy, and genuineness at the end of the session. Listeners who are distracted or inattentive receive lower evaluations.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex items-start gap-3">
            <Award className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold text-emerald-950">
                Performance Payout: ₹{minEarningInr} to ₹{maxEarningInr}
              </span>
              <p className="text-emerald-900/90 leading-relaxed text-[11px]">
                The speaker&apos;s 1–5 star rating directly decides your payout for this session (Base: ₹{baseEarningInr}, Max: ₹{maxEarningInr}, Min: ₹{minEarningInr}).
              </p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="pt-2">
          <button
            type="button"
            onClick={onAccept}
            className="w-full py-3.5 px-5 rounded-2xl bg-primary-700 hover:bg-primary-800 active:scale-[0.99] text-white text-xs font-semibold shadow-md transition-all flex items-center justify-center gap-2"
          >
            <span>I Understand & Agree — Turn on Camera & Start</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <p className="mt-2 text-[10px] text-center text-slate-400">
            By proceeding, you agree to maintain active, genuine video presence throughout the conversation.
          </p>
        </div>
      </div>
    </div>
  );
}
