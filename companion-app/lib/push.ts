// push.ts — register for Expo push notifications and send the token to the backend
// (Phase-4 task: push notifications).
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { API_BASE } from "./constants";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/** Ask permission, get an Expo push token, and register it with the backend. */
export async function registerForPush(childId: string): Promise<string | null> {
  if (!Device.isDevice) return null; // push needs a physical device

  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;
  if (status !== "granted") {
    status = (await Notifications.requestPermissionsAsync()).status;
  }
  if (status !== "granted") return null;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  // projectId comes from app config (EAS). Wrapped so a missing id doesn't crash.
  const tokenResp = await Notifications.getExpoPushTokenAsync().catch(() => null);
  const token = tokenResp?.data;
  if (!token) return null;

  await fetch(`${API_BASE}/api/companion/push`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ childId, token }),
  }).catch(() => {});

  return token;
}
