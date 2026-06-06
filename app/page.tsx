"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { usePostHog } from "posthog-js/react";
import toast from "react-hot-toast";

interface Food {
  name: string;
  desc: string;
  emoji: string;
  tag: string;
  img: string;
}

interface FavoriteRow {
  id: number;
  food_name: string;
  food_desc: string;
  food_emoji: string;
  food_tag: string;
  food_img: string;
  rating: number | null;
  tried_at: string | null;
}

const UNS = (q: string) =>
  `https://source.unsplash.com/featured/800x600/?${q}`;

const FOOD_DB: Record<string, Food[]> = {
  indian: [
    { name: "Biryani", desc: "Aromatic basmati rice layered with saffron, spices and tender meat", emoji: "🍛", tag: "Indian", img: UNS("biryani,indian,rice") },
    { name: "Butter Chicken", desc: "Creamy tomato-based curry with succulent chicken pieces", emoji: "🍗", tag: "Indian", img: UNS("butter,chicken,curry,indian") },
    { name: "Masala Dosa", desc: "Crispy South Indian rice crepe with spiced potato filling", emoji: "🫓", tag: "South Indian", img: UNS("dosa,indian,breakfast") },
  ],
  italian: [
    { name: "Margherita Pizza", desc: "Classic Neapolitan pizza with San Marzano tomatoes and fresh mozzarella", emoji: "🍕", tag: "Italian", img: UNS("pizza,margherita,italian") },
    { name: "Spaghetti Carbonara", desc: "Silky Roman pasta with eggs, guanciale and Pecorino Romano", emoji: "🍝", tag: "Italian", img: UNS("pasta,carbonara,spaghetti") },
    { name: "Risotto", desc: "Creamy Arborio rice slow-cooked with white wine and parmesan", emoji: "🍚", tag: "Italian", img: UNS("risotto,italian,rice") },
  ],
  mexican: [
    { name: "Tacos al Pastor", desc: "Spit-grilled pork on corn tortillas with pineapple and cilantro", emoji: "🌮", tag: "Mexican", img: UNS("tacos,mexican,food") },
    { name: "Guacamole & Chips", desc: "Fresh Hass avocados with lime, jalapeño and crispy tortilla chips", emoji: "🥑", tag: "Mexican", img: UNS("guacamole,avocado,chips") },
    { name: "Enchiladas", desc: "Corn tortillas filled with chicken, smothered in red chili sauce", emoji: "🫔", tag: "Mexican", img: UNS("enchiladas,mexican,food") },
  ],
  japanese: [
    { name: "Sushi Platter", desc: "Chef's selection of nigiri and maki with pickled ginger and wasabi", emoji: "🍣", tag: "Japanese", img: UNS("sushi,japanese,food") },
    { name: "Ramen", desc: "Rich tonkotsu broth with chashu pork, soft egg and nori", emoji: "🍜", tag: "Japanese", img: UNS("ramen,noodles,japanese") },
    { name: "Tempura", desc: "Light panko-battered tiger shrimp and seasonal vegetables", emoji: "🍤", tag: "Japanese", img: UNS("tempura,japanese,shrimp") },
  ],
  chinese: [
    { name: "Dim Sum", desc: "Delicate steamed har gow, siu mai and char siu bao with sauces", emoji: "🥟", tag: "Chinese", img: UNS("dim,sum,dumplings,chinese") },
    { name: "Kung Pao Chicken", desc: "Wok-tossed chicken with peanuts, dried chili and Sichuan pepper", emoji: "🍗", tag: "Chinese", img: UNS("kung,pao,chicken,chinese,stir,fry") },
    { name: "Peking Duck", desc: "Lacquered roast duck with pancakes, scallions and hoisin", emoji: "🦆", tag: "Chinese", img: UNS("peking,duck,chinese,roast") },
  ],
  american: [
    { name: "BBQ Ribs", desc: "12-hour smoked pork baby back ribs with house BBQ glaze", emoji: "🥩", tag: "American", img: UNS("bbq,ribs,smoked,meat") },
    { name: "Cheeseburger", desc: "Double smash patty with American cheese, pickles and special sauce", emoji: "🍔", tag: "American", img: UNS("cheeseburger,burger,american") },
    { name: "Mac & Cheese", desc: "Three-cheese elbow pasta baked with a golden panko crust", emoji: "🧀", tag: "American", img: UNS("mac,cheese,comfort,food") },
  ],
  thai: [
    { name: "Pad Thai", desc: "Rice noodles stir-fried with shrimp, bean sprouts and tamarind", emoji: "🍜", tag: "Thai", img: UNS("pad,thai,noodles,thai,food") },
    { name: "Green Curry", desc: "Coconut milk curry with Thai basil, eggplant and kaffir lime", emoji: "🍲", tag: "Thai", img: UNS("green,curry,thai,coconut") },
    { name: "Mango Sticky Rice", desc: "Sweet glutinous rice with ripe Ataulfo mango and coconut cream", emoji: "🥭", tag: "Thai", img: UNS("mango,sticky,rice,thai,dessert") },
  ],
  mediterranean: [
    { name: "Hummus & Pita", desc: "Stone-ground chickpea hummus drizzled with olive oil and paprika", emoji: "🫓", tag: "Mediterranean", img: UNS("hummus,pita,bread,mediterranean") },
    { name: "Greek Salad", desc: "Heirloom tomatoes, cucumber, kalamata olives and barrel-aged feta", emoji: "🥗", tag: "Mediterranean", img: UNS("greek,salad,feta,mediterranean") },
    { name: "Shawarma", desc: "Slow-roasted spiced lamb in flatbread with garlic tahini sauce", emoji: "🌯", tag: "Mediterranean", img: UNS("shawarma,wrap,middle,eastern") },
  ],
  spicy: [
    { name: "Nashville Hot Chicken", desc: "Double-fried chicken thighs coated in fiery cayenne paste", emoji: "🔥", tag: "Spicy", img: UNS("fried,chicken,spicy,hot") },
    { name: "Sichuan Mapo Tofu", desc: "Silken tofu in numbing spicy doubanjiang sauce with minced pork", emoji: "🌶️", tag: "Spicy", img: UNS("tofu,chinese,spicy,sichuan") },
    { name: "Vindaloo", desc: "Fiery Goan pork curry with Kashmiri chili and palm vinegar", emoji: "🥘", tag: "Spicy", img: UNS("indian,curry,spicy,vindaloo") },
  ],
  vegetarian: [
    { name: "Paneer Tikka", desc: "Tandoor-charred cottage cheese with bell pepper and mint chutney", emoji: "🧆", tag: "Vegetarian", img: UNS("paneer,tikka,indian,vegetarian") },
    { name: "Falafel Bowl", desc: "Crispy herbed chickpea fritters on quinoa with tahini and pickles", emoji: "🥙", tag: "Vegetarian", img: UNS("falafel,bowl,healthy,vegetarian") },
    { name: "Caprese Salad", desc: "Buffalo mozzarella, heirloom tomato and basil with aged balsamic", emoji: "🍅", tag: "Vegetarian", img: UNS("caprese,salad,tomato,mozzarella") },
  ],
};

