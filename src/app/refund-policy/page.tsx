import { AlertTriangle, Clock, RefreshCw, ShieldCheck } from "lucide-react";

export default function RefundPolicyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16 sm:px-6 w-full space-y-8 text-sm text-slate-700 leading-relaxed">
      {/* Notice Banner */}
      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-xs text-amber-950 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold">LEGAL NOTICE & DISCLAIMER:</p>
          <p>Have this document reviewed by a qualified lawyer before production launch.</p>
        </div>
      </div>

      <div className="space-y-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Financial Policy
        </span>
        <h1 className="text-3xl font-serif text-slate-900 font-normal">Refund Policy</h1>
        <p className="text-xs text-slate-500">Last updated: September 2026</p>
      </div>

      {/* 24-Hour Guarantee Card */}
      <div className="p-6 rounded-2xl bg-warm-50 border border-warm-200 space-y-2">
        <div className="flex items-center gap-2 text-base font-semibold text-slate-900">
          <Clock className="w-5 h-5 text-primary-700" />
          <span>Automatic 24-Hour Matching Guarantee</span>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          If you request a call and no available peer listener is assigned to your session within <strong>24 hours</strong>, our automated server worker immediately initiates a 100% refund of your ₹20 payment back to your original payment method.
        </p>
      </div>

      {/* Refund Processing Timeline */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">Processing Timelines</h2>
        <p>
          Once a refund is triggered by our automated system, it is processed via our payment gateway (e.g. Razorpay):
        </p>
        <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600">
          <li><strong>UPI Payments:</strong> Typically credited to your bank account within 2 to 24 hours.</li>
          <li><strong>Net Banking / Debit Cards:</strong> Typically credited within 5 to 7 business days, subject to your issuing bank&apos;s settlement schedule.</li>
        </ul>
      </section>

      {/* Exceptional Disputes */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">Technical Interruptions & Disputes</h2>
        <p>
          If a severe technical failure prevents an eligible session from connecting after payment is captured, contact us with your session code. Our support team verifies server logs and will manually issue a refund if a match could not be fulfilled.
        </p>
      </section>

      {/* Subscriptions */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">Subscription Cancellations</h2>
        <p>
          Fixed-term subscriptions (15 days, 30 days, 2 months) provide continuous platform priority access and are non-refundable once activated, except as required by law.
        </p>
      </section>
    </div>
  );
}
