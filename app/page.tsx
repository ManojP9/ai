"use client";

import { useState } from "react";
import Image from "next/image";

interface Food {
  name: string;
  desc: string;
  emoji: string;
  tag: string;
  img: string;
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

function FoodCard({ food, rank, delay }: { food: Food; rank: number; delay: string }) {
  return (
    <div className={`food-card rounded-3xl fade-up`} style={{ animationDelay: delay }}>
      {/* Image */}
      <div className="relative w-full h-48 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={food.img}
          alt={food.name}
          className="w-full h-full object-cover"
          onError={(e) => { (e.currentTarget as HTMLImageElement).src = ""; e.currentTarget.style.display = "none"; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        {/* Rank badge on image */}
        <span className={`absolute top-3 left-3 ${RANK[rank].cls} text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg`}>
          {RANK[rank].label}
        </span>
        {/* Tag on image */}
        <span className="absolute top-3 right-3 bg-black/50 backdrop-blur text-white text-xs font-medium px-3 py-1 rounded-full border border-white/10">
          {food.tag}
        </span>
      </div>
      {/* Content */}
      <div className="p-5">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl">{food.emoji}</span>
          <h2 className="text-white font-bold text-xl">{food.name}</h2>
        </div>
        <p className="text-slate-400 text-sm leading-relaxed">{food.desc}</p>
      </div>
    </div>
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
  const [key, setKey] = useState(0);

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

    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: trimmed }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.foods?.length > 0) {
          setResults(data.foods);
          setAiPowered(true);
          setLoading(false);
          return;
        }
      }
    } catch {
      // fall through to local results
    }

    setResults(getRecommendations(trimmed));
    setAiPowered(false);
    setLoading(false);
  }

  function handleClear() {
    setQuery("");
    setSubmitted("");
    setResults([]);
    setSearched(false);
    setLoading(false);
    setAiPowered(false);
  }

  return (
    <main className="relative min-h-screen bg-[#07070f] overflow-x-hidden">
      {/* Orbs */}
      <div className="orb w-[600px] h-[600px] bg-orange-600/15 -top-40 -left-40" />
      <div className="orb w-[500px] h-[500px] bg-pink-600/10 top-1/2 -right-40" />
      <div className="orb w-[400px] h-[400px] bg-violet-700/10 bottom-20 left-1/4" />

      <div className="relative z-10 max-w-2xl mx-auto px-4 pt-16 pb-24">

        {/* Header */}
        <div className="text-center mb-10 fade-up">
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

        {/* Quick chips */}
        <div className="flex flex-wrap gap-2 mb-10 fade-up" style={{ animationDelay: "0.12s" }}>
          {["🔥 Spicy","🥗 Vegetarian","🍛 Indian","🍕 Italian","🌮 Mexican","🍣 Japanese","🍜 Thai","🥟 Chinese"].map((s) => (
            <button
              key={s}
              onClick={() => handleSearch(s.split(" ")[1])}
              className="chip text-slate-300 text-sm font-medium px-4 py-1.5 rounded-full"
            >
              {s}
            </button>
          ))}
        </div>

        {/* Browse grid — shown when not searched */}
        {!searched && (
          <div key="browse" className="fade-up" style={{ animationDelay: "0.16s" }}>
            <h2 className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-4">Browse Cuisines</h2>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {CATEGORIES.map((cat) => (
                <CatCard key={cat.value} cat={cat} onSelect={(v) => handleSearch(v)} />
              ))}
            </div>
          </div>
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
                      ✨ AI
                    </span>
                  )}
                </div>
              </div>
              <button onClick={handleClear} className="chip text-slate-400 text-sm px-4 py-1.5 rounded-full font-medium">
                ← Back
              </button>
            </div>
            <div className="space-y-5">
              {results.slice(0, 3).map((food, i) => (
                <FoodCard key={food.name} food={food} rank={i} delay={`${i * 0.08}s`} />
              ))}
            </div>
          </div>
        )}

        <p className="text-center text-slate-700 text-xs mt-16">3C Foods — top 3 picks, every time</p>
      </div>
    </main>
  );
}
