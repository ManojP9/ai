"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession, signIn } from "next-auth/react";
import toast from "react-hot-toast";

interface FoodList {
  id: number;
  title: string;
  description: string | null;
  is_public: boolean;
  created_at: string;
  item_count: number;
}

export default function ListsPage() {
  const { data: session, status } = useSession();
  const [lists, setLists] = useState<FoodList[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/lists")
        .then((r) => r.json())
        .then((d) => setLists(d.lists ?? []))
        .catch(() => {})
        .finally(() => setLoading(false));
    } else if (status !== "loading") {
      setLoading(false);
    }
  }, [status]);

  async function createList() {
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle.trim() }),
      });
      if (res.ok) {
        const d = await res.json();
        setLists((prev) => [{ id: d.id, title: newTitle.trim(), description: null, is_public: true, created_at: new Date().toISOString(), item_count: 0 }, ...prev]);
        setNewTitle("");
        setShowCreate(false);
        toast.success("List created!");
      }
    } catch {
      toast.error("Failed to create list");
    } finally {
      setCreating(false);
    }
  }

  async function deleteList(id: number) {
    await fetch(`/api/lists/${id}`, { method: "DELETE" });
    setLists((prev) => prev.filter((l) => l.id !== id));
    toast.success("List deleted");
  }

  async function shareList(id: number, title: string) {
    const url = `${window.location.origin}/lists/${id}`;
    if (navigator.share) {
      try { await navigator.share({ title: `My 3C Foods list: ${title}`, url }); return; } catch {}
    }
    await navigator.clipboard.writeText(url);
    toast("📋 Link copied!");
  }

  return (
    <main className="relative min-h-screen bg-[#07070f] overflow-x-hidden">
      <div className="orb w-[500px] h-[500px] bg-blue-600/10 -top-40 -right-40" />
      <div className="orb w-[400px] h-[400px] bg-violet-600/10 bottom-20 -left-20" />

      <div className="relative z-10 max-w-lg mx-auto px-4 pt-12 pb-24">
        <div className="flex items-center justify-between mb-8 fade-up">
          <Link href="/" className="chip text-slate-400 text-sm px-4 py-1.5 rounded-full font-medium hover:text-slate-200 transition-colors">
            ← 3C Foods
          </Link>
          {session && (
            <button
              onClick={() => setShowCreate(true)}
              className="btn-find text-white text-sm font-bold px-4 py-1.5 rounded-full"
            >
              + New List
            </button>
          )}
        </div>

        <div className="mb-8 fade-up" style={{ animationDelay: "0.04s" }}>
          <h1 className="text-4xl font-black tracking-tight gradient-text mb-1">My Food Lists</h1>
          <p className="text-slate-500 text-sm">Curate and share your top picks</p>
        </div>

        {/* Create modal */}
        {showCreate && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
            <div className="glass rounded-2xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-white font-bold text-lg mb-4">New List</h3>
              <input
                autoFocus
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && createList()}
                placeholder="e.g. My top 5 Italian spots"
                className="search-input glass w-full rounded-xl px-4 py-3 text-white text-sm placeholder-slate-600 outline-none mb-4"
              />
              <div className="flex gap-3">
                <button onClick={createList} disabled={creating} className="flex-1 btn-find text-white font-bold py-2.5 rounded-xl text-sm disabled:opacity-60">
                  {creating ? "Creating…" : "Create"}
                </button>
                <button onClick={() => setShowCreate(false)} className="flex-1 chip text-slate-400 py-2.5 rounded-xl text-sm font-medium">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {status !== "loading" && !session && (
          <div className="glass rounded-3xl p-10 text-center fade-up">
            <span className="text-5xl block mb-4">📋</span>
            <h2 className="text-white font-bold text-xl mb-2">Sign in to create lists</h2>
            <p className="text-slate-500 text-sm mb-8">Curate and share your favourite food picks with friends.</p>
            <button onClick={() => signIn("google")} className="btn-find text-white font-bold px-8 py-3 rounded-2xl">
              Sign in with Google
            </button>
          </div>
        )}

        {status === "loading" || (session && loading) ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="glass rounded-2xl h-20 animate-pulse" />)}
          </div>
        ) : session && lists.length === 0 ? (
          <div className="glass rounded-3xl p-10 text-center fade-up">
            <span className="text-5xl block mb-4">🍽️</span>
            <p className="text-white font-semibold text-lg mb-1">No lists yet</p>
            <p className="text-slate-500 text-sm mb-6">Create a list to start curating your favourite dishes.</p>
            <button onClick={() => setShowCreate(true)} className="btn-find text-white font-bold px-8 py-3 rounded-2xl">
              Create your first list
            </button>
          </div>
        ) : (
          <div className="space-y-3 fade-up" style={{ animationDelay: "0.08s" }}>
            {lists.map((list) => (
              <div key={list.id} className="glass rounded-2xl p-5 flex items-center gap-4 group">
                <div className="flex-1 min-w-0">
                  <Link href={`/lists/${list.id}`} className="text-white font-semibold hover:text-orange-300 transition-colors truncate block">
                    {list.title}
                  </Link>
                  <p className="text-slate-600 text-xs mt-0.5">{list.item_count} item{list.item_count !== 1 ? "s" : ""} · {list.is_public ? "Public" : "Private"}</p>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => shareList(list.id, list.title)}
                    className="text-xs text-slate-500 hover:text-slate-200 px-2 py-1 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    ↗ Share
                  </button>
                  <button
                    onClick={() => deleteList(list.id)}
                    className="text-xs text-red-500 hover:text-red-400 px-2 py-1 rounded-lg hover:bg-red-500/10 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="text-center text-slate-700 text-xs mt-16">3C Foods · My Lists</p>
      </div>
    </main>
  );
}
