// bringup.h — declarations for each Phase-1 bring-up subsystem.
// Each maps to a task in the companion_plan Phase 1 (Firmware Bring-up).
#pragma once
#include <Arduino.h>

namespace bringup {

// Task 1 — power rails: prints a manual verification checklist and, if a battery
// ADC pin is configured, reports the measured pack voltage.
void powerCheck();

// Task 2 — I2C bus: scan the bus and report which expected devices responded.
void i2cScan();

// Task 3 — audio path: capture from the I2S mic (report level) and emit a test
// tone on the speaker path.
void audioInit();
void micCaptureTest();
void speakerToneTest();

// Task 4 — touch + eyes: cycle the RGB eyes and live-report touch sensor state.
void eyesInit();
void eyesDemo();
void touchInit();
void touchMonitor(uint32_t durationMs);

// Task 5 — servos: init the PCA9685 and sweep/center the 9 servos.
bool servosInit();
void servoCenterAll();
void servoSweep(uint8_t channel);
void servoSweepAll();

// Task 6 — connectivity: join Wi-Fi (if configured) and start BLE advertising.
void wifiConnectTest();
void bleAdvertiseStart();

} // namespace bringup
