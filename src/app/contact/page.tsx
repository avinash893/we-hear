import { Mail, MessageSquare, ShieldCheck, HeartHandshake } from "lucide-react";

export default function ContactPage() {
  const supportEmail = process.env.SUPPORT_EMAIL || "support@wehear.example.com";

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 sm:px-6 w-full space-y-8">
      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-primary-700 bg-primary-50 px-3 py-1 rounded-full border border-primary-200">
          Support & Inquiries
        </span>
        <h1 className="text-3xl font-serif text-slate-900 font-normal mt-2">Contact Us</h1>
        <p className="mt-1 text-sm text-slate-600">
          Have a question about your account, payment, or platform safety? We are here to help.
        </p>
      </div>

      <div className="rounded-2xl bg-surface border border-border p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary-100 text-primary-800 flex items-center justify-center shrink-0">
            <Mail className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-medium text-slate-900">Email Support</h2>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Our team responds to all queries within 24 business hours. For session-related questions, please include your anonymous session code.
            </p>
            <a
              href={`mailto:${supportEmail}`}
              className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-primary-700 hover:text-primary-800 font-mono underline"
            >
              {supportEmail}
            </a>
          </div>
        </div>

        <div className="pt-6 border-t border-border flex items-start gap-4" id="report">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-medium text-slate-900">Report a Safety Concern</h2>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              If you experienced inappropriate behavior during a call, you can report it directly inside the call screen or email us at{" "}
              <span className="font-mono text-slate-800">safety@wehear.example.com</span>. All safety inquiries are treated with strict confidentiality.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
