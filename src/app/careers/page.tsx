import Link from "next/link";
import { Headphones, HeartHandshake, Shield, Sparkles, CheckCircle2, ArrowRight } from "lucide-react";

export const metadata = {
  title: "Careers & Opportunities | We Hear — Join Our Mission",
  description: "Work with We Hear. Become an active peer listener, platform moderator, or systems engineer.",
};

export default function CareersPage() {
  const roles = [
    {
      title: "Active Peer Listener (Remote / Flexible)",
      type: "Flexible Remote",
      compensation: "₹10 – ₹15 per 30-min call + Instant UPI payouts",
      description: "Support peers by holding space and listening with empathy. Set your own hours, log on when available, and earn direct compensation per completed conversation.",
      requirements: [
        "Patient, active listening mindset and high empathy",
        "Stable internet connection with quiet environment",
        "Willingness to adhere strictly to community privacy guidelines",
      ],
      actionLink: "/listen",
      actionText: "Apply & Start Listening",
    },
    {
      title: "Community Trust & Safety Advocate",
      type: "Part-time / Remote",
      compensation: "Competitive hourly rate",
      description: "Review escalated user reports, ensure strict adherence to harassment-free peer standards, and refine automated safety heuristics.",
      requirements: [
        "Experience in online moderation or crisis intervention",
        "High emotional resilience and fair judgment",
        "Strong written communication skills",
      ],
      actionLink: "mailto:support.wehear@gmail.com?subject=Application:%20Trust%20and%20Safety",
      actionText: "Contact Us to Apply",
    },
    {
      title: "Full-Stack WebRTC / Systems Engineer",
      type: "Contract / Project",
      compensation: "Project-based competitive compensation",
      description: "Optimize Socket.IO signaling, WebRTC ICE/TURN negotiation across NATs, Cloudflare edge security, and distributed Redis pipelines.",
      requirements: [
        "Strong proficiency in TypeScript, Next.js, and Node.js",
        "Hands-on experience with WebRTC (peer connections, STUN/TURN)",
        "Understanding of Redis caching and distributed rate-limiting",
      ],
      actionLink: "mailto:support.wehear@gmail.com?subject=Application:%20Systems%20Engineer",
      actionText: "Send Your Portfolio",
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-800 mb-4">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>We are growing our human-first community</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif text-slate-900 font-normal tracking-tight">
          Help build a world where <br />
          <span className="italic font-medium text-primary-900">no one has to struggle alone.</span>
        </h1>
        <p className="mt-4 text-slate-600 leading-relaxed font-light">
          Whether you want to earn flexible income as a listener or engineer real-time privacy systems, explore open opportunities below.
        </p>
      </div>

      {/* Roles List */}
      <div className="space-y-6 mb-16">
        {roles.map((role) => (
          <div key={role.title} className="p-6 sm:p-8 rounded-2xl bg-surface border border-border shadow-xs hover:border-slate-300 transition">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <h2 className="text-lg font-medium text-slate-900">{role.title}</h2>
              <div className="flex items-center gap-2 text-xs">
                <span className="px-2.5 py-0.5 rounded-full bg-warm-100 text-slate-700 border border-border font-medium">
                  {role.type}
                </span>
                <span className="text-emerald-700 font-medium">
                  {role.compensation}
                </span>
              </div>
            </div>

            <p className="text-sm text-slate-600 mb-4 leading-relaxed font-light">
              {role.description}
            </p>

            <div className="space-y-1.5 mb-6">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700">What we look for:</h3>
              {role.requirements.map((req) => (
                <div key={req} className="flex items-center gap-2 text-xs text-slate-600">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{req}</span>
                </div>
              ))}
            </div>

            <Link
              href={role.actionLink}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-primary-700 hover:text-primary-900 group"
            >
              <span>{role.actionText}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
