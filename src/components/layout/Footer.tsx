import Link from "next/link";
import { HeartHandshake, ShieldAlert } from "lucide-react";

export default function Footer() {
  const supportEmail = process.env.SUPPORT_EMAIL || "support.wehear@gmail.com";

  return (
    <footer className="bg-warm-100/70 border-t border-border mt-auto">
      {/* Safety Notice Banner in Footer */}
      <div className="border-b border-border bg-warm-50 py-3 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between flex-wrap gap-2 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              <strong>Peer Support Notice:</strong> We Hear is an empathetic listening platform, not a medical or psychiatric provider.
            </span>
          </div>
          <Link href="/safety" className="text-primary-700 hover:underline font-medium">
            Need immediate crisis help? &rarr;
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: Brand */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2.5 text-primary-900 font-semibold tracking-tight text-lg">
              <img src="/favicon.svg" alt="We Hear Logo" className="w-8 h-8 rounded-xl shadow-xs shrink-0" />
              <span>We Hear</span>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              Sometimes, you just need someone to listen. Calm, anonymous, one-to-one human companionship.
            </p>
            <p className="text-xs text-slate-400">
              © {new Date().getFullYear()} We Hear. All rights reserved.
            </p>
          </div>

          {/* Col 2: Product */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 mb-3">Product</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>
                <Link href="/#how-it-works" className="hover:text-slate-900 transition-colors">
                  How it works
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-slate-900 transition-colors">
                  Pricing & Plans
                </Link>
              </li>
              <li>
                <Link href="/safety" className="hover:text-slate-900 transition-colors">
                  Safety & Privacy
                </Link>
              </li>
              <li>
                <Link href="/talk" className="hover:text-slate-900 transition-colors">
                  Talk (Speaker)
                </Link>
              </li>
              <li>
                <Link href="/listen" className="hover:text-slate-900 transition-colors">
                  Listen (Earn ₹15)
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Legal */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 mb-3">Legal</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>
                <Link href="/terms" className="hover:text-slate-900 transition-colors">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-slate-900 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/refund-policy" className="hover:text-slate-900 transition-colors">
                  Refund Policy (24-hr)
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Support */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 mb-3">Support</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>
                <Link href="/contact" className="hover:text-slate-900 transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/contact#report" className="hover:text-slate-900 transition-colors">
                  Report a Problem
                </Link>
              </li>
              <li className="pt-2">
                <a
                  href={`mailto:${supportEmail}`}
                  className="text-xs text-primary-700 font-mono hover:underline"
                >
                  {supportEmail}
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
