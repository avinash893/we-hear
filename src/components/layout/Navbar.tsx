"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import { Menu, X, Shield, User, HeartHandshake, Headphones, Wallet, LogOut } from "lucide-react";

export default function Navbar() {
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-40 bg-surface/90 backdrop-blur-md border-b border-border transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Tagline */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 text-primary-900 font-semibold tracking-tight text-lg">
              <img src="/favicon.svg" alt="We Hear Logo" className="w-8 h-8 rounded-xl shadow-xs shrink-0" />
              <span>We Hear</span>
            </Link>
            <span className="hidden md:inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 border border-primary-200">
              Anonymous Peer Support
            </span>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-6 text-sm text-slate-600">
            {session ? (
              <>
                <Link href="/talk" className="hover:text-slate-900 transition-colors flex items-center gap-1.5 font-medium">
                  <HeartHandshake className="w-4 h-4 text-primary-600" />
                  <span>Talk</span>
                </Link>
                <Link href="/listen" className="hover:text-slate-900 transition-colors flex items-center gap-1.5 font-medium">
                  <Headphones className="w-4 h-4 text-primary-600" />
                  <span>Listen</span>
                </Link>
                <Link href="/earnings" className="hover:text-slate-900 transition-colors flex items-center gap-1.5 font-medium">
                  <Wallet className="w-4 h-4 text-primary-600" />
                  <span>Earnings</span>
                </Link>
                <Link href="/pricing" className="hover:text-slate-900 transition-colors">
                  Plans
                </Link>
                <Link href="/safety" className="hover:text-slate-900 transition-colors">
                  Safety
                </Link>
              </>
            ) : (
              <>
                <Link href="/#how-it-works" className="hover:text-slate-900 transition-colors">
                  How it works
                </Link>
                <Link href="/safety" className="hover:text-slate-900 transition-colors">
                  Safety
                </Link>
                <Link href="/pricing" className="hover:text-slate-900 transition-colors">
                  Pricing
                </Link>
              </>
            )}
          </div>

          {/* Right Action / Auth */}
          <div className="hidden md:flex items-center gap-4">
            {session ? (
              <div className="flex items-center gap-3">
                <Link
                  href="/account"
                  className="flex items-center gap-2 py-1.5 px-3 rounded-lg bg-surface-muted border border-border text-xs font-medium text-slate-700 hover:bg-warm-100 transition-colors"
                  title="Your Anonymous Profile"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{(session.user as any)?.nickname || "Anonymous"}</span>
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/auth/signin"
                  className="text-sm font-medium text-slate-700 hover:text-slate-900 px-3 py-1.5"
                >
                  Sign in
                </Link>
                <Link
                  href="/auth/signin"
                  className="text-sm font-medium text-white bg-primary-700 hover:bg-primary-800 px-4 py-2 rounded-lg transition-colors shadow-sm"
                >
                  Get started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-warm-100 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-border bg-surface px-4 pt-3 pb-5 space-y-3">
          {session ? (
            <>
              <div className="py-2 px-3 rounded-lg bg-surface-muted border border-border text-xs font-medium text-slate-700 flex items-center justify-between">
                <span>Signed in anonymously as</span>
                <span className="font-semibold text-primary-800">{(session.user as any)?.nickname}</span>
              </div>
              <Link
                href="/talk"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-base font-medium text-slate-700"
              >
                I want to talk
              </Link>
              <Link
                href="/listen"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-base font-medium text-slate-700"
              >
                I want to listen
              </Link>
              <Link
                href="/earnings"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-base font-medium text-slate-700"
              >
                Earnings
              </Link>
              <Link
                href="/account"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-base font-medium text-slate-700"
              >
                Account & Identity
              </Link>
              <Link
                href="/safety"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-base font-medium text-slate-700"
              >
                Safety & Emergency
              </Link>
              <div className="pt-2 border-t border-border">
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="w-full text-left py-2 text-sm text-red-600 font-medium"
                >
                  Sign out
                </button>
              </div>
            </>
          ) : (
            <>
              <Link
                href="/#how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-base font-medium text-slate-700"
              >
                How it works
              </Link>
              <Link
                href="/safety"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-base font-medium text-slate-700"
              >
                Safety
              </Link>
              <Link
                href="/pricing"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-base font-medium text-slate-700"
              >
                Pricing
              </Link>
              <div className="pt-3 border-t border-border flex flex-col gap-2">
                <Link
                  href="/auth/signin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2.5 text-center text-sm font-medium rounded-lg border border-border text-slate-700"
                >
                  Sign in
                </Link>
                <Link
                  href="/auth/signin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2.5 text-center text-sm font-medium rounded-lg bg-primary-700 text-white"
                >
                  Get started
                </Link>
              </div>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
