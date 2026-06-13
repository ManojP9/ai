// index.tsx — home: device status + battery (Phase-3 task: device status).
import { useCallback, useState } from "react";
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { connect, disconnect, readBattery, readStatus, DeviceStatus } from "@/lib/ble";
import { STORAGE } from "@/lib/constants";
import { useAuth } from "@/lib/auth";

export default function Home() {
  const router = useRouter();
  const { signOut } = useAuth();
  const [pairedId, setPairedId] = useState<string | null>(null);
  const [battery, setBattery] = useState<number | null>(null);
  const [status, setStatus] = useState<DeviceStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        setLoading(true);
        const id = await SecureStore.getItemAsync(STORAGE.PAIRED_DEVICE_ID);
        if (!active) return;
        setPairedId(id);
        if (id) {
          try {
            const device = await connect(id);
            if (!active) return;
            setBattery(await readBattery(device));
            setStatus(await readStatus(device));
            await disconnect(id);
          } catch {
            setStatus({ online: false });
          }
        }
        setLoading(false);
      })();
      return () => {
        active = false;
      };
    }, []),
  );

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color="#1fb6a6" />;

  if (!pairedId) {
    return (
      <View style={styles.container}>
        <Text style={styles.emoji}>🔌</Text>
        <Text style={styles.title}>No companion paired yet</Text>
        <Pressable style={styles.button} onPress={() => router.push("/pair")}>
          <Text style={styles.buttonText}>Pair a device</Text>
        </Pressable>
        <Pressable onPress={signOut}><Text style={styles.link}>Sign out</Text></Pressable>
      </View>
    );
  }

  const online = status?.online;
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>{online ? "🤖" : "😴"}</Text>
      <Text style={styles.title}>{online ? "Companion is online" : "Companion is offline"}</Text>
      <View style={styles.card}>
        <Row label="Status" value={online ? "Online" : "Offline"} />
        <Row label="Battery" value={battery != null ? `${battery}%` : "—"} />
        <Row label="Wi-Fi" value={status?.wifi || "Not connected"} />
      </View>
      <Pressable style={styles.button} onPress={() => router.push("/settings")}>
        <Text style={styles.buttonText}>Settings</Text>
      </Pressable>
      <Pressable style={styles.buttonGhost} onPress={() => router.push("/provision")}>
        <Text style={styles.buttonGhostText}>Change Wi-Fi</Text>
      </Pressable>
      <Pressable onPress={signOut}><Text style={styles.link}>Sign out</Text></Pressable>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", padding: 24, backgroundColor: "#fef9f4" },
  emoji: { fontSize: 64, marginTop: 24 },
  title: { fontSize: 22, fontWeight: "800", color: "#2a2433", marginVertical: 12 },
  card: { width: "100%", backgroundColor: "#fff", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#ece4da", marginVertical: 12 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8 },
  rowLabel: { color: "#6b6577", fontSize: 15 },
  rowValue: { color: "#2a2433", fontSize: 15, fontWeight: "600" },
  button: { backgroundColor: "#1fb6a6", borderRadius: 999, paddingVertical: 14, paddingHorizontal: 32, marginTop: 12, width: "100%", alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  buttonGhost: { borderRadius: 999, paddingVertical: 14, paddingHorizontal: 32, marginTop: 10, width: "100%", alignItems: "center", borderWidth: 1, borderColor: "#1fb6a6" },
  buttonGhostText: { color: "#1fb6a6", fontWeight: "700", fontSize: 16 },
  link: { color: "#6b6577", marginTop: 18, textDecorationLine: "underline" },
});
