// settings.tsx — volume, eye color, sleep schedule (Phase-3 task: basic settings).
import { useEffect, useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { connect, disconnect, readSettings, writeSettings } from "@/lib/ble";
import { STORAGE, DEFAULT_SETTINGS, CompanionSettings } from "@/lib/constants";

const EYE_COLORS = ["#1fb6a6", "#4dabf7", "#ff6b6b", "#ffa94d", "#cc5de8"];

export default function Settings() {
  const router = useRouter();
  const [settings, setSettings] = useState<CompanionSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      const id = await SecureStore.getItemAsync(STORAGE.PAIRED_DEVICE_ID);
      if (!id) {
        setLoading(false);
        return;
      }
      try {
        const device = await connect(id);
        const current = await readSettings(device);
        await disconnect(id);
        setSettings({ ...DEFAULT_SETTINGS, ...current });
      } catch {
        // fall back to defaults if the device isn't reachable
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function save() {
    const id = await SecureStore.getItemAsync(STORAGE.PAIRED_DEVICE_ID);
    if (!id) {
      setError("No paired device.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const device = await connect(id);
      await writeSettings(device, settings);
      await disconnect(id);
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : "save failed");
    } finally {
      setSaving(false);
    }
  }

  function set<K extends keyof CompanionSettings>(key: K, value: CompanionSettings[K]) {
    setSettings((s) => ({ ...s, [key]: value }));
  }

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color="#1fb6a6" />;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Volume: {settings.volume}%</Text>
      <View style={styles.volRow}>
        {[20, 40, 60, 80, 100].map((v) => (
          <Pressable
            key={v}
            style={[styles.volChip, settings.volume === v && styles.volChipActive]}
            onPress={() => set("volume", v)}
          >
            <Text style={settings.volume === v ? styles.volChipTextActive : styles.volChipText}>{v}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Eye color</Text>
      <View style={styles.colorRow}>
        {EYE_COLORS.map((c) => (
          <Pressable
            key={c}
            onPress={() => set("eyeColor", c)}
            style={[styles.swatch, { backgroundColor: c }, settings.eyeColor === c && styles.swatchActive]}
          />
        ))}
      </View>

      <Text style={styles.label}>Sleep schedule</Text>
      <View style={styles.timeRow}>
        <View style={styles.timeBox}>
          <Text style={styles.timeLabel}>Sleep at</Text>
          <TextInput style={styles.timeInput} value={settings.sleepStart} onChangeText={(t) => set("sleepStart", t)} placeholder="20:00" />
        </View>
        <View style={styles.timeBox}>
          <Text style={styles.timeLabel}>Wake at</Text>
          <TextInput style={styles.timeInput} value={settings.sleepEnd} onChangeText={(t) => set("sleepEnd", t)} placeholder="07:00" />
        </View>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable style={[styles.button, saving && styles.disabled]} onPress={save} disabled={saving}>
        <Text style={styles.buttonText}>{saving ? "Saving…" : "Save to companion"}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: "#fef9f4" },
  label: { fontSize: 16, fontWeight: "700", color: "#2a2433", marginTop: 18, marginBottom: 8 },
  volRow: { flexDirection: "row", gap: 8 },
  volChip: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: "#fff", borderWidth: 1, borderColor: "#ece4da", alignItems: "center" },
  volChipActive: { backgroundColor: "#1fb6a6", borderColor: "#1fb6a6" },
  volChipText: { color: "#6b6577", fontWeight: "600" },
  volChipTextActive: { color: "#fff", fontWeight: "700" },
  colorRow: { flexDirection: "row", gap: 12 },
  swatch: { width: 40, height: 40, borderRadius: 20, borderWidth: 3, borderColor: "transparent" },
  swatchActive: { borderColor: "#2a2433" },
  timeRow: { flexDirection: "row", gap: 12 },
  timeBox: { flex: 1 },
  timeLabel: { color: "#6b6577", fontSize: 13, marginBottom: 4 },
  timeInput: { backgroundColor: "#fff", borderRadius: 12, padding: 12, fontSize: 16, borderWidth: 1, borderColor: "#ece4da" },
  error: { color: "#e03131", marginTop: 12 },
  button: { backgroundColor: "#1fb6a6", borderRadius: 999, padding: 16, alignItems: "center", marginTop: 24 },
  disabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
