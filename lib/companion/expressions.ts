// expressions.ts — maps an emotion to a physical expression (Phase 4, task: expressive behaviors).
// This is the shared contract between the brain (which picks an emotion), the device
// firmware (which drives eyes + servos), and the browser tester. Keep in sync with the
// firmware's expressions module.

export const EMOTIONS = [
  "happy",
  "excited",
  "calm",
  "curious",
  "sad",
  "sleepy",
  "surprised",
  "loving",
] as const;

export type Emotion = (typeof EMOTIONS)[number];

export type Gesture = "nod" | "tilt" | "wave" | "wiggle" | "still" | "look_up" | "hug";

export type Expression = {
  emotion: Emotion;
  eyeColor: string; // hex for the WS2812B eyes
  gesture: Gesture; // a named servo gesture the firmware knows
  pulse: boolean; // whether the eyes should breathe/pulse
};

const TABLE: Record<Emotion, Omit<Expression, "emotion">> = {
  happy: { eyeColor: "#ffd43b", gesture: "nod", pulse: false },
  excited: { eyeColor: "#ff922b", gesture: "wiggle", pulse: true },
  calm: { eyeColor: "#1fb6a6", gesture: "still", pulse: true },
  curious: { eyeColor: "#4dabf7", gesture: "tilt", pulse: false },
  sad: { eyeColor: "#5c7cfa", gesture: "look_up", pulse: true },
  sleepy: { eyeColor: "#9775fa", gesture: "still", pulse: true },
  surprised: { eyeColor: "#ffffff", gesture: "look_up", pulse: false },
  loving: { eyeColor: "#ff6b6b", gesture: "hug", pulse: true },
};

export function expressionFor(emotion: string): Expression {
  const key = (EMOTIONS as readonly string[]).includes(emotion) ? (emotion as Emotion) : "calm";
  return { emotion: key, ...TABLE[key] };
}
