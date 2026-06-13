// privacy.tsx — parental controls, consent, data export & deletion (Phase-5 task).
import { useEffect, useState } from "react";
import { View, Text, TextInput, Pressable, Switch, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { API_BASE, STORAGE } from "@/lib/constants";

export default function Privacy() {
  const router = useRouter();
  const [childId, setChildId] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [consented, setConsented] = useState(false);
  const [mic, setMic] = useState(true);
  const [camera, setCamera] = useState(true);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const id = (await SecureStore.getItemAsync(STORAGE.PAIRED_DEVICE_ID)) || "default-child";
      setChildId(id);
      try {
        const res = await fetch(`${API_BASE}/api/companion/privacy?childId=${encodeURIComponent(id)}`);
        if (res.ok) {
          const { controls } = await res.json();
          setConsented(controls.consented);
          setMic(controls.micEnabled);
          setCamera(controls.cameraEnabled);
          setParentEmail(controls.consentParentEmail ?? "");
        }
      } catch {
        // keep defaults
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function post(action: string, extra: object) {
    setBusy(true);
    try {
      const res = await fetch(`${API_BASE}/api/companion/privacy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ childId, action, ...extra }),
      });
      if (!res.ok) throw new Error((await res.json()).error || `HTTP ${res.status}`);
      const c = await res.json();
      setConsented(c.consented);
      setMic(c.micEnabled);
      setCamera(c.cameraEnabled);
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "request failed");
    } finally {
      setBusy(false);
    }
  }

  function confirmDelete() {
    Alert.alert("Delete all data?", "This permanently erases your companion's conversations, memory, settings, and logs. This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete everything",
        style: "destructive",
        onPress: async () => {
          setBusy(true);
          try {
            const res = await fetch(`${API_BASE}/api/companion/privacy?childId=${encodeURIComponent(childId)}`, { method: "DELETE" });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            Alert.alert("Done", "All data has been deleted.");
            router.back();
          } catch (e) {
            Alert.alert("Error", e instanceof Error ? e.message : "delete failed");
          } finally {
            setBusy(false);
          }
        },
      },
    ]);
  }

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color="#1fb6a6" />;

  return (
    <View style={styles.container}>
      <Text style={styles.section}>Parental consent</Text>
      <Text style={styles.note}>
        {consented ? "✅ Consent on file. Data may be collected." : "⚠️ Not consented — the companion will not record or process anything until you opt in."}
      </Text>
      <TextInput style={styles.input} value={parentEmail} onChangeText={setParentEmail} placeholder="Parent email" autoCapitalize="none" keyboardType="email-address" />
      <Pressable style={[styles.button, busy && styles.disabled]} disabled={busy} onPress={() => post("consent", { parentEmail })}>
        <Text style={styles.buttonText}>{consented ? "Update consent" : "I consent"}</Text>
      </Pressable>

      <Text style={styles.section}>Sensors</Text>
      <Row label="Microphone" value={mic} onChange={(v) => { setMic(v); post("controls", { micEnabled: v, cameraEnabled: camera }); }} />
      <Row label="Camera" value={camera} onChange={(v) => { setCamera(v); post("controls", { micEnabled: mic, cameraEnabled: v }); }} />

      <Text style={styles.section}>Your data</Text>
      <Pressable style={styles.buttonGhost} onPress={() => router.push(`/`)}>
        <Text style={styles.buttonGhostText}>View activity log (on device page)</Text>
      </Pressable>
      <Pressable style={[styles.buttonDanger, busy && styles.disabled]} disabled={busy} onPress={confirmDelete}>
        <Text style={styles.buttonText}>Delete all data</Text>
      </Pressable>
    </View>
  );
}

function Row({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: "#1fb6a6" }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: "#fef9f4" },
  section: { fontSize: 16, fontWeight: "800", color: "#2a2433", marginTop: 22, marginBottom: 8 },
  note: { color: "#6b6577", fontSize: 14, marginBottom: 10 },
  input: { backgroundColor: "#fff", borderRadius: 12, padding: 14, fontSize: 16, borderWidth: 1, borderColor: "#ece4da" },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10 },
  rowLabel: { fontSize: 16, color: "#2a2433" },
  button: { backgroundColor: "#1fb6a6", borderRadius: 999, padding: 14, alignItems: "center", marginTop: 12 },
  buttonGhost: { borderRadius: 999, padding: 14, alignItems: "center", marginTop: 8, borderWidth: 1, borderColor: "#1fb6a6" },
  buttonGhostText: { color: "#1fb6a6", fontWeight: "700" },
  buttonDanger: { backgroundColor: "#e03131", borderRadius: 999, padding: 14, alignItems: "center", marginTop: 12 },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  disabled: { opacity: 0.6 },
});
