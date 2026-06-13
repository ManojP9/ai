# AI Baby Companion — Companion App (Phase 3)

The parent's phone app: pair with the companion over Bluetooth, hand it Wi-Fi,
and control basic settings. Built with **Expo (React Native) + Expo Router**.

Maps to **Phase 3** of the build plan (`companion_plan` table):

| Task | Where |
|------|-------|
| Expo app skeleton + auth | `app/_layout.tsx`, `app/sign-in.tsx`, `lib/auth.tsx` |
| BLE pairing flow | `app/pair.tsx`, `lib/ble.ts` |
| Wi-Fi provisioning | `app/provision.tsx` |
| Basic settings (volume, eye color, sleep) | `app/settings.tsx` |
| Device status (online, battery) | `app/index.tsx` |

## Run

```bash
npm install          # or: npx expo install  (reconciles native versions)
npx expo start       # then open in Expo Go / a dev client
```

BLE requires a **development build or bare device** — it does **not** work in the
standard Expo Go sandbox or a simulator. Build a dev client:

```bash
npx expo run:android   # or: npx expo run:ios
```

## Architecture notes & caveats

- **BLE GATT contract** lives in `lib/constants.ts`. These UUIDs must match a
  **provisioning service the firmware exposes** — that's a Phase-3 firmware
  addition. Phase-1 firmware only advertises Device Information (0x180A), so the
  read/write characteristics here won't resolve until the firmware gains the
  matching service.
- **Auth is a placeholder** (`lib/auth.tsx`): it stores a fake token in
  `SecureStore`. Wire it to a real backend (e.g. the Next.js `/api` auth) before
  production.
- **Not built/run here** — no Expo toolchain or device in this environment. Code
  is written against Expo SDK 51 / `react-native-ble-plx` 3.x and typechecks, but
  needs `npm install` + a device/dev-build to run.

## Next (Phase 4+)
- Personality customization, push notifications, and live status subscriptions
  (BLE notify) build on this skeleton.
