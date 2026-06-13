// provision.tsx — Wi-Fi provisioning over BLE (Phase-3 task: Wi-Fi provisioning).
import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { connect, disconnect, provisionWifi } from "@/lib/ble";
import { STORAGE } from "@/lib/constants";

export default function Provision() {
  const router = useRouter();
  const [ssid, setSsid] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    if (!ssid) return;
    const id = await SecureStore.getItemAsync(STORAGE.PAIRED_DEVICE_ID);
    if (!id) {
      setError("No paired device. Pair first.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const device = await connect(id);
      await provisionWifi(device, ssid, password);
      await disconnect(id);
      router.replace("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "provisioning failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.hint}>Give your companion the home Wi-Fi so it can reach the cloud.</Text>
      <TextInput style={styles.input} placeholder="Wi-Fi network (SSID)" autoCapitalize="none" value={ssid} onChangeText={setSsid} />
      <TextInput style={styles.input} placeholder="Wi-Fi password" secureTextEntry value={password} onChangeText={setPassword} />
      <Text style={styles.note}>Tip: the companion needs a 2.4 GHz network.</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable style={[styles.button, busy && styles.disabled]} onPress={submit} disabled={busy}>
        <Text style={styles.buttonText}>{busy ? "Sending…" : "Connect"}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: "#fef9f4" },
  hint: { color: "#6b6577", fontSize: 15, marginBottom: 12 },
  input: { backgroundColor: "#fff", borderRadius: 12, padding: 14, fontSize: 16, borderWidth: 1, borderColor: "#ece4da", marginVertical: 6 },
  note: { color: "#8a5a3a", fontSize: 12, marginTop: 4 },
  error: { color: "#e03131", marginTop: 8 },
  button: { backgroundColor: "#1fb6a6", borderRadius: 999, padding: 16, alignItems: "center", marginTop: 16 },
  disabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
