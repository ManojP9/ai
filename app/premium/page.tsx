"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSession, signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import toast from "react-hot-toast";

const FEATURES_FREE = [
  "10 AI searches per day",
  "Save favorites",
  "Dietary preferences",
  "Shareable food lists",
  "Delivery links",
];

const FEATURES_PREMIUM = [
  "Unlimited AI searches",
  "Location-aware recommendations",
  "Priority Claude responses",
  "Premium badge on profile",
  "Early access to new features",
  "Everything in Free",
];

function PremiumContent() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [stripeReady, setStripeReady] = useState<boolean | null>(null);

  const success = searchParams?.get("success") === "true";
  const cancelled = searchParams?.get("cancelled") === "true";

  useEffect(() => {
    if (success) toast.success("🎉 Welcome to Premium!");
    if (cancelled) toast("Checkout cancelled");
    // Check if Stripe is configured
    fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ origin: window.location.origin }) })
      .then((r) => setStripeReady(r.status !== 503))
      .catch(() => setStripeReady(false));
  }, [success, cancelled]);

  async function handleUpgrade() {
    if (!session) { signIn("google"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ origin: window.location.origin }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error("Checkout unavailable — Stripe not yet configured");
      }
    } catch {
      toast.error("Failed to start checkout");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen bg-[#07070f] overflow-x-hidden">
      <div className="orb w-[600px] h-[600px] bg-violet-600/15 -top-40 -right-40" />
      <div className="orb w-[400px] h-[400px] bg-pink-600/10 bottom-20 -left-20" />

      <div className="relative z-10 max-w-lg mx-auto px-4 pt-12 pb-24">
        <div className="flex items-center justify-between mb-8 fade-up">
          <Link href="/" className="chip text-slate-400 text-sm px-4 py-1.5 rounded-full font-medium hover:text-slate-200 transition-colors">
            ← 3C Foods
          </Link>
        </div>

        {/* Hero */}
        <div className="text-center mb-10 fade-up" style={{ animationDelay: "0.04s" }}>
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl glass text-3xl mb-5 shadow-xl">⭐</div>
          <h1 className="text-4xl font-black tracking-tight gradient-text mb-2">Go Premium</h1>
          <p className="text-slate-400 text-base">Unlimited AI food recommendations, personalised for you</p>
        </div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 fade-up" style={{ animationDelay: "0.08s" }}>
          {/* Free */}
          <div className="glass rounded-2xl p-5">
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-1">Free</p>
            <p className="text-3xl font-black text-white mb-4">$0</p>
            <ul className="space-y-2">
              {FEATURES_FREE.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-slate-400">
                  <span className="text-slate-600">○</span> {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Premium */}
          <div className="rounded-2xl p-5 bg-gradient-to-br from-violet-500/20 to-pink-500/10 border border-violet-500/30 relative overflow-hidden">
            <div className="absolute top-3 right-3 text-xs px-2 py-0.5 rounded-full bg-violet-500/30 text-violet-300 border border-violet-500/30 font-semibold">
              Popular
            </div>
            <p className="text-violet-300 text-xs font-semibold uppercase tracking-widest mb-1">Premium</p>
            <div className="flex items-baseline gap-1 mb-4">
              <p className="text-3xl font-black text-white">$9.99</p>
              <span className="text-slate-500 text-sm">/month</span>
            </div>
            <ul className="space-y-2">
              {FEATURES_PREMIUM.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-slate-200">
                  <span className="text-violet-400">✓</span> {f}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* CTA */}
        <div className="fade-up" style={{ animationDelay: "0.12s" }}>
          {status === "loading" ? (
            <div className="h-14 glass rounded-2xl animate-pulse" />
          ) : (
            <button
              onClick={handleUpgrade}
              disabled={loading}
              className="btn-find text-white font-bold py-4 rounded-2xl w-full text-base disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? "Redirecting to Stripe…" : session ? "Upgrade to Premium →" : "Sign in to Upgrade →"}
            </button>
          )}

          {stripeReady === false && (
            <div className="mt-4 text-center px-4 py-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
              <p className="text-yellow-300 text-xs font-semibold mb-1">Stripe not yet configured</p>
              <p className="text-slate-500 text-xs">Add <code className="text-orange-300">STRIPE_SECRET_KEY</code>, <code className="text-orange-300">STRIPE_PRICE_ID</code>, and <code className="text-orange-300">STRIPE_WEBHOOK_SECRET</code> to Vercel env vars.</p>
            </div>
          )}

          <p className="text-center text-slate-700 text-xs mt-4">
            Cancel anytime · Secure checkout via Stripe
          </p>
        </div>

        {/* FAQ */}
        <div className="mt-10 space-y-3 fade-up" style={{ animationDelay: "0.16s" }}>
          {[
            { q: "What counts as a search?", a: "Each AI-powered food query uses one search. Local fallback results don't count." },
            { q: "Can I cancel anytime?", a: "Yes — cancel from your Stripe billing portal, no questions asked." },
            { q: "Does premium apply to all devices?", a: "Yes — your premium status is tied to your Google account." },
          ].map((item) => (
            <div key={item.q} className="glass rounded-xl p-4">
              <p className="text-white text-sm font-semibold mb-1">{item.q}</p>
              <p className="text-slate-500 text-xs">{item.a}</p>
            </div>
          ))}
        </div>

        <p className="text-center text-slate-700 text-xs mt-16">3C Foods · Premium</p>
      </div>
    </main>
  );
}

export default function PremiumPage() {
  return (
    <Suspense>
      <PremiumContent />
    </Suspense>
  );
}
