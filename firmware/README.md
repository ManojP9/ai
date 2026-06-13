# AI Baby Companion — Phase 1 Firmware (Bring-up)

Embedded firmware that gets the **ESP32-S3** talking to every sensor and actuator
on the board. This is diagnostic bring-up firmware: it boots, can run a full
self-test sequence, and exposes a serial menu to exercise each subsystem.

Maps to **Phase 1** of the build plan (`companion_plan` table):

| # | Task | Where |
|---|------|-------|
| 1 | Flash + verify power rails | `power.cpp` (checklist + optional battery ADC) |
| 2 | I2C bus bring-up | `i2c_scan.cpp` (scan + detect PCA9685/MPU6050/BH1750/BME280/OV2640) |
| 3 | Audio path | `audio.cpp` (I2S mic capture + speaker tone) |
| 4 | Touch + RGB eyes | `touch_leds.cpp` (TTP223 read + WS2812B) |
| 5 | Servo calibration | `servos.cpp` (PCA9685 sweep/center, 9 servos) |
| 6 | Connectivity | `net.cpp` (Wi-Fi join + BLE advertise) |

## Build & flash

Requires [PlatformIO](https://platformio.org/) (VS Code extension or `pio` CLI).

```bash
pio run                    # compile
pio run -t upload          # flash over USB-C
pio device monitor -b 115200   # open serial monitor
```

In the monitor, press `a` to run the full sequence, or `1`–`9` to test one
subsystem. Press `?` for the menu.

## ⚠️ Two hardware caveats baked into the spec

1. **Pin conflict (camera vs. touch).** The OV2640 DVP lines D4/D5/D6 are on
   GPIO1/2/3 — the same pins as the three TTP223 touch sensors. They cannot both
   be wired as specified. Bring-up tests each on its own, but before camera + touch
   run together you must move the touch sensors to free pins (e.g. GPIO40/41/42)
   and update `include/pins.h`.

2. **No DAC for audio out.** The ESP32-S3 has no DAC, and the BOM's PAM8403 is an
   analog-input amp. Phase-1 drives the speaker with a LEDC PWM tone (enough to
   confirm the path makes sound). For real voice playback (Phase 2), replace the
   PAM8403 with an I2S DAC amp such as the **MAX98357A** and switch `audio.cpp` to
   I2S TX.

## Config

- Pin map: `include/pins.h` (single source of truth)
- Wi-Fi creds, BLE name, I2C addresses, servo range: `include/config.h`

## Status

Code is written against Arduino-ESP32 core 2.0.x and the libraries pinned in
`platformio.ini`. It has **not been compiled or flashed here** (no ESP toolchain
in this environment) — build it with PlatformIO and report any errors back.
