"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  MessageSquare,
  X,
  Send,
  Loader2,
  Sparkles,
  RotateCcw,
  Bot,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

interface Message {
  id: string;
  role: "user" | "model";
  text: string;
}

const QUICK_PROMPTS = [
  "What is We Hear & how does it work?",
  "How much does a 30-min call cost?",
  "How can I earn money as a listener?",
  "Is my identity 100% anonymous?",
];

export default function ChatbotWidget() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [rateLimitTimer, setRateLimitTimer] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "model",
      text: "Hello! 👋 I'm your **We Hear AI Guide**.\n\nAsk me anything about how anonymous 1-on-1 calls work, our ₹20 pricing, or how you can earn money by listening to peers!",
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Hide completely when inside an active video call room
  const isInCall = pathname?.startsWith("/call/");

  // Auto-scroll on new message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, loading]);

  // Handle rate limit countdown timer
  useEffect(() => {
    if (rateLimitTimer === null || rateLimitTimer <= 0) return;
    const interval = setInterval(() => {
      setRateLimitTimer((prev) => (prev && prev > 1 ? prev - 1 : null));
    }, 1000);
    return () => clearInterval(interval);
  }, [rateLimitTimer]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  if (isInCall) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || loading || rateLimitTimer !== null) return;

    const userMessage: Message = {
      id: `usr_${Date.now()}`,
      role: "user",
      text: query,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      // Build previous turns history (excluding initial greeting)
      const history = messages
        .filter((m) => m.id !== "welcome")
        .slice(-6)
        .map((m) => ({ role: m.role, text: m.text }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: query, history }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 429) {
          setRateLimitTimer(data.resetSeconds || 60);
          setMessages((prev) => [
            ...prev,
            {
              id: `err_${Date.now()}`,
              role: "model",
              text: `⚠️ **Rate Limit**: Too many requests. Please wait ${data.resetSeconds || 60} seconds before asking again.`,
            },
          ]);
        } else {
          throw new Error(data.error || "Failed to get response");
        }
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `ai_${Date.now()}`,
            role: "model",
            text: data.reply || "Sorry, I couldn't process that response.",
          },
        ]);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: "model",
          text: "I had trouble connecting to the AI service. Feel free to try again or browse our [Pricing](/pricing) and [Safety](/safety) pages.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setMessages([
      {
        id: "welcome",
        role: "model",
        text: "Chat cleared! How else can I help you explore We Hear today?",
      },
    ]);
  };

  /**
   * Lightweight markdown text formatter supporting bold, links, headers, and bullet lists
   */
  const formatText = (content: string) => {
    const lines = content.split("\n");
    return lines.map((line, lineIdx) => {
      let trimmed = line.trim();

      // Heading 3
      if (trimmed.startsWith("### ")) {
        return (
          <h4 key={lineIdx} className="font-semibold text-slate-900 mt-2 mb-1 text-xs">
            {renderInline(trimmed.substring(4))}
          </h4>
        );
      }

      // Bullet Point
      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        return (
          <div key={lineIdx} className="flex items-start gap-1.5 my-0.5 text-xs">
            <span className="text-primary-700 font-bold leading-relaxed">•</span>
            <span className="flex-1">{renderInline(trimmed.substring(2))}</span>
          </div>
        );
      }

      if (!trimmed) {
        return <div key={lineIdx} className="h-1.5" />;
      }

      return (
        <p key={lineIdx} className="my-0.5 text-xs leading-relaxed">
          {renderInline(line)}
        </p>
      );
    });
  };

  /**
   * Renders bold text and markdown links
   */
  const renderInline = (str: string) => {
    // Regex matches [label](url) or **bold**
    const parts: (string | JSX.Element)[] = [];
    const regex = /\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(str)) !== null) {
      if (match.index > lastIndex) {
        parts.push(str.substring(lastIndex, match.index));
      }

      if (match[1] && match[2]) {
        // Link [label](url)
        const isExternal = match[2].startsWith("http");
        parts.push(
          <Link
            key={match.index}
            href={match[2]}
            target={isExternal ? "_blank" : undefined}
            className="text-primary-800 underline font-medium hover:text-primary-950 inline-flex items-center gap-0.5"
          >
            {match[1]}
            {isExternal && <ExternalLink className="w-2.5 h-2.5 inline" />}
          </Link>
        );
      } else if (match[3]) {
        // Bold **text**
        parts.push(
          <strong key={match.index} className="font-semibold text-slate-900">
            {match[3]}
          </strong>
        );
      }

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < str.length) {
      parts.push(str.substring(lastIndex));
    }

    return parts.length > 0 ? parts : str;
  };

  return (
    <>
      {/* Floating Launcher Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-primary-700 hover:bg-primary-800 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 group active:scale-95"
          aria-label="Open We Hear AI Guide"
        >
          <div className="relative">
            <Bot className="w-5 h-5 text-white" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 border-2 border-primary-700 rounded-full animate-pulse" />
          </div>
          <span className="text-xs font-medium tracking-wide pr-1">Ask AI</span>
          <Sparkles className="w-3.5 h-3.5 text-amber-300 opacity-90 group-hover:rotate-12 transition-transform" />
        </button>
      )}

      {/* Chat Window Drawer / Card */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 z-50 w-[92vw] sm:w-[390px] h-[550px] max-h-[88vh] bg-surface border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="px-4 py-3 bg-primary-800 text-white flex items-center justify-between border-b border-primary-900/40">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-primary-700/80 border border-primary-600 flex items-center justify-center">
                <Bot className="w-4 h-4 text-emerald-300" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 font-medium text-xs">
                  <span>We Hear Assistant</span>
                  <span className="text-[10px] bg-primary-700 text-primary-100 px-1.5 py-0.2 rounded font-normal">
                    Gemini AI
                  </span>
                </div>
                <div className="text-[10px] text-primary-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Online • Ask about calls & earnings
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleReset}
                title="Restart chat"
                className="p-1.5 text-primary-200 hover:text-white hover:bg-primary-700/60 rounded-lg transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Close chat"
                className="p-1.5 text-primary-200 hover:text-white hover:bg-primary-700/60 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-surface-muted/30">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs shadow-xs ${
                    m.role === "user"
                      ? "bg-primary-700 text-white rounded-br-xs"
                      : "bg-surface border border-border text-slate-800 rounded-bl-xs"
                  }`}
                >
                  {formatText(m.text)}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-surface border border-border rounded-2xl rounded-bl-xs px-3.5 py-2.5 text-xs text-slate-500 flex items-center gap-2 shadow-xs">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-primary-700" />
                  <span>Thinking...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts (visible when 1 or 2 messages) */}
          {messages.length <= 3 && !loading && (
            <div className="px-3 py-2 bg-surface border-t border-border/60">
              <div className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 mb-1.5 px-1">
                Suggested Topics:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_PROMPTS.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(prompt)}
                    className="text-[11px] text-slate-600 hover:text-primary-800 bg-surface-muted hover:bg-warm-100/80 border border-border rounded-lg px-2.5 py-1 text-left transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="p-3 bg-surface border-t border-border">
            {rateLimitTimer !== null ? (
              <div className="py-2 text-center text-xs text-amber-700 bg-amber-50 rounded-xl border border-amber-200">
                Rate limited. Please wait {rateLimitTimer}s...
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  maxLength={500}
                  disabled={loading}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask how calls, fees, or earning works..."
                  className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-border bg-surface-muted focus:bg-surface focus:outline-hidden focus:ring-1 focus:ring-primary-700 text-slate-800 placeholder:text-slate-400 transition-all"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="p-2.5 rounded-xl bg-primary-700 hover:bg-primary-800 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs active:scale-95"
                  title="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            )}

            <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 px-1">
              <span>Peer support platform info • 18+ only</span>
              <span>{input.length}/500</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
