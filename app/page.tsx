"use client";

import { useState } from "react";

interface Food {
  name: string;
  desc: string;
  emoji: string;
  tag: string;
}

const FOOD_DB: Record<string, Food[]> = {
  indian: [
    { name: "Biryani", desc: "Aromatic rice dish with spices and tender meat or vegetables", emoji: "🍛", tag: "Indian" },
    { name: "Butter Chicken", desc: "Creamy tomato-based rich chicken curry", emoji: "🍗", tag: "Indian" },
    { name: "Masala Dosa", desc: "Crispy South Indian crepe served with chutney & sambar", emoji: "🫓", tag: "South Indian" },
  ],
  italian: [
    { name: "Margherita Pizza", desc: "Classic Neapolitan pizza with fresh mozzarella and basil", emoji: "🍕", tag: "Italian" },
    { name: "Spaghetti Carbonara", desc: "Silky pasta with eggs, pancetta, and Pecorino Romano", emoji: "🍝", tag: "Italian" },
    { name: "Risotto", desc: "Creamy Arborio rice slowly cooked with broth and parmesan", emoji: "🍚", tag: "Italian" },
  ],
  mexican: [
    { name: "Tacos al Pastor", desc: "Marinated pork on corn tortillas with pineapple & cilantro", emoji: "🌮", tag: "Mexican" },
    { name: "Guacamole & Chips", desc: "Fresh avocado dip with lime, cilantro and jalapeño", emoji: "🥑", tag: "Mexican" },
    { name: "Enchiladas", desc: "Rolled tortillas filled with chicken and smothered in chili sauce", emoji: "🫔", tag: "Mexican" },
  ],
  japanese: [
    { name: "Sushi Platter", desc: "Fresh nigiri and maki rolls with soy and wasabi", emoji: "🍣", tag: "Japanese" },
    { name: "Ramen", desc: "Rich broth noodle soup with chashu pork and soft boiled egg", emoji: "🍜", tag: "Japanese" },
    { name: "Tempura", desc: "Light battered and fried shrimp and vegetables", emoji: "🍤", tag: "Japanese" },
  ],
  chinese: [
    { name: "Dim Sum", desc: "Steamed dumplings and buns served with dipping sauces", emoji: "🥟", tag: "Chinese" },
    { name: "Kung Pao Chicken", desc: "Stir-fried chicken with peanuts, chili and Sichuan pepper", emoji: "🍗", tag: "Chinese" },
    { name: "Peking Duck", desc: "Crispy roasted duck served with pancakes and hoisin sauce", emoji: "🦆", tag: "Chinese" },
  ],
  american: [
    { name: "BBQ Ribs", desc: "Slow-smoked pork ribs glazed with tangy barbecue sauce", emoji: "🥩", tag: "American" },
    { name: "Cheeseburger", desc: "Juicy beef patty with melted cheese, lettuce and pickles", emoji: "🍔", tag: "American" },
    { name: "Mac & Cheese", desc: "Creamy elbow pasta baked with a golden breadcrumb crust", emoji: "🧀", tag: "American" },
  ],
  thai: [
    { name: "Pad Thai", desc: "Stir-fried rice noodles with shrimp, peanuts and tamarind", emoji: "🍜", tag: "Thai" },
    { name: "Green Curry", desc: "Aromatic coconut milk curry with vegetables and fragrant herbs", emoji: "🍲", tag: "Thai" },
    { name: "Mango Sticky Rice", desc: "Sweet glutinous rice served with fresh mango and coconut cream", emoji: "🥭", tag: "Thai" },
  ],
  mediterranean: [
    { name: "Hummus & Pita", desc: "Creamy chickpea dip with olive oil and warm pita bread", emoji: "🫓", tag: "Mediterranean" },
    { name: "Greek Salad", desc: "Crisp vegetables with feta, olives and oregano dressing", emoji: "🥗", tag: "Mediterranean" },
    { name: "Shawarma", desc: "Spiced rotisserie meat wrapped in flatbread with garlic sauce", emoji: "🌯", tag: "Mediterranean" },
  ],
  spicy: [
    { name: "Nashville Hot Chicken", desc: "Fried chicken coated in fiery cayenne paste", emoji: "🔥", tag: "Spicy" },
    { name: "Sichuan Mapo Tofu", desc: "Silken tofu in a numbing spicy chili bean sauce", emoji: "🌶️", tag: "Spicy" },
    { name: "Vindaloo", desc: "Fiery Goan curry with vinegar-marinated pork and chili", emoji: "🥘", tag: "Spicy" },
  ],
  vegetarian: [
    { name: "Paneer Tikka", desc: "Grilled spiced cottage cheese with bell peppers and onions", emoji: "🧆", tag: "Vegetarian" },
    { name: "Falafel Bowl", desc: "Crispy chickpea fritters over quinoa with tahini drizzle", emoji: "🥙", tag: "Vegetarian" },
    { name: "Caprese Salad", desc: "Fresh tomato, mozzarella and basil with balsamic glaze", emoji: "🍅", tag: "Vegetarian" },
  ],
};

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

