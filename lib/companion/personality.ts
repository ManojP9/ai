// personality.ts — personality presets + trait → prompt fragment (Phase 4, task: personality customization).
export const PERSONALITY_PRESETS = ["playful", "gentle", "curious", "sleepy_calm"] as const;
export type PersonalityPreset = (typeof PERSONALITY_PRESETS)[number];

export type Traits = {
  energy: number; // 0-100, how lively/bouncy
  talkativeness: number; // 0-100, how much it says
};

export const DEFAULT_TRAITS: Traits = { energy: 60, talkativeness: 50 };

const PRESET_PROMPT: Record<PersonalityPreset, string> = {
  playful: "You are playful and giggly. You love games, silly jokes, and make-believe.",
  gentle: "You are gentle and soothing. You speak softly and reassuringly.",
  curious: "You are curious and wondering. You ask little questions and marvel at things.",
  sleepy_calm: "You are calm and a little sleepy. You speak slowly and cozily.",
};

export function personalityPrompt(preset: PersonalityPreset, traits: Traits): string {
  const energy =
    traits.energy >= 70 ? "Be lively and bouncy." : traits.energy <= 30 ? "Be mellow and slow-paced." : "";
  const talk =
    traits.talkativeness >= 70
      ? "You may use up to 3 short sentences."
      : traits.talkativeness <= 30
        ? "Keep it to a single short sentence."
        : "Keep it to 1–2 short sentences.";
  return [PRESET_PROMPT[preset] ?? PRESET_PROMPT.gentle, energy, talk].filter(Boolean).join(" ");
}