const CATEGORIES = [
  { label: "Indian",         value: "indian",        emoji: "🍛", img: UNS("indian,curry,food") },
  { label: "Italian",        value: "italian",       emoji: "🍕", img: UNS("pizza,pasta,italian") },
  { label: "Mexican",        value: "mexican",       emoji: "🌮", img: UNS("tacos,mexican,food") },
  { label: "Japanese",       value: "japanese",      emoji: "🍣", img: UNS("sushi,japanese,food") },
  { label: "Chinese",        value: "chinese",       emoji: "🥟", img: UNS("chinese,food,dim,sum") },
  { label: "American",       value: "american",      emoji: "🍔", img: UNS("burger,american,bbq") },
  { label: "Thai",           value: "thai",          emoji: "🍜", img: UNS("thai,food,pad,thai") },
  { label: "Mediterranean",  value: "mediterranean", emoji: "🥗", img: UNS("mediterranean,food,greek") },
  { label: "Spicy",          value: "spicy",         emoji: "🔥", img: UNS("spicy,food,chili,hot") },
  { label: "Vegetarian",     value: "vegetarian",    emoji: "🥗", img: UNS("vegetarian,healthy,salad") },
];

function getRecommendations(query: string): Food[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  for (const [key, foods] of Object.entries(FOOD_DB)) {
    if (key.includes(q) || q.includes(key)) return foods;
  }
  const partial = Object.entries(FOOD_DB).find(([key]) =>
    key.startsWith(q[0]) && (key.includes(q.slice(0, 3)) || q.includes(key.slice(0, 3)))
  );
  if (partial) return partial[1];
  const allFoods = Object.values(FOOD_DB).flat();
  const match = allFoods.find(
    (f) => f.name.toLowerCase().includes(q) || f.tag.toLowerCase().includes(q)
  );
  if (match) {
    const tag = match.tag.toLowerCase();
    const found = Object.values(FOOD_DB).find((list) =>
      list.some((f) => f.tag.toLowerCase() === tag)
    );
    if (found) return found;
  }
  return [];
}