const SUGGESTIONS = [
  { label: "🍛 Indian", value: "Indian" },
  { label: "🍕 Italian", value: "Italian" },
  { label: "🌮 Mexican", value: "Mexican" },
  { label: "🍣 Japanese", value: "Japanese" },
  { label: "🔥 Spicy", value: "Spicy" },
  { label: "🥗 Vegetarian", value: "Vegetarian" },
  { label: "🍜 Thai", value: "Thai" },
  { label: "🥟 Chinese", value: "Chinese" },
];

const RANK_LABELS = ["Gold", "Silver", "Bronze"];
const RANK_COLORS = [
  "from-yellow-400 to-orange-500",
  "from-slate-300 to-slate-500",
  "from-orange-700 to-amber-600",
];

export default function Home() {
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [results, setResults] = useState<Food[]>([]);
  const [searched, setSearched] = useState(false);
  const [resultKey, setResultKey] = useState(0);

  function handleSearch(q: string) {
    const trimmed = q.trim();
    if (!trimmed) return;
    setQuery(trimmed);
    setSubmitted(trimmed);
    setResults(getRecommendations(trimmed));
    setSearched(true);
    setResultKey((k) => k + 1);
  }

  return (
    <main className="relative min-h-screen bg-[#080810] overflow-hidden flex flex-col items-center px-4 pt-20 pb-24">
      {/* Ambient orbs */}
      <div className="orb w-[500px] h-[500px] bg-orange-600/20 -top-32 -left-32" />
      <div className="orb w-[400px] h-[400px] bg-pink-600/15 top-1/2 -right-32" />
      <div className="orb w-[300px] h-[300px] bg-violet-600/10 bottom-0 left-1/3" />

      <div className="relative w-full max-w-lg z-10">

        {/* Header */}
        <div className="text-center mb-12 animate-fade-up">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl glass mb-5 text-3xl shadow-lg">
            🍽️
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight gradient-text mb-3">
            3C Foods
          </h1>
          <p className="text-slate-400 text-base font-medium">
            Discover your top 3 picks — by cuisine, mood, or craving
          </p>
        </div>

        {/* Search bar */}
        <div className="flex gap-3 mb-5 animate-fade-up" style={{ animationDelay: "0.1s" }}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch(query)}
            placeholder="Type a cuisine or mood…"
            className="glow-input flex-1 glass rounded-2xl px-5 py-4 text-white text-base placeholder-slate-500 outline-none transition-all duration-200"
          />
          <button
            onClick={() => handleSearch(query)}
            className="btn-primary text-white font-bold px-7 py-4 rounded-2xl whitespace-nowrap shadow-lg"
          >
            Find ✦
          </button>
        </div>

        {/* Suggestion chips */}
        <div className="flex flex-wrap gap-2 mb-10 animate-fade-up" style={{ animationDelay: "0.15s" }}>
          {SUGGESTIONS.map((s) => (
            <button
              key={s.value}
              onClick={() => handleSearch(s.value)}
              className="chip text-slate-300 text-sm font-medium px-4 py-1.5 rounded-full cursor-pointer"
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Results */}
        {searched && results.length === 0 && (
          <div key={resultKey} className="text-center py-16 animate-fade-up glass rounded-3xl">
            <span className="text-5xl block mb-4">🤔</span>
            <p className="text-slate-400">
              No results for <span className="text-white font-semibold">&quot;{submitted}&quot;</span>
            </p>
            <p className="text-slate-600 text-sm mt-1">Try Indian, Spicy, or Vegetarian</p>
          </div>
        )}

        {results.length > 0 && (
          <div key={resultKey} className="space-y-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-5 animate-fade-up">
              Top 3 picks for &nbsp;
              <span className="text-orange-400">{submitted}</span>
            </p>

            {results.slice(0, 3).map((food, i) => (
              <div
                key={food.name}
                className={`glass-card rounded-3xl p-5 flex items-center gap-5 animate-fade-up-${i + 1}`}
              >
                {/* Rank */}
                <div className={`shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br ${RANK_COLORS[i]} flex items-center justify-center shadow-md`}>
                  <span className="text-white text-xs font-bold">#{i + 1}</span>
                </div>

                {/* Emoji */}
                <div className="text-4xl shrink-0 leading-none">{food.emoji}</div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h2 className="text-white font-bold text-lg leading-tight truncate">{food.name}</h2>
                  </div>
                  <p className="text-slate-400 text-sm leading-snug">{food.desc}</p>
                </div>

                {/* Tag */}
                <span className="shrink-0 text-xs font-semibold text-orange-400 bg-orange-400/10 border border-orange-400/20 px-3 py-1 rounded-full">
                  {food.tag}
                </span>
              </div>
            ))}
          </div>
        )}

        {!searched && (
          <div className="text-center py-16 animate-fade-up" style={{ animationDelay: "0.2s" }}>
            <p className="text-slate-600 text-sm">Start typing or pick a cuisine above</p>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-slate-700 text-xs mt-14">
          3C Foods — top 3 picks, every time
        </p>
      </div>
    </main>
  );
}
