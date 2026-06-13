// pins.h — single source of truth for AI Baby Companion GPIO assignments.
// Derived from ai_baby_companion_ELECTRICAL_CONNECTIONS.json (ESP32-S3-WROOM-1).
//
// ⚠️ KNOWN SPEC CONFLICT: the camera DVP data lines D4/D5/D6 (GPIO1/2/3) collide
// with the three TTP223 touch sensors (GPIO1/2/3). The camera and touch sensors
// therefore cannot both be wired as specified. Phase-1 bring-up tests each
// subsystem on its own, so this is tolerable for diagnostics, but the wiring must
// be resolved before camera + touch run together (move touch to free pins, e.g.
// GPIO40/41/42, or use a camera with a parallel-to-SPI bridge). See README.
#pragma once

// ── Shared I2C bus (camera SCCB, MPU6050 IMU, BH1750/BME280, PCA9685) ──
#define PIN_I2C_SDA        20
#define PIN_I2C_SCL        19

// ── Camera OV2640 (DVP) ──
#define PIN_CAM_D0         11
#define PIN_CAM_D1         12
#define PIN_CAM_D2         13
#define PIN_CAM_D3         14
#define PIN_CAM_D4          1   // conflicts with PIN_TOUCH_LEFT
#define PIN_CAM_D5          2   // conflicts with PIN_TOUCH_RIGHT
#define PIN_CAM_D6          3   // conflicts with PIN_TOUCH_HEAD
#define PIN_CAM_D7          4
#define PIN_CAM_PCLK        5
#define PIN_CAM_VSYNC       6
#define PIN_CAM_HSYNC       7
#define PIN_CAM_XCLK        8

// ── Microphone SPH0645 (I2S input) ──
#define PIN_MIC_SCK        15
#define PIN_MIC_WS         16
#define PIN_MIC_SD         17

// ── Speaker amp (audio out) ──
// Spec routes GPIO18 to PAM8403 L_IN. The ESP32-S3 has NO DAC, and PAM8403 is an
// analog-input amp, so true PCM playback needs an I2S DAC amp (e.g. MAX98357A).
// For Phase-1 the speaker path is exercised with a LEDC PWM tone on this pin.
#define PIN_AUDIO_OUT      18

// ── Capacitive touch (TTP223, active-high) ──
#define PIN_TOUCH_LEFT      1   // see camera conflict note above
#define PIN_TOUCH_RIGHT     2
#define PIN_TOUCH_HEAD      3

// ── Eyes (WS2812B, one pixel each) ──
#define PIN_EYE_LEFT        9
#define PIN_EYE_RIGHT      10

// ── PCA9685 servo channels (PWM0..PWM8) ──
#define SERVO_HEAD_PITCH        0
#define SERVO_HEAD_YAW          1
#define SERVO_L_SHOULDER_ROLL   2
#define SERVO_L_SHOULDER_PITCH  3
#define SERVO_L_ELBOW           4
#define SERVO_R_SHOULDER_ROLL   5
#define SERVO_R_SHOULDER_PITCH  6
#define SERVO_R_ELBOW           7
#define SERVO_WAIST_YAW         8
#define SERVO_COUNT             9

// ── Optional battery sense (not in BOM wiring; set to -1 if unused) ──
#define PIN_BATTERY_ADC    -1
