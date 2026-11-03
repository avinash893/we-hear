import Link from "next/link";
import { HeartHandshake, ShieldCheck, Lock, Users, Sparkles, MessageSquareHeart } from "lucide-react";

export const metadata = {
  title: "About Us | We Hear — Anonymous Peer Emotional Support",
  description: "Learn about We Hear's mission to provide judgment-free, anonymous 1-on-1 peer listening conversations.",
};

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-warm-100 border border-border text-xs font-medium text-slate-700 mb-4">
          <HeartHandshake className="w-3.5 h-3.5 text-primary-700" />
          <span>Our Story & Core Philosophy</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif text-slate-900 font-normal tracking-tight">
          A place where listening <br />
          <span className="italic font-medium text-primary-900">comes before judgment.</span>
        </h1>
        <p className="mt-4 text-slate-600 leading-relaxed font-light">
          We built We Hear because in an overly connected world, true, unfiltered human presence without fear of consequences has become rare.
        </p>
      </div>

      {/* Core Principles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        <div className="p-6 rounded-2xl bg-surface border border-border shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary-700">
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="font-medium text-slate-900 text-base">Zero-Data Architecture</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            All calls run peer-to-peer via encrypted WebRTC. Zero audio or video is ever routed through recording pipelines or stored on our servers.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-surface border border-border shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary-700">
            <Users className="w-5 h-5" />
          </div>
          <h3 className="font-medium text-slate-900 text-base">Human Empathy First</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            We aren't a clinical diagnosis tool. We Hear is peer-to-peer emotional grounding: connecting real humans who care to listen when life feels heavy.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-surface border border-border shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary-700">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-medium text-slate-900 text-base">Community Safety</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            With Cloudflare edge shields, instant anonymous identity destroyers, and 1-click in-call report tools, user dignity is non-negotiable.
          </p>
        </div>
      </div>

      {/* Narrative Section */}
      <div className="space-y-6 text-slate-700 leading-relaxed text-sm bg-warm-50/60 p-8 rounded-2xl border border-border mb-12">
        <h2 className="text-xl font-serif text-slate-900 font-medium">Why We Started</h2>
        <p>
          Talking to family or close friends can often carry emotional baggage—the fear of burdening them, being misunderstood, or facing unsolicited advice. Professional therapy is vital, but sometimes you just need to vent at 11:30 PM about a tough day without booking weeks in advance.
        </p>
        <p>
          We Hear bridges that human gap. You enter anonymously, talk for 30 minutes with someone who simply holds space for you, and leave with complete peace of mind.
        </p>
      </div>

      {/* CTA Bottom Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 rounded-2xl bg-surface border border-border shadow-xs">
        <div>
          <h3 className="font-medium text-slate-900 text-base">Ready to experience We Hear?</h3>
          <p className="text-xs text-slate-600">Start an anonymous 30-minute call or join as an active listener.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Link
            href="/talk"
            className="w-full sm:w-auto text-center px-4 py-2.5 rounded-xl bg-primary-700 text-white text-xs font-medium hover:bg-primary-800 transition shadow-xs"
          >
            Start Talking
          </Link>
          <Link
            href="/careers"
            className="w-full sm:w-auto text-center px-4 py-2.5 rounded-xl bg-surface border border-border text-slate-700 text-xs font-medium hover:bg-warm-50 transition"
          >
            Join as Listener
          </Link>
        </div>
      </div>
    </div>
  );
}
