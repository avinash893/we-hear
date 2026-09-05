import EmergencyCard from "@/components/safety/EmergencyCard";
import { ShieldCheck, EyeOff, UserX, AlertTriangle, Lock, VideoOff, PhoneCall } from "lucide-react";
import Link from "next/link";

export default function SafetyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16 sm:px-6 w-full space-y-12">
      {/* Title */}
      <div className="space-y-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-primary-700 bg-primary-50 px-3 py-1 rounded-full border border-primary-200">
          Safety & Boundaries
        </span>
        <h1 className="text-3xl sm:text-4xl font-serif text-slate-900 font-normal">
          A calm, safe space for human connection.
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed max-w-2xl">
          We Hear connects people for peer listening and mutual emotional companionship. Understanding our boundaries helps keep our community respectful and secure.
        </p>
      </div>

      {/* Immediate Emergency Helplines */}
      <EmergencyCard />

      {/* Safety Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 sm:p-8 rounded-2xl bg-surface border border-border space-y-3 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-700 flex items-center justify-center">
            <EyeOff className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-medium text-slate-900">Total Identity Separation</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Your Google name, email address, profile photo, and database identifiers are never revealed to the other participant. Everyone appears with a generated serene pseudonym like <em>Quiet Sparrow</em>.
          </p>
        </div>

        <div className="p-6 sm:p-8 rounded-2xl bg-surface border border-border space-y-3 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-700 flex items-center justify-center">
            <VideoOff className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-medium text-slate-900">No Call Recording by Default</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Calls use direct peer-to-peer encrypted WebRTC media. We Hear does not record, transcribe, or store your audio or video streams on our servers.
          </p>
        </div>

        <div className="p-6 sm:p-8 rounded-2xl bg-surface border border-border space-y-3 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-700 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-medium text-slate-900">Strict PII Sharing Rule</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            We strongly advise all participants to never share passwords, bank details, home addresses, phone numbers, workplace names, or financial credentials with any peer.
          </p>
        </div>

        <div className="p-6 sm:p-8 rounded-2xl bg-surface border border-border space-y-3 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-700 flex items-center justify-center">
            <UserX className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-medium text-slate-900">Instant Reporting & Blocking</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            If anyone acts inappropriately, you can immediately report them and block them with one click. Blocked users are permanently excluded from future matching with you.
          </p>
        </div>
      </div>

      {/* Clear Scope Disclaimer */}
      <div className="rounded-2xl bg-warm-50 border border-warm-200 p-6 sm:p-8 space-y-3">
        <h3 className="text-base font-semibold text-slate-900">What We Hear Is & Is Not</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-700 pt-2">
          <div className="space-y-1.5 p-4 rounded-xl bg-surface border border-border">
            <p className="font-semibold text-emerald-800">We Hear IS:</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>A place to vent, share feelings, or talk through everyday loneliness.</li>
              <li>Empathetic human companionship without judgment.</li>
              <li>A safe, anonymous listening platform.</li>
            </ul>
          </div>
          <div className="space-y-1.5 p-4 rounded-xl bg-surface border border-border">
            <p className="font-semibold text-amber-900">We Hear is NOT:</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>A substitute for professional psychotherapy or psychiatry.</li>
              <li>An emergency crisis line or medical provider.</li>
              <li>A clinical mental health treatment service.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
