"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface LeaderboardEntry {
  query: string;
  count: number;
}

const EMOJIS: Record<string, string> = {
  indian: "🍛", italian: "🍕", mexican: "🌮", japanese: "🍣", chinese: "🥟",
  american: "🍔", thai: "🍜", mediterranean: "🥗", spicy: "🔥", vegetarian: "🥗",
  pizza: "🍕", sushi: "🍣", burger: "🍔", ramen: "🍜", curry: "🍲",
  tacos: "🌮", pasta: "🍝", chicken: "🍗", rice: "🍚", noodles: "🍜",
};

function getEmoji(query: string): string {
  const q = query.toLowerCase();
  for (const [k, e] of Object.entries(EMOJIS)) {
    if (q.includes(k)) return e;
  }
  return "🍽️";
}

const MEDALS = ["🥇", "🥈", "🥉"];

export default function LeaderboardPage() {
  const [board, setBoard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/leaderboard")
      .then((r) => r.json())
      .then((d) => setBoard(d.board ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const max = board[0]?.count ?? 1;

  return (
    <main className="relative min-h-screen bg-[#07070f] overflow-x-hidden">
      <div className="orb w-[500px] h-[500px] bg-yellow-600/10 -top-40 -right-40" />
      <div className="orb w-[400px] h-[400px] bg-orange-600/10 bottom-20 -left-20" />

      <div className="relative z-10 max-w-lg mx-auto px-4 pt-12 pb-24">
        <div className="flex items-center justify-between mb-8 fade-up">
          <Link href="/" className="chip text-slate-400 text-sm px-4 py-1.5 rounded-full font-medium hover:text-slate-200 transition-colors">
            ← 3C Foods
          </Link>
        </div>

        <div className="mb-8 fade-up" style={{ animationDelay: "0.04s" }}>
          <h1 className="text-4xl font-black tracking-tight gradient-text mb-1">🏆 Leaderboard</h1>
          <p className="text-slate-500 text-sm">Most searched cuisines &amp; cravings on 3C Foods</p>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="glass rounded-2xl h-16 animate-pulse" />
            ))}
          </div>
        ) : board.length === 0 ? (
          <div className="glass rounded-3xl p-10 text-center">
            <span className="text-5xl block mb-4">🔍</span>
            <p className="text-white font-semibold mb-1">No searches yet</p>
            <p className="text-slate-500 text-sm">Be the first to search!</p>
            <Link href="/" className="inline-block mt-6 btn-find text-white font-bold px-6 py-3 rounded-2xl text-sm">
              Start searching →
            </Link>
          </div>
        ) : (
          <div className="space-y-2 fade-up" style={{ animationDelay: "0.08s" }}>
            {board.map((entry, i) => (
              <Link
                key={entry.query}
                href={`/?q=${encodeURIComponent(entry.query)}`}
                className="flex items-center gap-4 glass rounded-2xl px-5 py-4 hover:bg-white/5 transition-colors group"
              >
                <span className="text-xl w-8 text-center shrink-0">
                  {i < 3 ? MEDALS[i] : <span className="text-slate-600 text-sm font-bold">#{i + 1}</span>}
                </span>
                <span className="text-2xl shrink-0">{getEmoji(entry.query)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold capitalize truncate group-hover:text-orange-300 transition-colors">
                    {entry.query}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="h-1 bg-white/5 rounded-full flex-1 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-orange-500 to-pink-500 rounded-full"
                        style={{ width: `${Math.round((entry.count / max) * 100)}%` }}
                      />
                    </div>
                    <span className="text-slate-500 text-xs shrink-0">{entry.count} search{entry.count !== 1 ? "es" : ""}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <p className="text-center text-slate-700 text-xs mt-16">3C Foods · Search Leaderboard</p>
      </div>
    </main>
  );
}
