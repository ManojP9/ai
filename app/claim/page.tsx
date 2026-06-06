"use client";

import { useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";

export default function ClaimPage() {
  const [form, setForm] = useState({
    restaurant_name: "",
    owner_name: "",
    email: "",
    phone: "",
    address: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  function set(k: keyof typeof form, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.restaurant_name || !form.owner_name || !form.email) {
      toast.error("Please fill in required fields");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) setDone(true);
      else toast.error("Submission failed. Try again.");
    } catch {
      toast.error("Network error. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="relative min-h-screen bg-[#07070f] overflow-x-hidden">
      <div className="orb w-[500px] h-[500px] bg-emerald-600/10 -top-40 -right-40" />
      <div className="orb w-[400px] h-[400px] bg-orange-600/10 bottom-20 -left-20" />

      <div className="relative z-10 max-w-lg mx-auto px-4 pt-12 pb-24">
        <div className="flex items-center justify-between mb-8 fade-up">
          <Link href="/" className="chip text-slate-400 text-sm px-4 py-1.5 rounded-full font-medium hover:text-slate-200 transition-colors">
            ← 3C Foods
          </Link>
        </div>

        <div className="mb-8 fade-up" style={{ animationDelay: "0.04s" }}>
          <h1 className="text-4xl font-black tracking-tight gradient-text mb-1">Claim Your Restaurant</h1>
          <p className="text-slate-500 text-sm">Get featured on 3C Foods and reach thousands of hungry users</p>
        </div>

        {done ? (
          <div className="glass rounded-3xl p-10 text-center fade-up">
            <span className="text-6xl block mb-4">🎉</span>
            <h2 className="text-white font-bold text-2xl mb-2">Claim Submitted!</h2>
            <p className="text-slate-500 text-sm mb-8">We&apos;ll review your request and get back to you within 48 hours at {form.email}.</p>
            <Link href="/" className="btn-find text-white font-bold px-8 py-3 rounded-2xl inline-block">
              Back to 3C Foods
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 fade-up" style={{ animationDelay: "0.08s" }}>
            {/* Benefits */}
            <div className="glass rounded-2xl p-5 mb-2">
              <div className="grid grid-cols-3 gap-3 text-center">
                {[
                  { icon: "🚀", label: "Get discovered" },
                  { icon: "📊", label: "See analytics" },
                  { icon: "💰", label: "Drive orders" },
                ].map((b) => (
                  <div key={b.label}>
                    <span className="text-2xl block mb-1">{b.icon}</span>
                    <p className="text-slate-400 text-xs">{b.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass rounded-2xl p-5 space-y-4">
              <Field label="Restaurant Name *" value={form.restaurant_name} onChange={(v) => set("restaurant_name", v)} placeholder="e.g. Spice Garden" />
              <Field label="Your Name *" value={form.owner_name} onChange={(v) => set("owner_name", v)} placeholder="Owner or manager name" />
              <Field label="Email *" type="email" value={form.email} onChange={(v) => set("email", v)} placeholder="you@restaurant.com" />
              <Field label="Phone" value={form.phone} onChange={(v) => set("phone", v)} placeholder="+1 (555) 000-0000" />
              <Field label="Address" value={form.address} onChange={(v) => set("address", v)} placeholder="123 Main St, City, State" />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-find text-white font-bold py-4 rounded-2xl w-full text-base disabled:opacity-60"
            >
              {submitting ? "Submitting…" : "Submit Claim →"}
            </button>

            <p className="text-center text-slate-700 text-xs">
              Free to claim · No credit card required
            </p>
          </form>
        )}
      </div>
    </main>
  );
}

function Field({
  label, value, onChange, placeholder, type = "text",
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string; type?: string;
}) {
  return (
    <div>
      <label className="text-slate-400 text-xs font-semibold block mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="search-input glass w-full rounded-xl px-4 py-3 text-white text-sm placeholder-slate-600 outline-none"
      />
    </div>
  );
}
