// sign-in.tsx — parent login (Phase-3 task: auth).
import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { useAuth } from "@/lib/auth";

export default function SignIn() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit() {
    if (!email.includes("@")) return;
    setBusy(true);
    try {
      await signIn(email.trim());
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>🤖</Text>
      <Text style={styles.title}>AI Baby Companion</Text>
      <Text style={styles.subtitle}>Sign in to set up and control your companion.</Text>
      <TextInput
        style={styles.input}
        placeholder="Parent email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <Pressable style={[styles.button, busy && styles.disabled]} onPress={onSubmit} disabled={busy}>
        <Text style={styles.buttonText}>{busy ? "Signing in…" : "Continue"}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 28, backgroundColor: "#fef9f4" },
  emoji: { fontSize: 56, textAlign: "center" },
  title: { fontSize: 26, fontWeight: "800", textAlign: "center", marginTop: 8, color: "#2a2433" },
  subtitle: { fontSize: 15, textAlign: "center", color: "#6b6577", marginVertical: 12 },
  input: { backgroundColor: "#fff", borderRadius: 12, padding: 14, fontSize: 16, borderWidth: 1, borderColor: "#ece4da", marginTop: 12 },
  button: { backgroundColor: "#1fb6a6", borderRadius: 999, padding: 16, alignItems: "center", marginTop: 16 },
  disabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
