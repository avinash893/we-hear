export interface SubscriptionPlan {
  id: string;
  name: string;
  role: "CLIENT" | "LISTENER";
  durationDays: number;
  priceInr: number;
  description: string;
  features: string[];
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  // Speaker / Client Plans
  {
    id: "client-15-days",
    name: "15 Days Speaker Access",
    role: "CLIENT",
    durationDays: 15,
    priceInr: Number(process.env.PLAN_CLIENT_15_INR || 249),
    description: "Unlimited priority queue matching for 15 days.",
    features: [
      "Priority queue matching",
      "Waived standard platform connection fee",
      "Valid for 15 consecutive days",
      "100% anonymous identity guarantee",
    ],
  },
  {
    id: "client-30-days",
    name: "30 Days Speaker Access",
    role: "CLIENT",
    durationDays: 30,
    priceInr: Number(process.env.PLAN_CLIENT_30_INR || 449),
    description: "Most popular: 1 month of priority support access.",
    features: [
      "All 15-day features included",
      "Extended priority matching window",
      "Instant listener connection preference",
      "Valid for 30 consecutive days",
    ],
  },
  {
    id: "client-60-days",
    name: "2 Months Speaker Access",
    role: "CLIENT",
    durationDays: 60,
    priceInr: Number(process.env.PLAN_CLIENT_60_INR || 799),
    description: "Best value for regular conversational support.",
    features: [
      "All 30-day features included",
      "Maximum priority queue placement",
      "Valid for 60 consecutive days",
      "Direct support inquiry access",
    ],
  },

  // Listener Plans
  {
    id: "listener-15-days",
    name: "15 Days Listener Pass",
    role: "LISTENER",
    durationDays: 15,
    priceInr: Number(process.env.PLAN_LISTENER_15_INR || 149),
    description: "Platform listener membership with accelerated payout settlement.",
    features: [
      "Priority match incoming assignment",
      "Accelerated 24-hr earnings settlement",
      "Valid for 15 consecutive days",
      "Full peer listening dashboard",
    ],
  },
  {
    id: "listener-30-days",
    name: "30 Days Listener Pass",
    role: "LISTENER",
    durationDays: 30,
    priceInr: Number(process.env.PLAN_LISTENER_30_INR || 279),
    description: "Full monthly listener pass for active peer companions.",
    features: [
      "All 15-day features included",
      "Higher priority incoming speaker pairing",
      "Reduced payout threshold (₹50 vs ₹100)",
      "Valid for 30 consecutive days",
    ],
  },
  {
    id: "listener-60-days",
    name: "2 Months Listener Pass",
    role: "LISTENER",
    durationDays: 60,
    priceInr: Number(process.env.PLAN_LISTENER_60_INR || 499),
    description: "Best value quarterly pass for dedicated peer listeners.",
    features: [
      "All 30-day features included",
      "Highest listener priority assignment",
      "Dedicated email dispatch for surges",
      "Valid for 60 consecutive days",
    ],
  },
];
