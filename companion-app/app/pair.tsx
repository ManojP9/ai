// pair.tsx — BLE scan + connect (Phase-3 task: pairing flow).
import { useEffect, useState } from "react";
import { View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import type { Device } from "react-native-ble-plx";
import { scan, connect, disconnect } from "@/lib/ble";
import { STORAGE } from "@/lib/constants";

export default function Pair() {
  const router = useRouter();
  const [devices, setDevices] = useState<Device[]>([]);
  const [scanning, setScanning] = useState(true);
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const stop = scan(
      (d) => setDevices((prev) => (prev.find((x) => x.id === d.id) ? prev : [...prev, d])),
      (e) => {
        setError(e.message);
        setScanning(false);
      },
    );
    const t = setTimeout(() => {
      stop();
      setScanning(false);
    }, 12000);
    return () => {
      clearTimeout(t);
      stop();
    };
  }, []);

  async function pick(device: Device) {
    setConnectingId(device.id);
    setError("");
    try {
      await connect(device.id);
      await SecureStore.setItemAsync(STORAGE.PAIRED_DEVICE_ID, device.id);
      await disconnect(device.id);
      router.replace("/provision");
    } catch (e) {
      setError(e instanceof Error ? e.message : "connection failed");
      setConnectingId(null);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.hint}>
        Make sure your companion is powered on and nearby.
        {scanning ? " Scanning…" : ""}
      </Text>
      {scanning && <ActivityIndicator color="#1fb6a6" style={{ marginVertical: 12 }} />}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <FlatList
        data={devices}
        keyExtractor={(d) => d.id}
        ListEmptyComponent={!scanning ? <Text style={styles.hint}>No companions found.</Text> : null}
        renderItem={({ item }) => (
          <Pressable style={styles.deviceRow} onPress={() => pick(item)} disabled={!!connectingId}>
            <Text style={styles.deviceName}>{item.name || item.localName || "Companion"}</Text>
            <Text style={styles.deviceMeta}>
              {connectingId === item.id ? "Connecting…" : `RSSI ${item.rssi ?? "?"}`}
            </Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fef9f4" },
  hint: { color: "#6b6577", fontSize: 14, marginBottom: 8 },
  error: { color: "#e03131", marginVertical: 8 },
  deviceRow: { backgroundColor: "#fff", borderRadius: 12, padding: 16, marginVertical: 6, borderWidth: 1, borderColor: "#ece4da", flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  deviceName: { fontSize: 16, fontWeight: "600", color: "#2a2433" },
  deviceMeta: { fontSize: 13, color: "#6b6577" },
});
