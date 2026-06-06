"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip,
} from "recharts";

interface Metrics {
  searches_30d: number;
  mau: number;
  total_favorites: number;
  total_searches: number;
  premium_users: number;
  wow_growth: number | null;
  this_week_users: number;
  last_week_users: number;
  weekly_trend: { week: string; users: number; searches: number }[];
}

const YC_TARGETS = { mau: 500, premium_users: 20 };
const PRICE = 9.99;

function pct(val: number, target: number) {
  return Math.min(100, Math.round((val / target) * 100));
}

function Stat({
  icon, label, value, sub, target, color = "violet",
}: {
  icon: string; label: string; value: string | number; sub?: string;
  target?: number; color?: "violet" | "emerald" | "orange" | "pink";
}) {
  const num = typeof value === "number" ? value : null;
  const p = num !== null && target ? pct(num, target) : null;
  const barColors: Record<string, string> = {
    violet: "from-violet-500 to-pink-500",
    emerald: "from-emerald-500 to-teal-400",
    orange: "from-orange-500 to-pink-500",
    pink: "from-pink-500 to-violet-500",
  };
  return (
    <div className="glass rounded-2xl p-5">
      <span className="text-2xl block mb-2">{icon}</span>
      <p className="text-2xl sm:text-3xl font-black text-white leading-none mb-1">{value}</p>
      <p className="text-slate-500 text-sm">{label}</p>
      {sub && <p className="text-slate-700 text-xs mt-0.5">{sub}</p>}
      {p !== null && (
        <div className="mt-3">
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div className={`h-full rounded-full bg-gradient-to-r ${barColors[color]} transition-all duration-700`} style={{ width: `${p}%` }} />
          </div>
          <p className="text-xs text-slate-600 mt-1">{p}% to target ({target?.toLocaleString()})</p>
        </div>
      )}
    </div>
  );
}

