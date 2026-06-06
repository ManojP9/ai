"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Metrics {
  searches_30d: number;
  mau: number;
  total_favorites: number;
  total_searches: number;
  premium_users: number;
}

const YC_TARGETS = {
  mau: 500,
  premium_users: 20,
};

function StatCard({
  icon, label, value, target, suffix = "",
}: {
  icon: string; label: string; value: number; target?: number; suffix?: string;
}) {
  const pct = target ? Math.min(100, Math.round((value / target) * 100)) : null;
  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-start justify-between mb-3">
        <span className="text-2xl">{icon}</span>
        {target && (
          <span className="text-xs text-slate-600 font-medium">
            Target: {target.toLocaleString()}{suffix}
          </span>
        )}
      </div>
      <p className="text-3xl font-black text-white mb-0.5">
        {value.toLocaleString()}{suffix}
      </p>
      <p className="text-slate-500 text-sm">{label}</p>
      {pct !== null && (
        <div className="mt-3">
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${pct >= 100 ? "bg-emerald-500" : "bg-gradient-to-r from-violet-500 to-pink-500"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-xs text-slate-600 mt-1">{pct}% to YC target</p>
        </div>
      )}
    </div>
  );
}

export default function MetricsPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/metrics")
      .then((r) => r.json())
      .then(setMetrics)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="relative min-h-screen bg-[#07070f] overflow-x-hidden">
      <div className="orb w-[500px] h-[500px] bg-pink-600/10 -top-40 -right-40" />
      <div className="orb w-[400px] h-[400px] bg-violet-600/10 bottom-20 -left-20" />

      <div className="relative z-10 max-w-lg mx-auto px-4 pt-12 pb-24">
        <div className="flex items-center gap-3 mb-8 fade-up">
          <Link href="/" className="chip text-slate-400 text-sm px-4 py-1.5 rounded-full font-medium hover:text-slate-200 transition-colors">
            ← 3C Foods
          </Link>
          <Link href="/progress" className="chip text-slate-400 text-sm px-4 py-1.5 rounded-full font-medium hover:text-slate-200 transition-colors">
            📊 Progress
          </Link>
        </div>

        <div className="mb-8 fade-up" style={{ animationDelay: "0.04s" }}>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-4xl font-black tracking-tight gradient-text">Live Metrics</h1>
            <span className="text-xs px-2.5 py-1 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30 font-semibold">
              🩷 YC Ready
            </span>
          </div>
          <p className="text-slate-500 text-sm">Real-time traction numbers for the application</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="glass rounded-2xl h-32 animate-pulse" />
            ))}
          </div>
        ) : !metrics ? (
          <div className="glass rounded-3xl p-10 text-center">
            <span className="text-4xl block mb-4">🗄️</span>
            <p className="text-white font-semibold">Database not connected</p>
            <p className="text-slate-500 text-sm mt-1">Add POSTGRES_URL to Vercel env vars</p>
          </div>
        ) : (
          <>
            {/* YC target callout */}
            <div className="glass rounded-2xl p-4 mb-5 border border-pink-500/20 fade-up" style={{ animationDelay: "0.05s" }}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-pink-400 text-lg">🎯</span>
                <p className="text-white font-semibold text-sm">YC Application Targets</p>
              </div>
              <p className="text-slate-500 text-xs">500+ MAU · 10%+ WoW growth · $500+ MRR · Clear retention curve</p>
            </div>

            <div className="grid grid-cols-2 gap-3 fade-up" style={{ animationDelay: "0.08s" }}>
              <StatCard icon="👥" label="Monthly Active Users" value={metrics.mau} target={YC_TARGETS.mau} />
              <StatCard icon="🔍" label="Searches (30d)" value={metrics.searches_30d} />
              <StatCard icon="❤️" label="Total Favorites" value={metrics.total_favorites} />
              <StatCard icon="🔎" label="All-time Searches" value={metrics.total_searches} />
              <StatCard icon="⭐" label="Premium Users" value={metrics.premium_users} target={YC_TARGETS.premium_users} />
              <div className="glass rounded-2xl p-5 flex flex-col justify-between">
                <span className="text-2xl">💰</span>
                <div>
                  <p className="text-3xl font-black text-white mb-0.5">
                    ${(metrics.premium_users * 9.99).toFixed(0)}
                  </p>
                  <p className="text-slate-500 text-sm">Est. MRR</p>
                  <div className="mt-3">
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                        style={{ width: `${Math.min(100, Math.round((metrics.premium_users * 9.99 / 500) * 100))}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      {Math.min(100, Math.round((metrics.premium_users * 9.99 / 500) * 100))}% to $500 MRR target
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 glass rounded-2xl p-5 fade-up" style={{ animationDelay: "0.12s" }}>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-4">Application Checklist</p>
              <div className="space-y-2.5">
                {[
                  { label: "500+ MAU", done: metrics.mau >= 500, value: `${metrics.mau} MAU` },
                  { label: "10%+ WoW growth", done: false, value: "Track in PostHog" },
                  { label: "$500+ MRR", done: metrics.premium_users * 9.99 >= 500, value: `$${(metrics.premium_users * 9.99).toFixed(0)} est.` },
                  { label: "Clear retention curve", done: false, value: "Setup PostHog funnels" },
                  { label: "1-minute demo video", done: false, value: "Record the full flow" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3">
                    <span className={`text-sm shrink-0 ${item.done ? "text-emerald-400" : "text-slate-700"}`}>
                      {item.done ? "✓" : "○"}
                    </span>
                    <span className={`text-sm flex-1 ${item.done ? "text-slate-400 line-through" : "text-slate-300"}`}>
                      {item.label}
                    </span>
                    <span className="text-xs text-slate-600">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        <p className="text-center text-slate-700 text-xs mt-16">3C Foods · Live Metrics · Phase 5</p>
      </div>
    </main>
  );
}
