import { AlertTriangle, Lock, EyeOff, ShieldCheck } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16 sm:px-6 w-full space-y-8 text-sm text-slate-700 leading-relaxed">
      {/* Notice Banner */}
      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-xs text-amber-950 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold">LEGAL NOTICE & DISCLAIMER:</p>
          <p>
            Have this document reviewed by a qualified lawyer before production launch.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Privacy Policy
        </span>
        <h1 className="text-3xl font-serif text-slate-900 font-normal">Privacy by Design</h1>
        <p className="text-xs text-slate-500">Last updated: September 2026</p>
      </div>

      {/* 1. Identity Isolation */}
      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-slate-900">1. Strict Identity Isolation</h2>
        <p>
          We Hear was architected from the ground up to prevent participants from learning each other&apos;s real identity:
        </p>
        <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600">
          <li><strong>Google OAuth Information:</strong> Used solely to authenticate your account and manage payments. Your Google email, name, and profile photo are stored isolated on the backend and are <strong>never sent</strong> to other users.</li>
          <li><strong>Anonymous Pseudonyms:</strong> Every user receives a generated serene nickname (e.g. <em>Quiet Sparrow</em>, <em>Blue Leaf</em>) and internal identifier. Other users see only this nickname.</li>
        </ul>
      </section>

      {/* 2. WebRTC Video & Audio */}
      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-slate-900">2. No Audio or Video Recording</h2>
        <p>
          We Hear does not record, transcribe, store, or analyze your video or audio conversations. Conversations are routed peer-to-peer using WebRTC with SRTP/DTLS transport encryption. No artificial intelligence or sentiment analysis is performed on call media.
        </p>
      </section>

      {/* 3. Payment Data */}
      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-slate-900">3. Payment Information</h2>
        <p>
          All payments are handled by certified, RBI-compliant payment processors (such as Razorpay). We Hear never stores raw debit/credit card numbers, CVVs, or net banking credentials on our servers. We retain only transactional reference IDs, order numbers, and timestamps required for accounting and fraud prevention.
        </p>
      </section>

      {/* 4. Destroy My Identity */}
      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-slate-900">4. Data Deletion & Identity Destruction</h2>
        <p>
          When you click &quot;Destroy Identity&quot;, we immediately:
        </p>
        <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600">
          <li>Permanently delete your anonymous nickname and platform profile.</li>
          <li>Remove you from all matchmaking queues and active listener availability.</li>
          <li>Scrub personal OAuth tokens and invalidate active session credentials.</li>
        </ul>
        <p className="text-xs text-slate-600 pt-1">
          Financial transaction records (e.g., invoices, transaction IDs, tax audit logs) are retained strictly as required by Indian taxation and company law.
        </p>
      </section>

      {/* 5. Contact Placeholder */}
      <section className="space-y-2 p-4 rounded-xl bg-surface-muted border border-border text-xs">
        <h3 className="font-semibold text-slate-900">Data Protection Officer / Grievance Officer:</h3>
        <p>
          [Placeholder: For privacy inquiries or grievance redressal under Indian Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, contact: privacy@wehear.example.com]
        </p>
      </section>
    </div>
  );
}