function ChartTip({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0f0f1a] border border-white/10 rounded-xl px-4 py-3 text-xs shadow-xl">
      <p className="text-slate-400 mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex gap-3">
          <span className="text-slate-400 capitalize">{p.name}</span>
          <span className="text-white font-bold">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

function WoWBadge({ wow }: { wow: number | null }) {
  if (wow === null) return <span className="text-xs text-slate-600">No prior week data</span>;
  const positive = wow >= 0;
  return (
    <span className={`text-sm font-bold px-2.5 py-1 rounded-full border ${
      positive
        ? wow >= 10 ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" : "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
        : "bg-red-500/20 text-red-300 border-red-500/30"
    }`}>
      {positive ? "+" : ""}{wow}% WoW {wow >= 10 ? "🎯" : ""}
    </span>
  );
}

export default function MetricsPage() {
  const [m, setM] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/metrics")
      .then((r) => r.json())
      .then(setM)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const mrr = m ? m.premium_users * PRICE : 0;
  const mrrPct = pct(mrr, 500);

  const trendData = (m?.weekly_trend ?? []).map((w) => ({
    week: new Date(w.week).toLocaleDateString("en", { month: "short", day: "numeric" }),
    users: w.users,
    searches: w.searches,
  }));

  return (
    <main className="relative min-h-screen bg-[#07070f] overflow-x-hidden">
      <div className="orb w-[500px] h-[500px] bg-pink-600/10 -top-40 -right-40" />
      <div className="orb w-[400px] h-[400px] bg-violet-600/10 bottom-20 -left-20" />

      <div className="relative z-10 max-w-2xl mx-auto px-4 pt-12 pb-24">
        {/* Nav */}
        <div className="flex items-center gap-3 mb-8 fade-up">
          <Link href="/" className="chip text-slate-400 text-sm px-4 py-1.5 rounded-full font-medium hover:text-slate-200 transition-colors">
            ← 3C Foods
          </Link>
          <Link href="/progress" className="chip text-slate-400 text-sm px-4 py-1.5 rounded-full font-medium hover:text-slate-200 transition-colors">
            📊 Roadmap
          </Link>
          <Link href="/premium" className="btn-find text-white text-xs font-bold px-4 py-1.5 rounded-full ml-auto">
            ⭐ Premium
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8 fade-up" style={{ animationDelay: "0.04s" }}>
          <div className="flex items-center gap-3 mb-1 flex-wrap">
            <h1 className="text-4xl font-black tracking-tight gradient-text">Live Metrics</h1>
            <span className="text-xs px-2.5 py-1 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30 font-semibold">
              🩷 Phase 5
            </span>
            {m && <WoWBadge wow={m.wow_growth} />}
          </div>
          <p className="text-slate-500 text-sm">Real-time traction · YC application targets</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="glass rounded-2xl h-32 animate-pulse" />)}
          </div>
        ) : !m ? (
          <div className="glass rounded-3xl p-10 text-center">
            <span className="text-4xl block mb-4">🗄️</span>
            <p className="text-white font-semibold">Database not connected</p>
          </div>
        ) : (
          <>
            {/* Stat grid */}
            <div className="grid grid-cols-2 gap-3 mb-5 fade-up" style={{ animationDelay: "0.08s" }}>
              <Stat icon="👥" label="Monthly Active Users" value={m.mau} target={YC_TARGETS.mau} color="violet" />
              <Stat icon="🔍" label="Searches (30d)" value={m.searches_30d.toLocaleString()} sub={`${m.total_searches.toLocaleString()} all-time`} />
              <Stat icon="⭐" label="Premium Users" value={m.premium_users} target={YC_TARGETS.premium_users} color="orange" />
              <div className="glass rounded-2xl p-5">
                <span className="text-2xl block mb-2">💰</span>
                <p className="text-2xl sm:text-3xl font-black text-white leading-none mb-1">${mrr.toFixed(0)}</p>
                <p className="text-slate-500 text-sm">Est. MRR</p>
                <p className="text-slate-700 text-xs mt-0.5">at ${PRICE}/mo per user</p>
                <div className="mt-3">
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all`} style={{ width: `${mrrPct}%` }} />
                  </div>
                  <p className="text-xs text-slate-600 mt-1">{mrrPct}% to $500 MRR target</p>
                </div>
              </div>
              <Stat icon="❤️" label="Total Favorites" value={m.total_favorites.toLocaleString()} />
              <div className="glass rounded-2xl p-5">
                <span className="text-2xl block mb-2">📅</span>
                <p className="text-2xl sm:text-3xl font-black text-white leading-none mb-1">{m.this_week_users}</p>
                <p className="text-slate-500 text-sm">This week&apos;s users</p>
                <p className="text-slate-700 text-xs mt-0.5">{m.last_week_users} last week</p>
              </div>
            </div>

            {/* Growth chart */}
            {trendData.length > 1 && (
              <div className="glass rounded-2xl p-5 mb-5 fade-up" style={{ animationDelay: "0.12s" }}>
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-4">Weekly Growth Trend</p>
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData} margin={{ top: 0, right: 0, bottom: 0, left: -24 }}>
                      <defs>
                        <linearGradient id="gUsers" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gSearches" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#fb923c" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#fb923c" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                      <XAxis dataKey="week" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip content={<ChartTip />} />
                      <Area type="monotone" dataKey="users" stroke="#a78bfa" strokeWidth={2} fill="url(#gUsers)" />
                      <Area type="monotone" dataKey="searches" stroke="#fb923c" strokeWidth={2} fill="url(#gSearches)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-violet-400 rounded-full inline-block" /><span className="text-slate-500 text-xs">Users</span></div>
                  <div className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-orange-400 rounded-full inline-block" /><span className="text-slate-500 text-xs">Searches</span></div>
                </div>
              </div>
            )}

            {/* YC Application checklist */}
            <div className="glass rounded-2xl p-5 fade-up" style={{ animationDelay: "0.16s" }}>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-4">🎯 YC Application Checklist</p>
              <div className="space-y-3">
                {[
                  { label: "500+ MAU", done: m.mau >= 500, value: `${m.mau} / 500`, pct: pct(m.mau, 500) },
                  { label: "10%+ WoW growth", done: (m.wow_growth ?? 0) >= 10, value: m.wow_growth !== null ? `${m.wow_growth >= 0 ? "+" : ""}${m.wow_growth}%` : "No data yet", pct: m.wow_growth !== null ? pct(m.wow_growth, 10) : 0 },
                  { label: "$500+ MRR", done: mrr >= 500, value: `$${mrr.toFixed(0)} / $500`, pct: mrrPct },
                  { label: "Clear retention curve", done: trendData.length >= 4, value: trendData.length >= 4 ? "4+ weeks data ✓" : `${trendData.length} week(s) so far`, pct: pct(trendData.length, 4) },
                  { label: "1-min demo video", done: false, value: "Record the full flow", pct: 0 },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm ${item.done ? "text-emerald-400" : "text-slate-600"}`}>{item.done ? "✓" : "○"}</span>
                        <span className={`text-sm ${item.done ? "line-through text-slate-500" : "text-slate-300"}`}>{item.label}</span>
                      </div>
                      <span className="text-xs text-slate-600">{item.value}</span>
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden ml-5">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${item.done ? "bg-emerald-500" : "bg-gradient-to-r from-violet-500 to-pink-500"}`}
                        style={{ width: `${item.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Setup guide for missing items */}
            {(!process.env.NEXT_PUBLIC_POSTHOG_KEY) && (
              <div className="mt-4 glass rounded-2xl p-4 border border-yellow-500/20 fade-up" style={{ animationDelay: "0.20s" }}>
                <p className="text-yellow-300 text-xs font-semibold mb-2">⚡ Unlock more metrics</p>
                <ul className="space-y-1 text-xs text-slate-500">
                  <li>· Add <code className="text-orange-300">NEXT_PUBLIC_POSTHOG_KEY</code> → funnel analytics, session replay</li>
                  <li>· Add <code className="text-orange-300">STRIPE_SECRET_KEY</code> + <code className="text-orange-300">STRIPE_PRICE_ID</code> → real MRR</li>
                </ul>
              </div>
            )}
          </>
        )}

        <p className="text-center text-slate-700 text-xs mt-16">3C Foods · Live Metrics · Phase 5</p>
      </div>
    </main>
  );
}
