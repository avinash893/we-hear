import { NextResponse } from "next/server";
import { checkRateLimitAsync, getClientIp } from "@/lib/security/rateLimiter";

const SYSTEM_INSTRUCTION = `You are the official AI Guide for "We Hear" (https://wehearapp.online) — a private, anonymous 1-on-1 peer-support video and audio calling platform.

Your mission is to welcome visitors, clearly explain what We Hear can do, and help them get started.

Key Information about We Hear:
1. WHAT IS WE HEAR:
   - A safe, judgment-free space to talk to another empathetic human being.
   - Private 30-minute 1-on-1 peer conversations directly in the web browser.
   - Designed for people feeling stressed, overwhelmed, lonely, or who just want to vent without family/friends judging them.

2. HOW IT WORKS:
   - To Talk (Speaker): Go to /talk, verify with Google (100% anonymous nickname generated), pay a small fee, and get instantly matched with an available listener for a 30-minute private call.
   - To Listen & Earn (Listener): Go to /listen, toggle availability ON, take incoming calls, and support peers with empathy. Listeners earn ₹10 to ₹15 per completed call, paid via UPI or bank transfer on /earnings.

3. PRICING & REFUNDS:
   - Speakers pay ₹20 INR per 30-minute call in India ($1 USD regional PPP equivalent worldwide).
   - If no listener connects within the matching window, the call fee is 100% automatically refunded.
   - Listeners earn ₹10 to ₹15 per completed call.

4. PRIVACY & ANONYMITY (100% GUARANTEED):
   - Every user gets a randomly assigned anonymous nickname and avatar (e.g. "Calm River", "Kind Pine").
   - Real name, email, and phone number are NEVER revealed to peers.
   - Built on peer-to-peer WebRTC: calls are encrypted and ZERO audio or video is ever recorded or stored on any server.

5. SAFETY & CRISIS DISCLAIMER:
   - We Hear provides peer emotional support, NOT medical diagnosis, therapy, or psychiatric care.
   - In-call safety: users can mute, turn off camera, report abusive behavior, or block users anytime.
   - If someone mentions severe depression or self-harm, gently encourage them to contact emergency crisis hotlines:
     * India: KIRAN Mental Health Helpline at 1800-599-0019, Vandrevala Foundation at 9999-666-555
     * USA: Dial 988 Suicide & Crisis Lifeline
     * UK: Call 111 or Samaritans at 116 123

Tone & Formatting:
- Warm, empathetic, respectful, and concise.
- Use clean markdown with bullet points for readability.
- Suggest helpful next actions with relative links like [Start Talking](/talk), [Become a Listener](/listen), [View Pricing](/pricing), or [Safety Guidelines](/safety).`;

interface ChatMessage {
  role: "user" | "model";
  text: string;
}

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);

    // Rate Limiting: 8 requests per minute per IP via Redis / resilient memory
    const limit = await checkRateLimitAsync(ip, "chat_ai", 8, 60);
    if (!limit.allowed) {
      return NextResponse.json(
        {
          error: `Rate limit reached. Please wait ${limit.resetSeconds}s before sending another message.`,
          resetSeconds: limit.resetSeconds,
        },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body.message !== "string") {
      return NextResponse.json({ error: "Invalid message payload" }, { status: 400 });
    }

    const message = body.message.trim();
    if (!message || message.length > 500) {
      return NextResponse.json(
        { error: "Message must be between 1 and 500 characters" },
        { status: 400 }
      );
    }

    const history: ChatMessage[] = Array.isArray(body.history)
      ? body.history.slice(-6).filter((h: any) =>
          h && (h.role === "user" || h.role === "model") && typeof h.text === "string"
        )
      : [];

    const apiKey = process.env.GEMINI_API_KEY;

    // If Gemini key is available, call the Gemini API
    if (apiKey) {
      const contents = [
        ...history.map((h) => ({
          role: h.role,
          parts: [{ text: h.text }],
        })),
        {
          role: "user",
          parts: [{ text: message }],
        },
      ];

      const modelsToTry = ["gemini-3.5-flash-lite", "gemini-3.5-flash"];
      let lastError: any = null;

      for (const model of modelsToTry) {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 12000);

          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              signal: controller.signal,
              body: JSON.stringify({
                systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
                contents,
                generationConfig: {
                  temperature: 0.7,
                  maxOutputTokens: 600,
                  topP: 0.95,
                },
              }),
            }
          );

          clearTimeout(timeout);

          if (response.ok) {
            const data = await response.json();
            const replyText =
              data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
            if (replyText) {
              return NextResponse.json({ reply: replyText });
            }
          } else {
            const errBody = await response.text();
            lastError = errBody;
          }
        } catch (err: any) {
          lastError = err?.message || err;
        }
      }

      console.warn("Gemini API call failed or timed out, using fallback answer:", lastError);
    }

    // Local intelligent fallback response if Gemini key is missing or endpoint is unreachable
    const fallbackReply = generateFallbackReply(message);
    return NextResponse.json({ reply: fallbackReply });
  } catch (error: any) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Something went wrong while processing your message." },
      { status: 500 }
    );
  }
}

/**
 * Intelligent local fallback so users always get clear answers about We Hear
 */
function generateFallbackReply(query: string): string {
  const q = query.toLowerCase();

  if (q.includes("earn") || q.includes("money") || q.includes("payout") || q.includes("listen")) {
    return `### How to Earn by Listening on We Hear
- **Earn per Call**: Listeners earn **₹10 to ₹15** per completed 30-minute peer call.
- **Easy Sign-up**: Go to [Become a Listener](/listen) and switch your availability toggle ON.
- **Direct Payouts**: Request instant payouts via UPI or bank transfer in your [Earnings Dashboard](/earnings).
- **Flexible**: Choose when you want to be online and available.`;
  }

  if (q.includes("price") || q.includes("cost") || q.includes("fee") || q.includes("pay") || q.includes("charge")) {
    return `### We Hear Pricing
- **Speaker Fee**: Only **₹20 INR** per 30-minute call in India ($1 USD regional PPP equivalent worldwide).
- **Automatic Refund**: If an available listener doesn't accept within the timeout, your fee is 100% refunded automatically.
- **No Subscriptions**: Pay only when you choose to connect. Learn more on our [Pricing Page](/pricing).`;
  }

  if (q.includes("anonymous") || q.includes("privacy") || q.includes("safe") || q.includes("record")) {
    return `### 100% Anonymity & Privacy
- **Random Nicknames**: You are assigned a randomly generated nickname (like *Calm River*) and avatar. Your real name, email, and phone are never revealed.
- **Zero Recordings**: Calls run on encrypted peer-to-peer WebRTC. No audio or video is ever recorded or saved.
- **Safety Controls**: In every call, you can mute your mic, turn off your camera, report bad behavior, or end the room at any second. See [Safety Guidelines](/safety).`;
  }

  return `### Welcome to We Hear! 👋
We Hear is a safe, 100% anonymous 1-on-1 peer support audio/video platform.

- **Need someone to talk to?** Connect to an empathetic listener for 30 minutes for just ₹20 ➔ [Start Talking](/talk)
- **Want to earn by listening?** Make ₹10–₹15 per completed conversation ➔ [Become a Listener](/listen)
- **Your Privacy**: Calls are strictly encrypted, anonymous, and never recorded.

Feel free to ask me anything about how calls work, pricing, or listener earnings!`;
}
