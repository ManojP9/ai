// _layout.tsx — root navigation + auth gating.
import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { AuthProvider, useAuth } from "@/lib/auth";

function RootNav() {
  const { token, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const onSignIn = segments[0] === "sign-in";
    if (!token && !onSignIn) router.replace("/sign-in");
    else if (token && onSignIn) router.replace("/");
  }, [token, loading, segments, router]);

  return (
    <Stack screenOptions={{ headerTintColor: "#1fb6a6" }}>
      <Stack.Screen name="index" options={{ title: "My Companion" }} />
      <Stack.Screen name="sign-in" options={{ title: "Sign in", headerShown: false }} />
      <Stack.Screen name="pair" options={{ title: "Pair device" }} />
      <Stack.Screen name="provision" options={{ title: "Wi-Fi setup" }} />
      <Stack.Screen name="settings" options={{ title: "Settings" }} />
    </Stack>
  );
}

export default function Layout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <RootNav />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