const RANK = [
  { label: "1st", cls: "rank-gold" },
  { label: "2nd", cls: "rank-silver" },
  { label: "3rd", cls: "rank-bronze" },
];

const DELIVERY = [
  { label: "Uber Eats", emoji: "🚗", href: (q: string) => `https://www.ubereats.com/search?q=${encodeURIComponent(q)}` },
  { label: "DoorDash",  emoji: "🚪", href: (q: string) => `https://www.doordash.com/search/store/${encodeURIComponent(q)}/` },
  { label: "Instacart", emoji: "🛒", href: (q: string) => `https://www.instacart.com/store/s?k=${encodeURIComponent(q)}` },
];

function OrderNowButton({ foodName }: { foodName: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
        className="chip text-orange-300 text-xs font-semibold px-3 py-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 hover:bg-orange-500/20 transition-colors flex items-center gap-1"
      >
        🛵 Order Now
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-9 z-20 bg-[#0f0f1a] border border-white/10 rounded-xl overflow-hidden shadow-xl w-40">
            {DELIVERY.map((d) => (
              <a
                key={d.label}
                href={d.href(foodName)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
              >
                <span>{d.emoji}</span>
                <span>{d.label}</span>
              </a>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function FoodCard({
  food, rank, delay, isFaved, onToggleFave, saving, userLists, onAddToList,
}: {
  food: Food; rank: number; delay: string;
  isFaved: boolean; onToggleFave: () => void; saving: boolean;
  userLists: { id: number; title: string }[];
  onAddToList: (food: Food, listId: number) => void;
}) {
  const [listOpen, setListOpen] = useState(false);
  return (
    <div className="food-card rounded-3xl fade-up" style={{ animationDelay: delay }}>
      <div className="relative w-full h-48 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={food.img}
          alt={food.name}
          className="w-full h-full object-cover"
          onError={(e) => { (e.currentTarget as HTMLImageElement).src = ""; e.currentTarget.style.display = "none"; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <span className={`absolute top-3 left-3 ${RANK[rank].cls} text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg`}>
          {RANK[rank].label}
        </span>
        <span className="absolute top-3 right-3 bg-black/50 backdrop-blur text-white text-xs font-medium px-3 py-1 rounded-full border border-white/10">
          {food.tag}
        </span>
        {/* Favorite button */}
        <button
          onClick={onToggleFave}
          disabled={saving}
          title={isFaved ? "Remove from favorites" : "Save to favorites"}
          className={`absolute bottom-3 right-3 w-9 h-9 flex items-center justify-center rounded-full text-lg transition-all shadow-lg
            ${isFaved
              ? "bg-red-500/90 text-white scale-110"
              : "bg-black/50 backdrop-blur text-slate-300 hover:bg-red-500/70 hover:text-white"}
            ${saving ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
        >
          {isFaved ? "❤️" : "🤍"}
        </button>
      </div>
      <div className="p-5">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl">{food.emoji}</span>
          <h2 className="text-white font-bold text-xl">{food.name}</h2>
        </div>
        <p className="text-slate-400 text-sm leading-relaxed mb-3">{food.desc}</p>
        <div className="flex items-center gap-2 flex-wrap">
          <OrderNowButton foodName={food.name} />
          {userLists.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setListOpen((o) => !o)}
                className="chip text-slate-400 text-xs font-medium px-3 py-1.5 rounded-full flex items-center gap-1"
              >
                📋 Save to list
              </button>
              {listOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setListOpen(false)} />
                  <div className="absolute left-0 top-9 z-20 bg-[#0f0f1a] border border-white/10 rounded-xl overflow-hidden shadow-xl min-w-[160px]">
                    {userLists.map((l) => (
                      <button
                        key={l.id}
                        onClick={() => { onAddToList(food, l.id); setListOpen(false); }}
                        className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors truncate"
                      >
                        {l.title}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StarRating({ favId, current, onRate }: { favId: number; current: number | null; onRate: (id: number, r: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          onClick={() => onRate(favId, s)}
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
          className="text-base transition-transform hover:scale-125"
          title={`Rate ${s} star${s > 1 ? "s" : ""}`}
        >
          <span className={(hover || current || 0) >= s ? "text-yellow-400" : "text-slate-700"}>★</span>
        </button>
      ))}
      {current && <span className="text-slate-600 text-xs ml-1">Tried ✓</span>}
    </div>
  );
}

function FaveCard({ fav, onRemove, onRate }: { fav: FavoriteRow; onRemove: () => void; onRate: (id: number, r: number) => void }) {
  return (
    <div className="food-card rounded-2xl flex gap-3 overflow-hidden">
      <div className="relative w-20 h-20 shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={fav.food_img} alt={fav.food_name} className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 py-3 pr-3 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-xl">{fav.food_emoji}</span>
            <span className="text-white font-semibold text-sm truncate">{fav.food_name}</span>
          </div>
          <button
            onClick={onRemove}
            title="Remove favorite"
            className="text-red-400 hover:text-red-300 text-lg shrink-0 transition-colors"
          >
            ❤️
          </button>
        </div>
        <p className="text-slate-500 text-xs mt-0.5 leading-relaxed line-clamp-1">{fav.food_desc}</p>
        <div className="mt-1.5">
          <StarRating favId={fav.id} current={fav.rating} onRate={onRate} />
        </div>
      </div>
    </div>
  );
}

function AuthButton() {
  const { data: session, status } = useSession();
  if (status === "loading") return <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse" />;
  if (session?.user) {
    return (
      <div className="flex items-center gap-2">
        {session.user.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={session.user.image} alt="avatar" className="w-7 h-7 rounded-full ring-1 ring-white/20" />
        )}
        <span className="text-slate-400 text-xs hidden sm:inline truncate max-w-[120px]">
          {session.user.name ?? session.user.email}
        </span>
        <button
          onClick={() => signOut()}
          className="chip text-slate-500 text-xs px-3 py-1 rounded-full"
        >
          Sign out
        </button>
      </div>
    );
  }
  return (
    <button
      onClick={() => signIn("google")}
      className="chip text-slate-300 text-xs font-semibold px-4 py-1.5 rounded-full flex items-center gap-1.5"
    >
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
      Sign in
    </button>
  );
}

function CatCard({ cat, onSelect }: { cat: typeof CATEGORIES[0]; onSelect: (v: string) => void }) {
  return (
    <button onClick={() => onSelect(cat.value)} className="cat-card rounded-2xl text-left w-full">
      <div className="relative h-28 overflow-hidden rounded-t-2xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={cat.img} alt={cat.label} className="w-full h-full object-cover" />
        <div className="cat-overlay absolute inset-0 flex flex-col items-center justify-center gap-1">
          <span className="text-2xl">{cat.emoji}</span>
          <span className="text-white font-bold text-sm drop-shadow">{cat.label}</span>
        </div>
      </div>
    </button>
  );
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [results, setResults] = useState<Food[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [aiPowered, setAiPowered] = useState(false);
  const [personalized, setPersonalized] = useState(false);
  const [key, setKey] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<FavoriteRow[]>([]);
  const [savingName, setSavingName] = useState<string | null>(null);
  const [city, setCity] = useState("");
  const [locLoading, setLocLoading] = useState(false);
  const [userLists, setUserLists] = useState<{ id: number; title: string }[]>([]);
  const posthog = usePostHog();
  const { data: session } = useSession();

  const loadFavorites = useCallback(async () => {
    try {
      const res = await fetch("/api/favorites");
      if (res.ok) {
        const data = await res.json();
        setFavorites(data.favorites ?? []);
      }
    } catch { /* db not connected yet */ }
  }, []);

  useEffect(() => {
    async function init() {
      try {
        const res = await fetch("/api/searches");
        if (res.ok) {
          const data = await res.json();
          setRecentSearches((data.searches ?? []).map((s: { query: string }) => s.query));
        }
      } catch { /* db not connected yet */ }
      await loadFavorites();
      // Load user lists for "Save to list" dropdowns
      try {
        const lr = await fetch("/api/lists");
        if (lr.ok) {
          const ld = await lr.json();
          setUserLists((ld.lists ?? []).map((l: { id: number; title: string }) => ({ id: l.id, title: l.title })));
        }
      } catch {}
      // Apply referral code from URL if present
      const params = new URLSearchParams(window.location.search);
      const ref = params.get("ref");
      if (ref) {
        fetch("/api/referral", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ref }) }).catch(() => {});
      }
    }
    init();
  }, [loadFavorites]);

  async function handleSearch(q: string) {
    const trimmed = q.trim();
    if (!trimmed) return;
    setQuery(trimmed);
    setSubmitted(trimmed);
    setSearched(true);
    setLoading(true);
    setAiPowered(false);
    setResults([]);
    setKey((k) => k + 1);

    // Log search (fire-and-forget)
    fetch("/api/searches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: trimmed }),
    }).then(async (r) => {
      if (r.ok) {
        setRecentSearches((prev) => {
          const deduped = [trimmed, ...prev.filter((s) => s.toLowerCase() !== trimmed.toLowerCase())];
          return deduped.slice(0, 8);
        });
      }
    }).catch(() => {});

    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: trimmed, city: city || undefined }),
      });
      if (res.status === 429) {
        const data = await res.json();
        toast(
          (t) => (
            <span>
              Daily limit reached ({data.used}/{data.max} searches).{" "}
              <a href="/premium" onClick={() => toast.dismiss(t.id)} className="text-orange-300 underline font-semibold">
                Upgrade to Premium →
              </a>
            </span>
          ),
          { duration: 6000 }
        );
        setLoading(false);
        setSearched(false);
        return;
      }
      if (res.ok) {
        const data = await res.json();
        if (data.foods?.length > 0) {
          setResults(data.foods);
          setAiPowered(true);
          setPersonalized(!!data.personalized);
          setLoading(false);
          posthog?.capture("search", { query: trimmed, result_count: data.foods.length, ai_powered: true, personalized: !!data.personalized });
          return;
        }
      }
    } catch {
      // fall through to local results
    }

    const local = getRecommendations(trimmed);
    setResults(local);
    setAiPowered(false);
    setPersonalized(false);
    setLoading(false);
    posthog?.capture("search", { query: trimmed, result_count: local.length, ai_powered: false });
  }

  async function handleShare(foods: Food[], q: string) {
    const lines = foods.slice(0, 3).map((f, i) => `${i + 1}. ${f.emoji} ${f.name}`).join("\n");
    const text = `Top 3 picks for "${q}" from 3C Foods:\n${lines}\n\nhttps://ai-kohl-nine-89.vercel.app`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "3C Foods picks", text });
        posthog?.capture("share", { query: q, method: "native" });
      } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(text);
      toast("📋 Copied to clipboard!");
      posthog?.capture("share", { query: q, method: "clipboard" });
    }
  }

  function handleClear() {
    setQuery("");
    setSubmitted("");
    setResults([]);
    setSearched(false);
    setLoading(false);
    setAiPowered(false);
    setPersonalized(false);
  }

  function isFaved(food: Food) {
    return favorites.some((f) => f.food_name === food.name);
  }

  function favId(food: Food) {
    return favorites.find((f) => f.food_name === food.name)?.id;
  }

  async function toggleFave(food: Food) {
    if (savingName) return;
    setSavingName(food.name);
    try {
      const id = favId(food);
      if (id != null) {
        await fetch(`/api/favorites/${id}`, { method: "DELETE" });
        setFavorites((prev) => prev.filter((f) => f.id !== id));
        posthog?.capture("favorite_remove", { food_name: food.name, food_tag: food.tag });
      } else {
        const res = await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(food),
        });
        if (res.ok) {
          const data = await res.json();
          const newFav: FavoriteRow = {
            id: data.id,
            food_name: food.name,
            food_desc: food.desc,
            food_emoji: food.emoji,
            food_tag: food.tag,
            food_img: food.img,
            rating: null,
            tried_at: null,
          };
          setFavorites((prev) => [newFav, ...prev]);
          posthog?.capture("favorite_add", { food_name: food.name, food_tag: food.tag });
        }
      }
    } catch { /* db not connected yet */ }
    setSavingName(null);
  }

  async function removeFave(id: number) {
    try {
      await fetch(`/api/favorites/${id}`, { method: "DELETE" });
      setFavorites((prev) => prev.filter((f) => f.id !== id));
    } catch { /* ignore */ }
  }

  async function rateFood(id: number, rating: number) {
    setFavorites((prev) => prev.map((f) => f.id === id ? { ...f, rating, tried_at: new Date().toISOString() } : f));
    await fetch(`/api/favorites/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating }),
    }).catch(() => {});
    posthog?.capture("rate_food", { favorite_id: id, rating });
  }

  async function detectLocation() {
    if (!navigator.geolocation) return;
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`);
          const data = await res.json();
          const cityName = data.address?.city || data.address?.town || data.address?.village || data.address?.county || "";
          setCity(cityName);
          if (cityName) toast.success(`📍 ${cityName}`);
        } catch {}
        setLocLoading(false);
      },
      () => setLocLoading(false)
    );
  }

  async function addToList(food: Food, listId: number) {
    try {
      const res = await fetch(`/api/lists/${listId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: food.name, desc: food.desc, emoji: food.emoji, tag: food.tag, img: food.img }),
      });
      if (res.ok) toast.success("Added to list!");
      else toast.error("Failed to add");
    } catch {
      toast.error("Failed to add");
    }
  }

  const chips = recentSearches.length > 0
    ? recentSearches
    : ["Spicy", "Vegetarian", "Indian", "Italian", "Mexican", "Japanese", "Thai", "Chinese"];

  return (
    <main className="relative min-h-screen bg-[#07070f] overflow-x-hidden">
      {/* Orbs */}
      <div className="orb w-[600px] h-[600px] bg-orange-600/15 -top-40 -left-40" />
      <div className="orb w-[500px] h-[500px] bg-pink-600/10 top-1/2 -right-40" />
      <div className="orb w-[400px] h-[400px] bg-violet-700/10 bottom-20 left-1/4" />

      <div className="relative z-10 max-w-2xl mx-auto px-4 pt-12 pb-24">

        {/* Auth bar */}
        <div className="flex items-center justify-between mb-8 fade-up">
          <div className="flex items-center gap-3 flex-wrap">
            <Link href="/progress" className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-400 transition-colors">
              <span>📊</span><span className="hidden sm:inline">Progress</span>
            </Link>
            <Link href="/profile" className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-400 transition-colors">
              <span>⚙️</span><span className="hidden sm:inline">Profile</span>
            </Link>
            <Link href="/lists" className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-400 transition-colors">
              <span>📋</span><span className="hidden sm:inline">Lists</span>
            </Link>
            <Link href="/leaderboard" className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-400 transition-colors">
              <span>🏆</span><span className="hidden sm:inline">Top</span>
            </Link>
            <Link href="/metrics" className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-400 transition-colors">
              <span>📈</span><span className="hidden sm:inline">Metrics</span>
            </Link>
            <Link href="/premium" className="flex items-center gap-1 text-xs text-orange-500/70 hover:text-orange-400 transition-colors font-semibold">
              <span>⭐</span><span className="hidden sm:inline">Premium</span>
            </Link>
          </div>
          <AuthButton />
        </div>

        {/* Header */}
        <div className="text-center mb-10 fade-up" style={{ animationDelay: "0.04s" }}>
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl glass text-3xl mb-5 shadow-xl">🍽️</div>
          <h1 className="text-5xl font-black tracking-tight gradient-text mb-2">3C Foods</h1>
          <p className="text-slate-400 text-base">Discover the top 3 dishes for any cuisine or craving</p>
        </div>

        {/* Search */}
        <div className="flex gap-3 mb-6 fade-up" style={{ animationDelay: "0.08s" }}>
          <div className="relative flex-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-lg">🔍</span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch(query)}
              placeholder="Search cuisine, ingredient, or mood…"
              className="search-input glass w-full rounded-2xl pl-11 pr-10 py-4 text-white text-base placeholder-slate-500 outline-none transition-all"
            />
            {query && (
              <button onClick={handleClear} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xl transition-colors">×</button>
            )}
          </div>
          <button onClick={() => handleSearch(query)} className="btn-find text-white font-bold px-7 py-4 rounded-2xl shadow-lg shrink-0">
            Find
          </button>
        </div>

        {/* Location row */}
        <div className="flex items-center gap-2 mb-4 -mt-2 fade-up" style={{ animationDelay: "0.10s" }}>
          <button
            onClick={detectLocation}
            disabled={locLoading}
            className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-400 transition-colors disabled:opacity-50"
          >
            <span>{locLoading ? "…" : "📍"}</span>
            <span>{city || "Use my location"}</span>
          </button>
          {city && (
            <button onClick={() => setCity("")} className="text-slate-700 hover:text-slate-500 text-xs transition-colors">×</button>
          )}
          <Link href="/claim" className="ml-auto text-xs text-slate-700 hover:text-slate-500 transition-colors">
            Own a restaurant? Claim →
          </Link>
        </div>

        {/* Quick chips — recent searches or defaults */}
        <div className="flex flex-wrap gap-2 mb-10 fade-up" style={{ animationDelay: "0.12s" }}>
          {recentSearches.length > 0 && (
            <span className="text-slate-600 text-xs self-center mr-1">
              {session ? "Your searches:" : "Recent:"}
            </span>
          )}
          {chips.slice(0, 8).map((s) => (
            <button
              key={s}
              onClick={() => handleSearch(s)}
              className="chip text-slate-300 text-sm font-medium px-4 py-1.5 rounded-full"
            >
              {s}
            </button>
          ))}
        </div>

        {/* Home: favorites + browse grid */}
        {!searched && (
          <>
            {/* Saved favorites */}
            {favorites.length > 0 && (
              <div className="mb-8 fade-up" style={{ animationDelay: "0.14s" }}>
                <h2 className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-4">
                  ❤️ Saved Favorites ({favorites.length})
                </h2>
                <div className="space-y-3">
                  {favorites.map((fav) => (
                    <FaveCard key={fav.id} fav={fav} onRemove={() => removeFave(fav.id)} onRate={rateFood} />
                  ))}
                </div>
              </div>
            )}

            {/* Browse grid */}
            <div key="browse" className="fade-up" style={{ animationDelay: "0.16s" }}>
              <h2 className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-4">Browse Cuisines</h2>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {CATEGORIES.map((cat) => (
                  <CatCard key={cat.value} cat={cat} onSelect={(v) => handleSearch(v)} />
                ))}
              </div>
            </div>
          </>
        )}

        {/* Loading state */}
        {searched && loading && (
          <div key={`loading-${key}`} className="text-center py-20 glass rounded-3xl scale-in">
            <div className="text-5xl mb-4 animate-pulse">🤖</div>
            <p className="text-white font-semibold text-lg">Claude is thinking…</p>
            <p className="text-slate-500 text-sm mt-1">Finding the best picks for &quot;{submitted}&quot;</p>
          </div>
        )}

        {/* No results */}
        {searched && !loading && results.length === 0 && (
          <div key={`empty-${key}`} className="text-center py-20 glass rounded-3xl scale-in">
            <span className="text-5xl block mb-4">🤔</span>
            <p className="text-white font-semibold text-lg mb-1">No results for &quot;{submitted}&quot;</p>
            <p className="text-slate-500 text-sm mb-6">Try a cuisine like Indian, Italian, or Spicy</p>
            <button onClick={handleClear} className="chip text-slate-300 px-5 py-2 rounded-full text-sm font-medium">
              ← Back to browse
            </button>
          </div>
        )}

        {/* Results */}
        {!loading && results.length > 0 && (
          <div key={`results-${key}`}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Top picks for</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-white font-bold text-xl capitalize">{submitted}</p>
                  {aiPowered && (
                    <span className="text-xs font-semibold bg-violet-500/20 text-violet-300 px-2.5 py-0.5 rounded-full border border-violet-500/30">
                      {personalized ? "✨ Personalized" : "✨ AI"}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleShare(results, submitted)}
                  title="Share these picks"
                  className="chip text-slate-400 text-sm px-3 py-1.5 rounded-full font-medium flex items-center gap-1.5"
                >
                  <span>↗</span><span className="hidden sm:inline">Share</span>
                </button>
                <button onClick={handleClear} className="chip text-slate-400 text-sm px-4 py-1.5 rounded-full font-medium">
                  ← Back
                </button>
              </div>
            </div>
            <div className="space-y-5">
              {results.slice(0, 3).map((food, i) => (
                <FoodCard
                  key={food.name}
                  food={food}
                  rank={i}
                  delay={`${i * 0.08}s`}
                  isFaved={isFaved(food)}
                  onToggleFave={() => toggleFave(food)}
                  saving={savingName === food.name}
                  userLists={userLists}
                  onAddToList={addToList}
                />
              ))}
            </div>
          </div>
        )}

        <p className="text-center text-slate-700 text-xs mt-16">3C Foods — top 3 picks, every time</p>
      </div>
    </main>
  );
}
