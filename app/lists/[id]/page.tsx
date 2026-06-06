"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

interface ListItem {
  id: number;
  food_name: string;
  food_desc: string;
  food_emoji: string;
  food_tag: string;
  food_img: string;
}

interface FoodList {
  id: number;
  title: string;
  description: string | null;
  user_id: string;
  created_at: string;
}

export default function PublicListPage() {
  const params = useParams();
  const [list, setList] = useState<FoodList | null>(null);
  const [items, setItems] = useState<ListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!params?.id) return;
    fetch(`/api/lists/${params.id}`)
      .then((r) => {
        if (r.status === 404) { setNotFound(true); return null; }
        return r.json();
      })
      .then((d) => {
        if (d) { setList(d.list); setItems(d.items); }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [params?.id]);

  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: list?.title, url }); return; } catch {}
    }
    await navigator.clipboard.writeText(url);
    toast("📋 Link copied!");
  }

  if (loading) return (
    <main className="relative min-h-screen bg-[#07070f] flex items-center justify-center">
      <div className="text-4xl animate-pulse">🍽️</div>
    </main>
  );

  if (notFound) return (
    <main className="relative min-h-screen bg-[#07070f] flex flex-col items-center justify-center gap-4">
      <span className="text-5xl">🤔</span>
      <p className="text-white font-bold text-xl">List not found</p>
      <Link href="/" className="chip text-slate-400 px-5 py-2 rounded-full text-sm">← Home</Link>
    </main>
  );

  const authorSlug = list?.user_id?.split("@")[0] ?? "someone";

  return (
    <main className="relative min-h-screen bg-[#07070f] overflow-x-hidden">
      <div className="orb w-[500px] h-[500px] bg-blue-600/10 -top-40 -right-40" />
      <div className="orb w-[400px] h-[400px] bg-violet-600/10 bottom-20 -left-20" />

      <div className="relative z-10 max-w-lg mx-auto px-4 pt-12 pb-24">
        <div className="flex items-center justify-between mb-8 fade-up">
          <Link href="/" className="chip text-slate-400 text-sm px-4 py-1.5 rounded-full font-medium hover:text-slate-200 transition-colors">
            ← 3C Foods
          </Link>
          <button onClick={handleShare} className="chip text-slate-400 text-sm px-4 py-1.5 rounded-full font-medium">
            ↗ Share
          </button>
        </div>

        <div className="mb-8 fade-up" style={{ animationDelay: "0.04s" }}>
          <p className="text-slate-600 text-xs font-semibold uppercase tracking-widest mb-2">
            Curated by {authorSlug}
          </p>
          <h1 className="text-3xl font-black tracking-tight gradient-text mb-1">{list?.title}</h1>
          {list?.description && <p className="text-slate-500 text-sm">{list.description}</p>}
          <p className="text-slate-700 text-xs mt-2">{items.length} dish{items.length !== 1 ? "es" : ""}</p>
        </div>

        {items.length === 0 ? (
          <div className="glass rounded-3xl p-10 text-center">
            <span className="text-5xl block mb-4">🍽️</span>
            <p className="text-slate-400">This list is empty</p>
          </div>
        ) : (
          <div className="space-y-4 fade-up" style={{ animationDelay: "0.08s" }}>
            {items.map((item, i) => (
              <div key={item.id} className="food-card rounded-2xl flex gap-3 overflow-hidden">
                <div className="relative w-20 h-20 shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.food_img} alt={item.food_name} className="w-full h-full object-cover"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                  <div className="absolute inset-0 flex items-center justify-center bg-white/5">
                    <span className="text-2xl">{item.food_emoji}</span>
                  </div>
                </div>
                <div className="flex-1 py-3 pr-3 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs text-slate-600 font-bold">#{i + 1}</span>
                    <span className="text-white font-semibold text-sm truncate">{item.food_name}</span>
                  </div>
                  <p className="text-slate-500 text-xs leading-relaxed line-clamp-2">{item.food_desc}</p>
                  <span className="inline-block mt-1.5 text-xs px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/20">
                    {item.food_tag}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-10 text-center fade-up">
          <p className="text-slate-600 text-xs mb-3">Want AI-powered food recommendations?</p>
          <Link href="/" className="btn-find text-white font-bold px-6 py-3 rounded-2xl inline-block text-sm">
            Try 3C Foods →
          </Link>
        </div>
      </div>
    </main>
  );
}
