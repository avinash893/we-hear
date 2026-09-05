import Link from "next/link";
import { AlertCircle, ArrowLeft } from "lucide-react";

export default function AuthErrorPage() {
  return (
    <div className="flex-1 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-surface border border-border rounded-2xl p-8 shadow-xs text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-medium text-slate-900">Authentication Issue</h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          We could not complete your sign in. This may happen if the account was destroyed or if authorization was interrupted.
        </p>
        <div className="pt-4">
          <Link
            href="/auth/signin"
            className="inline-flex items-center gap-2 py-2.5 px-4 rounded-xl bg-primary-700 hover:bg-primary-800 text-white text-sm font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Sign In</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
