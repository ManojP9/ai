// personality.tsx — choose a personality preset + tune traits (Phase-4 task).
import { useEffect, useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { API_BASE, PERSONALITY_PRESETS, PersonalityPreset, STORAGE } from "@/lib/constants";

const LABELS: Record<PersonalityPreset, string> = {
  playful: "🤸 Playful",
  gentle: "🫧 Gentle",
  curious: "🔭 Curious",
  sleepy_calm: "😴 Calm",
};

export default function Personality() {
  const router = useRouter();
  const [childId, setChildId] = useState<string>("");
  const [childName, setChildName] = useState("");
  const [preset, setPreset] = useState<PersonalityPreset>("gentle");
  const [energy, setEnergy] = useState(60);
  const [talk, setTalk] = useState(50);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      const id = (await SecureStore.getItemAsync(STORAGE.PAIRED_DEVICE_ID)) || "default-child";
      setChildId(id);
      try {
        const res = await fetch(`${API_BASE}/api/companion/profile?childId=${encodeURIComponent(id)}`);
        if (res.ok) {
          const p = await res.json();
          setChildName(p.childName ?? "");
          setPreset(p.personality ?? "gentle");
          setEnergy(p.traits?.energy ?? 60);
          setTalk(p.traits?.talkativeness ?? 50);
        }
      } catch {
        // keep defaults
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function save() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/companion/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childId,
          childName: childName || null,
          personality: preset,
          traits: { energy, talkativeness: talk },
        }),
      });
      if (!res.ok) throw new Error(`Save failed (${res.status})`);
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : "save failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color="#1fb6a6" />;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Child's name</Text>
      <TextInput style={styles.input} value={childName} onChangeText={setChildName} placeholder="e.g. Maya" />

      <Text style={styles.label}>Personality</Text>
      <View style={styles.grid}>
        {PERSONALITY_PRESETS.map((p) => (
          <Pressable
            key={p}
            style={[styles.chip, preset === p && styles.chipActive]}
            onPress={() => setPreset(p)}
          >
            <Text style={preset === p ? styles.chipTextActive : styles.chipText}>{LABELS[p]}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Energy: {energy}</Text>
      <Stepper value={energy} onChange={setEnergy} />
      <Text style={styles.label}>Talkativeness: {talk}</Text>
      <Stepper value={talk} onChange={setTalk} />

      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable style={[styles.button, saving && styles.disabled]} onPress={save} disabled={saving}>
        <Text style={styles.buttonText}>{saving ? "Saving…" : "Save personality"}</Text>
      </Pressable>
    </View>
  );
}

function Stepper({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const clamp = (v: number) => Math.max(0, Math.min(100, v));
  return (
    <View style={styles.stepper}>
      <Pressable style={styles.stepBtn} onPress={() => onChange(clamp(value - 20))}>
        <Text style={styles.stepBtnText}>−</Text>
      </Pressable>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${value}%` }]} />
      </View>
      <Pressable style={styles.stepBtn} onPress={() => onChange(clamp(value + 20))}>
        <Text style={styles.stepBtnText}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: "#fef9f4" },
  label: { fontSize: 16, fontWeight: "700", color: "#2a2433", marginTop: 18, marginBottom: 8 },
  input: { backgroundColor: "#fff", borderRadius: 12, padding: 14, fontSize: 16, borderWidth: 1, borderColor: "#ece4da" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  chip: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, backgroundColor: "#fff", borderWidth: 1, borderColor: "#ece4da" },
  chipActive: { backgroundColor: "#1fb6a6", borderColor: "#1fb6a6" },
  chipText: { color: "#2a2433", fontWeight: "600" },
  chipTextActive: { color: "#fff", fontWeight: "700" },
  stepper: { flexDirection: "row", alignItems: "center", gap: 12 },
  stepBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#1fb6a6", alignItems: "center", justifyContent: "center" },
  stepBtnText: { color: "#fff", fontSize: 22, fontWeight: "800" },
  track: { flex: 1, height: 10, borderRadius: 999, backgroundColor: "#ece4da", overflow: "hidden" },
  fill: { height: "100%", backgroundColor: "#1fb6a6" },
  error: { color: "#e03131", marginTop: 12 },
  button: { backgroundColor: "#1fb6a6", borderRadius: 999, padding: 16, alignItems: "center", marginTop: 24 },
  disabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
