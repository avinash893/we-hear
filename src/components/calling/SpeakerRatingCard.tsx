"use client";

import React, { useState } from "react";
import { Star, Heart, CheckCircle2, MessageSquare, Loader2, Sparkles } from "lucide-react";

interface SpeakerRatingCardProps {
  sessionCode: string;
  peerNickname: string;
  minEarningInr?: number;
  maxEarningInr?: number;
  baseEarningInr?: number;
  onRatingComplete?: (rating: number, earnedInr: number) => void;
}

const RATING_DESCRIPTIONS: Record<number, { title: string; desc: string; color: string }> = {
  1: { title: "Inattentive / Disconnected", desc: "Listener seemed distracted or absent", color: "text-amber-700" },
  2: { title: "Below Expectations", desc: "Listened, but lacked genuine presence", color: "text-amber-600" },
  3: { title: "Good & Attentive", desc: "Listened well and offered calm support", color: "text-primary-700" },
  4: { title: "Very Warm & Empathetic", desc: "Active listening and caring demeanor", color: "text-emerald-600" },
  5: { title: "Exceptional & Genuine", desc: "Deeply comforting, present, and sincere", color: "text-emerald-700" },
};

const COMMON_TAGS = [
  "Deeply Attentive",
  "Warm & Caring",
  "Felt Heard",
  "Patient",
  "Calming Presence",
  "Distracted",
];

export default function SpeakerRatingCard({
  sessionCode,
  peerNickname,
  minEarningInr = 8,
  maxEarningInr = 14,
  baseEarningInr = 10,
  onRatingComplete,
}: SpeakerRatingCardProps) {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [calculatedEarned, setCalculatedEarned] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const activeScore = hoverRating || rating;

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmitRating = async () => {
    setSubmitting(true);
    setErrorMessage(null);

    const fullFeedback = [
      selectedTags.length > 0 ? `Tags: [${selectedTags.join(", ")}]` : "",
      feedback.trim(),
    ]
      .filter(Boolean)
      .join(" - ");

    try {
      const res = await fetch("/api/calls/rate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionCode,
          rating,
          feedback: fullFeedback,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to record evaluation.");
      }

      setSubmitted(true);
      setCalculatedEarned(data.calculatedEarningInr);
      if (onRatingComplete) {
        onRatingComplete(rating, data.calculatedEarningInr);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="p-6 rounded-3xl bg-emerald-50/80 border border-emerald-200 text-center space-y-3 animate-in fade-in">
        <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-emerald-950">Evaluation Recorded!</h4>
          <p className="text-xs text-emerald-800 leading-relaxed">
            Thank you for your feedback. Based on your rating, {peerNickname} was awarded{" "}
            <strong className="font-bold">₹{calculatedEarned || baseEarningInr}</strong> for their active presence.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-3xl bg-surface border border-border space-y-5 text-left shadow-sm">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-primary-700 uppercase tracking-wider">
            Speaker Experience Feedback
          </span>
          <span className="text-[10px] text-slate-400">Decides Listener Payout</span>
        </div>
        <h3 className="text-base font-serif font-medium text-slate-900">
          How attentive & genuine was {peerNickname}?
        </h3>
        <p className="text-xs text-slate-500">
          Your evaluation determines the listener&apos;s payout (min ₹{minEarningInr} to max ₹{maxEarningInr}).
        </p>
      </div>

      {/* Star Selector */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 justify-center sm:justify-start py-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              disabled={submitting}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(null)}
              className="p-1.5 transition-transform hover:scale-110 focus:outline-none"
              aria-label={`${star} Stars`}
            >
              <Star
                className={`w-7 h-7 transition-colors ${
                  star <= activeScore
                    ? "fill-amber-400 text-amber-400 drop-shadow-sm"
                    : "text-slate-300"
                }`}
              />
            </button>
          ))}
        </div>

        {/* Selected Rating Description */}
        <div className="px-3.5 py-2 rounded-xl bg-surface-muted border border-border/80 flex items-center justify-between text-xs">
          <span className="font-medium text-slate-800">
            {RATING_DESCRIPTIONS[activeScore]?.title}
          </span>
          <span className="text-[11px] text-slate-500">
            {activeScore >= 4 ? `Rewarded Max Pay (₹${maxEarningInr})` : activeScore <= 2 ? `Min Pay (₹${minEarningInr})` : `Base Pay (₹${baseEarningInr})`}
          </span>
        </div>
      </div>

      {/* Feedback Tags */}
      <div className="space-y-2">
        <span className="text-[11px] font-medium text-slate-700 block">
          What describes your experience? (optional)
        </span>
        <div className="flex flex-wrap gap-1.5">
          {COMMON_TAGS.map((tag) => {
            const isSelected = selectedTags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  isSelected
                    ? "bg-primary-100 text-primary-900 border border-primary-300 shadow-xs"
                    : "bg-surface-muted hover:bg-slate-200 text-slate-600 border border-transparent"
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </div>

      {/* Note Area */}
      <div className="space-y-1.5">
        <label htmlFor="speakerFeedback" className="text-[11px] font-medium text-slate-700 block">
          Private note for {peerNickname} (optional)
        </label>
        <textarea
          id="speakerFeedback"
          rows={2}
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Share what brought you comfort, or how they can improve..."
          className="w-full text-xs p-3 rounded-xl bg-surface-muted border border-border focus:ring-2 focus:ring-primary-500 focus:outline-none resize-none placeholder:text-slate-400"
          maxLength={500}
        />
      </div>

      {errorMessage && (
        <p className="text-xs text-red-600 font-medium">{errorMessage}</p>
      )}

      {/* Submit Action */}
      <button
        type="button"
        disabled={submitting}
        onClick={handleSubmitRating}
        className="w-full py-3 px-4 rounded-xl bg-primary-700 hover:bg-primary-800 disabled:opacity-50 text-white text-xs font-semibold transition-all flex items-center justify-center gap-2 shadow-sm"
      >
        {submitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Calculating & Finalizing Payout...</span>
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Submit Rating & Finalize Payout</span>
          </>
        )}
      </button>
    </div>
  );
}
