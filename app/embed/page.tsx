"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

interface Food {
  name: string;
  desc: string;
  emoji: string;
  tag: string;
  img: string;
}

function EmbedWidget() {
  const searchParams = useSearchParams();
  const initialQ = searchParams?.get("q") ?? "";
  const [query, setQuery] = useState(initialQ);
  const [results, setResults] = useState<Food[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialQ) handleSearch(initialQ);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSearch(q: string) {
    if (!q.trim()) return;
    setLoading(true);
    setResults([]);
    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setResults(data.foods ?? []);
      }
    } catch {}
    setLoading(false);
  }

  return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", background: "#07070f", minHeight: "100vh", color: "#fff", padding: "16px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
        <span style={{ fontSize: "20px" }}>🍽️</span>
        <span style={{ fontWeight: 900, fontSize: "16px", background: "linear-gradient(120deg,#fb923c,#f43f5e,#a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          3C Foods
        </span>
      </div>

      {/* Search */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch(query)}
          placeholder="Search cuisine or craving…"
          style={{ flex: 1, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", padding: "10px 14px", color: "#fff", fontSize: "14px", outline: "none" }}
        />
        <button
          onClick={() => handleSearch(query)}
          style={{ background: "linear-gradient(135deg,#fb923c,#f43f5e)", border: "none", borderRadius: "12px", padding: "10px 16px", color: "#fff", fontWeight: 700, fontSize: "14px", cursor: "pointer", whiteSpace: "nowrap" }}
        >
          Find
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: "center", padding: "32px" }}>
          <div style={{ fontSize: "32px", marginBottom: "8px" }}>🤖</div>
          <p style={{ color: "#64748b", fontSize: "14px" }}>Finding top picks…</p>
        </div>
      )}

      {/* Results */}
      {!loading && results.map((food, i) => (
        <a
          key={food.name}
          href={`https://ai-kohl-nine-89.vercel.app/?q=${encodeURIComponent(food.name)}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: "flex", gap: "12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "12px", marginBottom: "8px", textDecoration: "none", color: "inherit" }}
        >
          <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: "10px", width: "48px", height: "48px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", flexShrink: 0 }}>
            {food.emoji}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
              <span style={{ color: "#facc15", fontSize: "10px", fontWeight: 700 }}>#{i + 1}</span>
              <span style={{ fontWeight: 700, fontSize: "14px" }}>{food.name}</span>
            </div>
            <p style={{ color: "#64748b", fontSize: "12px", lineHeight: 1.4, margin: 0 }}>{food.desc}</p>
          </div>
        </a>
      ))}

      {/* Footer */}
      <div style={{ textAlign: "center", marginTop: "12px" }}>
        <a
          href="https://ai-kohl-nine-89.vercel.app"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "#475569", fontSize: "11px", textDecoration: "none" }}
        >
          Powered by 3C Foods ↗
        </a>
      </div>
    </div>
  );
}

export default function EmbedPage() {
  return (
    <Suspense>
      <EmbedWidget />
    </Suspense>
  );
}
