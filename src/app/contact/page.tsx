import { Mail, MessageSquare, ShieldCheck, HeartHandshake } from "lucide-react";

export default function ContactPage() {
  const supportEmail = process.env.SUPPORT_EMAIL || "support.wehear@gmail.com";

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 sm:px-6 w-full space-y-8">
      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-primary-700 bg-primary-50 px-3 py-1 rounded-full border border-primary-200">
          Support & Inquiries
        </span>
        <h1 className="text-3xl font-serif text-slate-900 font-normal mt-2">Contact Us</h1>
        <p className="mt-1 text-sm text-slate-600">
          Have questions about your account, payment, session, or privacy? We are here to help.
        </p>
      </div>

      <div className="rounded-2xl bg-surface border border-border p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary-100 text-primary-800 flex items-center justify-center shrink-0">
            <Mail className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-medium text-slate-900">Customer Care & Support</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Our support team operates Monday to Saturday, 9:00 AM – 8:00 PM IST. We respond to all queries within 24 business hours.
            </p>
            <a
              href={`mailto:${supportEmail}`}
              className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-primary-700 hover:text-primary-800 font-mono underline"
            >
              {supportEmail}
            </a>
          </div>
        </div>

        <div className="pt-6 border-t border-border flex items-start gap-4" id="report">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-medium text-slate-900">Safety & Trust Team</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              To report community guideline violations or inappropriate peer behavior, report directly from the call screen or email:
            </p>
            <a
              href="mailto:support.wehear@gmail.com"
              className="font-mono text-sm font-semibold text-slate-800 block mt-1 hover:underline"
            >
              support.wehear@gmail.com
            </a>
          </div>
        </div>

        <div className="pt-6 border-t border-border flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-medium text-slate-900">Grievance Redressal & Operations</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              In accordance with the Information Technology Act 2000 and consumer protection guidelines, grievances are handled by our designated Grievance Officer.
            </p>
            <div className="text-xs text-slate-500 pt-1 space-y-0.5">
              <p><strong>Designation:</strong> Grievance Redressal Officer</p>
              <p><strong>Operating Region:</strong> India</p>
              <p><strong>Email:</strong> <a href="mailto:support.wehear@gmail.com" className="font-mono underline text-slate-700">support.wehear@gmail.com</a></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
