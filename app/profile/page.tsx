"use client";

import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import Link from "next/link";
import toast from "react-hot-toast";

const DIETARY = [
  { value: "none",        label: "No restrictions", emoji: "🍽️" },
  { value: "vegetarian",  label: "Vegetarian",       emoji: "🥗" },
  { value: "vegan",       label: "Vegan",            emoji: "🌱" },
  { value: "halal",       label: "Halal",            emoji: "☪️"  },
  { value: "gluten-free", label: "Gluten-Free",      emoji: "🌾" },
  { value: "keto",        label: "Keto",             emoji: "🥩" },
  { value: "dairy-free",  label: "Dairy-Free",       emoji: "🥛" },
];

const SPICE = [
  { value: "mild",       label: "Mild",       emoji: "🫧" },
  { value: "medium",     label: "Medium",     emoji: "🌶️" },
  { value: "hot",        label: "Hot",        emoji: "🔥" },
  { value: "extra-hot",  label: "Extra Hot",  emoji: "💥" },
];

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const [dietary, setDietary]     = useState("none");
  const [spice, setSpice]         = useState("medium");
  const [allergies, setAllergies] = useState("");
  const [saving, setSaving]       = useState(false);
  const [loaded, setLoaded]       = useState(false);
  const [refCode, setRefCode]     = useState("");
  const [refCount, setRefCount]   = useState(0);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/profile")
      .then((r) => r.json())
      .then(({ profile }) => {
        if (profile) {
          setDietary(profile.dietary ?? "none");
          setSpice(profile.spice_level ?? "medium");
          setAllergies(profile.allergies ?? "");
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
    // Load referral code
    fetch("/api/referral")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d) { setRefCode(d.code); setRefCount(d.count); } })
      .catch(() => {});
  }, [status]);

  async function handleSave() {
    setSaving(true);
    try {
      await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dietary, spice_level: spice, allergies }),
      });
      toast.success("✅ Preferences saved!");
    } catch {
      toast.error("Failed to save. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="relative min-h-screen bg-[#07070f] overflow-x-hidden">
      <div className="orb w-[500px] h-[500px] bg-violet-600/10 -top-40 -right-40" />
      <div className="orb w-[400px] h-[400px] bg-orange-600/10 bottom-20 -left-20" />

      <div className="relative z-10 max-w-lg mx-auto px-4 pt-12 pb-24">
        {/* Nav */}
        <div className="flex items-center justify-between mb-8 fade-up">
          <Link href="/" className="chip text-slate-400 text-sm px-4 py-1.5 rounded-full font-medium hover:text-slate-200 transition-colors">
            ← 3C Foods
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8 fade-up" style={{ animationDelay: "0.04s" }}>
          <h1 className="text-4xl font-black tracking-tight gradient-text mb-1">My Profile</h1>
          <p className="text-slate-500 text-sm">Personalize your food recommendations</p>
        </div>

        {/* Not signed in */}
        {status !== "loading" && !session && (
          <div className="glass rounded-3xl p-10 text-center fade-up" style={{ animationDelay: "0.08s" }}>
            <span className="text-5xl block mb-4">🔒</span>
            <h2 className="text-white font-bold text-xl mb-2">Sign in to save preferences</h2>
            <p className="text-slate-500 text-sm mb-8">Your dietary profile is tied to your account so it works across all devices.</p>
            <button
              onClick={() => signIn("google")}
              className="btn-find text-white font-bold px-8 py-3 rounded-2xl"
            >
              Sign in with Google
            </button>
          </div>
        )}

        {/* Loading */}
        {(status === "loading" || (session && !loaded)) && (
          <div className="space-y-4">
            {[1,2,3].map((i) => (
              <div key={i} className="glass rounded-2xl p-5 animate-pulse h-24" />
            ))}
          </div>
        )}

        {/* Form */}
        {session && loaded && (
          <div className="space-y-6 fade-up" style={{ animationDelay: "0.08s" }}>
            {/* User card */}
            <div className="glass rounded-2xl p-4 flex items-center gap-3">
              {session.user?.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={session.user.image} alt="avatar" className="w-10 h-10 rounded-full ring-2 ring-white/10" />
              )}
              <div>
                <p className="text-white font-semibold text-sm">{session.user?.name}</p>
                <p className="text-slate-500 text-xs">{session.user?.email}</p>
              </div>
            </div>

            {/* Dietary preference */}
            <div className="glass rounded-2xl p-5">
              <h2 className="text-white font-semibold text-sm mb-4">Dietary Preference</h2>
              <div className="grid grid-cols-2 gap-2">
                {DIETARY.map((d) => (
                  <button
                    key={d.value}
                    onClick={() => setDietary(d.value)}
                    className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-medium transition-all text-left
                      ${dietary === d.value
                        ? "bg-orange-500/20 border-orange-500/50 text-orange-300"
                        : "bg-white/3 border-white/8 text-slate-400 hover:border-white/20 hover:text-slate-200"}`}
                  >
                    <span className="text-xl">{d.emoji}</span>
                    <span>{d.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Spice level */}
            <div className="glass rounded-2xl p-5">
              <h2 className="text-white font-semibold text-sm mb-4">Spice Preference</h2>
              <div className="grid grid-cols-2 gap-2">
                {SPICE.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setSpice(s.value)}
                    className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-medium transition-all
                      ${spice === s.value
                        ? "bg-red-500/20 border-red-500/50 text-red-300"
                        : "bg-white/3 border-white/8 text-slate-400 hover:border-white/20 hover:text-slate-200"}`}
                  >
                    <span className="text-xl">{s.emoji}</span>
                    <span>{s.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Allergies */}
            <div className="glass rounded-2xl p-5">
              <h2 className="text-white font-semibold text-sm mb-1">Allergies / Avoid</h2>
              <p className="text-slate-600 text-xs mb-3">e.g. nuts, shellfish, dairy, peanuts</p>
              <input
                type="text"
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
                placeholder="Leave blank if none"
                className="search-input glass w-full rounded-xl px-4 py-3 text-white text-sm placeholder-slate-600 outline-none"
              />
            </div>

            {/* AI note */}
            {dietary !== "none" && (
              <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-violet-500/10 border border-violet-500/20">
                <span className="text-violet-400 text-lg shrink-0">✨</span>
                <p className="text-violet-300 text-xs leading-relaxed">
                  Claude will now tailor every recommendation to your <strong>{dietary}</strong> preference and <strong>{spice}</strong> spice level.
                </p>
              </div>
            )}

            {/* Referral */}
            {refCode && (
              <div className="glass rounded-2xl p-5">
                <h2 className="text-white font-semibold text-sm mb-1">Referral Link</h2>
                <p className="text-slate-600 text-xs mb-3">Share 3C Foods · {refCount} friend{refCount !== 1 ? "s" : ""} joined via your link</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-white/5 text-orange-300 text-xs rounded-lg px-3 py-2 truncate font-mono">
                    {typeof window !== "undefined" ? `${window.location.origin}?ref=${refCode}` : `...?ref=${refCode}`}
                  </code>
                  <button
                    onClick={async () => {
                      const url = `${window.location.origin}?ref=${refCode}`;
                      await navigator.clipboard.writeText(url);
                      toast.success("📋 Copied!");
                    }}
                    className="chip text-slate-400 text-xs px-3 py-2 rounded-lg font-medium shrink-0"
                  >
                    Copy
                  </button>
                </div>
              </div>
            )}

            {/* Save */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-find text-white font-bold py-4 rounded-2xl w-full text-base disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save Preferences"}
            </button>
          </div>
        )}

        <p className="text-center text-slate-700 text-xs mt-16">3C Foods · My Profile</p>
      </div>
    </main>
  );
}
