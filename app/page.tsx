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

const SUGGESTIONS = ["Indian", "Italian", "Mexican", "Japanese", "Spicy", "Vegetarian", "Thai", "Chinese"];

export default function Home() {
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [results, setResults] = useState<Food[]>([]);
  const [searched, setSearched] = useState(false);

  function handleSearch(q: string) {
    const trimmed = q.trim();
    setQuery(trimmed);
    setSubmitted(trimmed);
    setResults(getRecommendations(trimmed));
    setSearched(true);
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50 flex flex-col items-center justify-start px-4 pt-16 pb-20">
      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="text-center mb-10">
          <span className="text-5xl mb-4 block">🍽️</span>
          <h1 className="text-4xl font-bold text-gray-800 tracking-tight">3C Foods</h1>
          <p className="text-gray-500 mt-2 text-base">Type a cuisine or mood — get your top 3 picks instantly</p>
        </div>

        {/* Search */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch(query)}
            placeholder="e.g. Indian, Spicy, Vegetarian…"
            className="flex-1 rounded-xl border border-gray-200 bg-white px-5 py-3 text-gray-800 text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400 placeholder-gray-400"
          />
          <button
            onClick={() => handleSearch(query)}
            className="bg-orange-500 hover:bg-orange-600 active:scale-95 transition-all text-white font-semibold px-6 py-3 rounded-xl shadow-sm"
          >
            Find
          </button>
        </div>

        {/* Suggestion chips */}
        <div className="flex flex-wrap gap-2 mb-8">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => handleSearch(s)}
              className="px-3 py-1 rounded-full bg-white border border-gray-200 text-sm text-gray-600 hover:border-orange-400 hover:text-orange-500 transition-colors shadow-sm"
            >
              {s}
            </button>
          ))}
        </div>

        {/* Results */}
        {searched && results.length === 0 && (
          <div className="text-center text-gray-400 py-12">
            <span className="text-4xl block mb-3">🤔</span>
            <p>No results for <strong>&quot;{submitted}&quot;</strong>. Try Indian, Italian, Spicy, or Vegetarian.</p>
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-4">
            <p className="text-sm text-gray-400 font-medium uppercase tracking-wide">
              Top 3 for &quot;{submitted}&quot;
            </p>
            {results.slice(0, 3).map((food, i) => (
              <div
                key={food.name}
                className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-start gap-4 hover:shadow-md transition-shadow"
              >
                <div className="text-4xl shrink-0">{food.emoji}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">
                      #{i + 1}
                    </span>
                    <span className="text-xs text-gray-400">{food.tag}</span>
                  </div>
                  <h2 className="text-lg font-bold text-gray-800">{food.name}</h2>
                  <p className="text-sm text-gray-500 mt-0.5">{food.desc}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {!searched && (
          <div className="text-center text-gray-300 py-12">
            <span className="text-5xl block mb-3">🔍</span>
            <p className="text-sm">Start typing to discover great food</p>
          </div>
        )}
      </div>
    </main>
  );
}
