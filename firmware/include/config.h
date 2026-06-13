// config.h — build-time configuration for the bring-up firmware.
#pragma once

// ── Wi-Fi (Phase-1 connectivity check). Leave blank to skip the join test. ──
#define WIFI_SSID      ""
#define WIFI_PASSWORD  ""
#define WIFI_TIMEOUT_MS 15000

// ── BLE ──
#define BLE_DEVICE_NAME "AI-Baby-Companion"

// ── I2C device addresses (7-bit) ──
#define ADDR_PCA9685   0x40   // servo driver
#define ADDR_MPU6050   0x68   // IMU
#define ADDR_BH1750    0x23   // ambient light
#define ADDR_BME280    0x76   // temp/humidity (0x77 on some boards)
#define ADDR_OV2640    0x30   // camera SCCB (7-bit)

// ── Audio ──
#define MIC_SAMPLE_RATE   16000
#define MIC_CAPTURE_MS     1000

// ── Servo pulse range (microseconds) for MG90S / MG996R ──
#define SERVO_FREQ_HZ      50
#define SERVO_US_MIN       500
#define SERVO_US_MAX      2500
#define SERVO_US_CENTER   1500
