import Link from "next/link";
import { HeartHandshake, ShieldAlert, ShieldCheck } from "lucide-react";

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
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Col 1: Brand */}
          <div className="space-y-4 col-span-2 md:col-span-2">
            <div className="flex items-center gap-2.5 text-primary-900 font-semibold tracking-tight text-lg">
              <img src="/favicon.svg" alt="We Hear Logo" className="w-8 h-8 rounded-xl shadow-xs shrink-0" />
              <span>We Hear</span>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed max-w-sm">
              Sometimes, you just need someone to listen. Calm, anonymous, one-to-one human companionship.
            </p>
            <div className="inline-flex items-center gap-2 text-xs text-slate-600 px-3 py-1 rounded-full bg-surface border border-border">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Cloudflare Edge Secured • Zero Recording</span>
            </div>
          </div>

          {/* Col 2: Company */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 mb-3">Company</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>
                <Link href="/about" className="hover:text-slate-900 transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/careers" className="hover:text-slate-900 transition-colors flex items-center gap-1.5">
                  <span>Careers</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-medium">Hiring</span>
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-slate-900 transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Product */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 mb-3">Platform</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>
                <Link href="/talk" className="hover:text-slate-900 transition-colors">
                  Talk (Speaker)
                </Link>
              </li>
              <li>
                <Link href="/listen" className="hover:text-slate-900 transition-colors">
                  Listen & Earn
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-slate-900 transition-colors">
                  Pricing & Plans
                </Link>
              </li>
              <li>
                <Link href="/safety" className="hover:text-slate-900 transition-colors">
                  Safety Guidelines
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Legal & Support */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 mb-3">Legal & Support</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>
                <Link href="/terms" className="hover:text-slate-900 transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-slate-900 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/refund-policy" className="hover:text-slate-900 transition-colors">
                  Refund Policy
                </Link>
              </li>
              <li>
                <a
                  href={`mailto:${supportEmail}`}
                  className="text-xs text-primary-700 font-mono hover:underline block pt-1"
                >
                  {supportEmail}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar Proper */}
        <div className="border-t border-border mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} We Hear Inc. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-5">
            <Link href="/about" className="hover:text-slate-800 transition">About</Link>
            <Link href="/careers" className="hover:text-slate-800 transition">Careers</Link>
            <Link href="/safety" className="hover:text-slate-800 transition">Safety</Link>
            <Link href="/privacy" className="hover:text-slate-800 transition">Privacy</Link>
            <Link href="/terms" className="hover:text-slate-800 transition">Terms</Link>
            <Link href="/contact" className="hover:text-slate-800 transition">Support</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
