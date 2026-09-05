import { ShieldAlert, PhoneCall } from "lucide-react";

export default function EmergencyCard() {
  return (
    <div className="rounded-2xl border border-amber-200/80 bg-amber-50/50 p-6 my-6">
      <div className="flex items-start gap-4">
        <div className="p-2.5 rounded-xl bg-amber-100 text-amber-800 shrink-0">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div className="space-y-3">
          <h3 className="text-base font-semibold text-amber-950">
            Need immediate crisis help?
          </h3>
          <p className="text-sm text-amber-900/90 leading-relaxed">
            We Hear is for peer conversation and gentle human companionship. We are <strong>not a medical, psychological, psychiatric, or emergency service</strong>. If you or someone you know is in distress, thinking about self-harm, or in an emergency, please contact qualified help right away:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3 rounded-lg bg-white border border-amber-200/60 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">National Emergency</span>
              <div className="flex items-center justify-between mt-1">
                <span className="text-sm font-medium text-slate-900">Emergency Services (India)</span>
                <a href="tel:112" className="text-xs font-bold text-primary-700 hover:underline flex items-center gap-1">
                  <PhoneCall className="w-3.5 h-3.5" /> 112
                </a>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-white border border-amber-200/60 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Tele-MANAS (MoHFW)</span>
              <div className="flex items-center justify-between mt-1">
                <span className="text-sm font-medium text-slate-900">24/7 Mental Health Helpline</span>
                <a href="tel:14416" className="text-xs font-bold text-primary-700 hover:underline flex items-center gap-1">
                  <PhoneCall className="w-3.5 h-3.5" /> 14416
                </a>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-white border border-amber-200/60 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Vandrevala Foundation</span>
              <div className="flex items-center justify-between mt-1">
                <span className="text-sm font-medium text-slate-900">Free Crisis Counseling</span>
                <a href="tel:9999666555" className="text-xs font-bold text-primary-700 hover:underline flex items-center gap-1">
                  <PhoneCall className="w-3.5 h-3.5" /> 9999 666 555
                </a>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-white border border-amber-200/60 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">KIRAN (Govt. of India)</span>
              <div className="flex items-center justify-between mt-1">
                <span className="text-sm font-medium text-slate-900">National Helpline</span>
                <a href="tel:18005990019" className="text-xs font-bold text-primary-700 hover:underline flex items-center gap-1">
                  <PhoneCall className="w-3.5 h-3.5" /> 1800-599-0019
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
