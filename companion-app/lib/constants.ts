// constants.ts — BLE GATT contract shared with the ESP32-S3 firmware, plus storage keys.
// These UUIDs must match the provisioning service the firmware exposes (a Phase-3
// firmware addition; Phase-1 firmware only advertises Device Information 0x180A).

export const BLE = {
  // Custom provisioning service + characteristics
  SERVICE: "6e500001-b5a3-f393-e0a9-e50e24dcca9e",
  CHAR_WIFI_SSID: "6e500002-b5a3-f393-e0a9-e50e24dcca9e", // write
  CHAR_WIFI_PASS: "6e500003-b5a3-f393-e0a9-e50e24dcca9e", // write
  CHAR_WIFI_APPLY: "6e500004-b5a3-f393-e0a9-e50e24dcca9e", // write (1 = connect)
  CHAR_STATUS: "6e500005-b5a3-f393-e0a9-e50e24dcca9e", // read/notify (JSON)
  CHAR_BATTERY: "6e500006-b5a3-f393-e0a9-e50e24dcca9e", // read/notify (0-100)
  CHAR_SETTINGS: "6e500007-b5a3-f393-e0a9-e50e24dcca9e", // read/write (JSON)
  DEVICE_NAME: "AI-Baby-Companion",
} as const;

export const STORAGE = {
  AUTH_TOKEN: "companion.authToken",
  PAIRED_DEVICE_ID: "companion.pairedDeviceId",
} as const;

export type CompanionSettings = {
  volume: number; // 0-100
  eyeColor: string; // hex, e.g. "#1fb6a6"
  sleepStart: string; // "HH:MM"
  sleepEnd: string; // "HH:MM"
};

export const DEFAULT_SETTINGS: CompanionSettings = {
  volume: 60,
  eyeColor: "#1fb6a6",
  sleepStart: "20:00",
  sleepEnd: "07:00",
};
