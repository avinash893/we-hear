import { ShieldAlert, AlertTriangle } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16 sm:px-6 w-full space-y-8 text-sm text-slate-700 leading-relaxed">


      <div className="space-y-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Legal Agreement
        </span>
        <h1 className="text-3xl font-serif text-slate-900 font-normal">Terms and Conditions</h1>
        <p className="text-xs text-slate-500">Last updated: September 2026</p>
      </div>

      {/* 1. Platform Nature */}
      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-slate-900">1. Nature of the Platform</h2>
        <p>
          We Hear facilitates anonymous, peer-to-peer 1-to-1 video and audio conversations for emotional companionship and listening. <strong>We Hear is not a hospital, medical clinic, licensed therapist service, psychological counseling provider, or emergency service.</strong>
        </p>
        <p>
          Peer listeners are independent voluntary participants and are not certified healthcare professionals, counselors, or crisis workers unless independently qualified and verified under a separate credentialing agreement.
        </p>
      </section>

      {/* 2. Age Requirement */}
      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-slate-900">2. Age Requirement (18+)</h2>
        <p>
          You must be at least eighteen (18) years of age to register for, access, or participate in We Hear. By creating an account, you affirm that you are 18 or older.
        </p>
      </section>

      {/* 3. User Responsibility & Sensitive Information */}
      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-slate-900">3. User Responsibility & Disclosures</h2>
        <p>
          Users are solely responsible for what they choose to share. <strong>You must NOT disclose:</strong>
        </p>
        <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600">
          <li>Passwords, One-Time Passwords (OTPs), or private credentials</li>
          <li>Bank account numbers, UPI PINs, credit/debit card information</li>
          <li>Residential addresses, phone numbers, or government-issued IDs</li>
          <li>Workplace identifiers or personal social media handles</li>
        </ul>
        <p className="text-xs text-slate-600 pt-1">
          While the platform implements transport encryption and strict pseudonymity, We Hear cannot guarantee protection against information that a user voluntarily reveals, nor against situations where another participant independently photographs, screenshots, or retains information.
        </p>
      </section>

      {/* 4. Prohibited Conduct */}
      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-slate-900">4. Prohibited Conduct</h2>
        <p>You agree not to engage in:</p>
        <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600">
          <li>Harassment, stalking, hate speech, bullying, or intimidation</li>
          <li>Threats of violence or encouraging self-harm</li>
          <li>Sexual exploitation, nudity, or non-consensual sexual conduct</li>
          <li>Financial fraud, scamming, impersonation, or extortion</li>
          <li>Doxxing or soliciting personal identifiers or financial accounts</li>
          <li>Abusing the payment, earnings, or 24-hour refund systems</li>
        </ul>
      </section>

      {/* 5. Payments, Earnings & Refunds */}
      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-slate-900">5. Payments, Fees & Earnings</h2>
        <p>
          <strong>Call Fee:</strong> Speakers pay ₹20 per standard 30-minute conversation.
        </p>
        <p>
          <strong>Listener Earnings:</strong> Eligible listeners earn ₹15 per successfully completed call. Earnings are credited if the client ends the call or the call duration is fully completed. If the listener disconnects or cuts the call before the client, the earning is forfeited.
        </p>
        <p>
          <strong>24-Hour Refund:</strong> If a paid call request cannot be matched with an available listener within twenty-four (24) hours, a full refund of ₹20 is automatically initiated via the payment processor.
        </p>
      </section>

      {/* 6. Identity Destruction */}
      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-slate-900">6. Destroy My Identity Feature</h2>
        <p>
          Users may exercise the &quot;Destroy Identity&quot; option at any time. This permanently deletes your anonymous nickname, platform profile, and availability, and revokes active sessions. Records legally required for accounting, taxation, anti-fraud, or payment compliance will be retained solely as required by applicable laws.
        </p>
      </section>

      {/* 7. Limitation of Liability */}
      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-slate-900">7. Limitation of Liability</h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          To the maximum extent permitted by applicable law, We Hear and its operators shall not be liable for any indirect, incidental, punitive, or consequential damages arising from user conduct, peer conversations, technical interruptions, or voluntary disclosures. The platform facilitates peer connections as an intermediary only.
        </p>
      </section>

      {/* 8. Governing Law & Dispute Resolution Placeholder */}
      <section className="space-y-2 p-4 rounded-xl bg-surface-muted border border-border text-xs">
        <h3 className="font-semibold text-slate-900">Governing Law & Legal Jurisdiction:</h3>
        <p>
          [Placeholder: These Terms shall be governed by and construed in accordance with the laws of India. Any disputes arising hereunder shall be subject to the exclusive jurisdiction of the competent courts in [City/State, India].]
        </p>
      </section>
    </div>
  );
}
