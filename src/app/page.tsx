import Link from "next/link";
import { HeartHandshake, Headphones, ShieldCheck, Lock, UserX, Clock, ArrowRight } from "lucide-react";
import EmergencyCard from "@/components/safety/EmergencyCard";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center">
      {/* Hero Section */}
      <section className="w-full max-w-4xl mx-auto px-4 sm:px-6 pt-16 pb-12 sm:pt-24 sm:pb-20 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-warm-100 border border-border text-xs font-medium text-slate-700 mb-8">
          <span className="w-2 h-2 rounded-full bg-primary-600" />
          <span>Anonymous 1-to-1 Human Video Conversations</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif tracking-tight text-slate-900 leading-[1.15] font-normal">
          Sometimes, you just need <br className="hidden sm:inline" />
          <span className="italic font-medium text-primary-900">someone to listen.</span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed font-light">
          Talk anonymously with another person. <br className="hidden sm:inline" />
          No introductions. No judgment. Just human presence.
        </p>

        {/* Primary Action Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md mx-auto">
          <Link
            href="/talk"
            className="w-full sm:w-1/2 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-primary-700 text-white font-medium hover:bg-primary-800 transition-all shadow-sm hover:shadow active:scale-[0.99]"
          >
            <HeartHandshake className="w-5 h-5" />
            <span>I want to talk</span>
          </Link>

          <Link
            href="/listen"
            className="w-full sm:w-1/2 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-surface border border-border text-slate-800 font-medium hover:bg-warm-50 transition-all shadow-xs hover:border-slate-300 active:scale-[0.99]"
          >
            <Headphones className="w-5 h-5 text-primary-700" />
            <span>I want to listen</span>
          </Link>
        </div>

        {/* Value Pillars */}
        <div className="mt-12 pt-8 border-t border-border/80 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-medium text-slate-600">
          <div className="flex items-center justify-center gap-2">
            <Lock className="w-4 h-4 text-primary-600" />
            <span>Private by design</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <UserX className="w-4 h-4 text-primary-600" />
            <span>Anonymous names</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Clock className="w-4 h-4 text-primary-600" />
            <span>30-minute sessions</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <HeartHandshake className="w-4 h-4 text-primary-600" />
            <span>Human connection</span>
          </div>
        </div>
      </section>

      {/* A Safer Way to Talk Section */}
      <section className="w-full bg-warm-100/60 border-y border-border py-14 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-2xl bg-surface border border-border p-6 sm:p-8 shadow-xs">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-primary-50 text-primary-700 shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="space-y-3">
                <h2 className="text-xl font-semibold text-slate-900">A safer way to talk</h2>
                <p className="text-sm text-slate-600 leading-relaxed">
                  You choose what you share. Your real identity, email, and Google profile are <strong>never shown</strong> to the other participant. Every person receives an anonymous calm pseudonym like <em>Quiet Sparrow</em> or <em>Blue Leaf</em>.
                </p>
                <div className="p-4 rounded-xl bg-warm-50 border border-warm-200/70 text-xs text-slate-700 space-y-1">
                  <p className="font-semibold text-slate-900">Privacy Rule:</p>
                  <p>
                    Please do not share your real name, phone number, address, email, passwords, financial information, workplace details, or other personally identifying information with another participant.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-serif text-slate-900 font-normal">
            How We Hear Works
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Simple, fair, and respectful for both speakers and listeners.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Speaker Card */}
          <div className="rounded-2xl bg-surface border border-border p-6 sm:p-8 flex flex-col justify-between hover:border-slate-300 transition-colors shadow-xs">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 text-primary-800 text-xs font-semibold mb-4">
                <HeartHandshake className="w-3.5 h-3.5" />
                For Speakers (Talk)
              </div>
              <h3 className="text-xl font-medium text-slate-900">Need someone to hear you out?</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Whether you had a difficult day, are feeling lonely, navigating a tough relationship, or simply want to speak without being judged:
              </p>
              <ul className="mt-4 space-y-2.5 text-xs text-slate-700">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-600 mt-1.5 shrink-0" />
                  <span><strong>₹20 per conversation</strong> (30-minute video/audio call)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-600 mt-1.5 shrink-0" />
                  <span>Completely anonymous nickname generated for you</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-600 mt-1.5 shrink-0" />
                  <span><strong>24-Hour refund guarantee</strong> if no eligible listener is available</span>
                </li>
              </ul>
            </div>
            <div className="mt-8 pt-6 border-t border-border">
              <Link
                href="/talk"
                className="inline-flex items-center gap-2 text-sm font-semibold text-primary-700 hover:text-primary-800"
              >
                Find someone to talk to <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Listener Card */}
          <div className="rounded-2xl bg-surface border border-border p-6 sm:p-8 flex flex-col justify-between hover:border-slate-300 transition-colors shadow-xs">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-warm-100 text-warm-900 text-xs font-semibold mb-4">
                <Headphones className="w-3.5 h-3.5" />
                For Peer Listeners (Listen)
              </div>
              <h3 className="text-xl font-medium text-slate-900">Willing to lend a caring ear?</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Provide compassionate, non-judgmental peer companionship. Listeners are everyday empathetic people, not therapists or medical doctors.
              </p>
              <ul className="mt-4 space-y-2.5 text-xs text-slate-700">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-600 mt-1.5 shrink-0" />
                  <span><strong>Earn ₹15</strong> for every successfully completed eligible call</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-600 mt-1.5 shrink-0" />
                  <span>Turn your availability on or off anytime with 1 click</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-600 mt-1.5 shrink-0" />
                  <span>Safe and respectful: block or report inappropriate users</span>
                </li>
              </ul>
            </div>
            <div className="mt-8 pt-6 border-t border-border">
              <Link
                href="/listen"
                className="inline-flex items-center gap-2 text-sm font-semibold text-primary-700 hover:text-primary-800"
              >
                Become a listener <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Emergency Card */}
        <EmergencyCard />
      </section>
    </div>
  );
}
