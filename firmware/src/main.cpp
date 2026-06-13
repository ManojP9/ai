// main.cpp — AI Baby Companion · Phase 1 bring-up firmware.
// Boots, runs a one-shot bring-up sequence, then exposes a serial menu so each
// subsystem can be re-tested on demand. Open the serial monitor at 115200 baud.
#include <Arduino.h>
#include "bringup.h"

static void printMenu() {
  Serial.println(F("\n==== AI Baby Companion · Phase-1 bring-up ===="));
  Serial.println(F("  1  power rail checklist"));
  Serial.println(F("  2  I2C bus scan"));
  Serial.println(F("  3  mic capture test"));
  Serial.println(F("  4  speaker tone test"));
  Serial.println(F("  5  eyes (RGB) demo"));
  Serial.println(F("  6  touch monitor (10s)"));
  Serial.println(F("  7  servo sweep (all)"));
  Serial.println(F("  8  Wi-Fi join test"));
  Serial.println(F("  9  start BLE advertising"));
  Serial.println(F("  a  run full sequence"));
  Serial.println(F("  ?  show this menu"));
  Serial.print(F("> "));
}

static void runAll() {
  bringup::powerCheck();
  bringup::i2cScan();
  bringup::micCaptureTest();
  bringup::speakerToneTest();
  bringup::eyesDemo();
  bringup::touchMonitor(10000);
  bringup::servoSweepAll();
  bringup::wifiConnectTest();
  bringup::bleAdvertiseStart();
  Serial.println(F("\n== full bring-up sequence complete =="));
}

void setup() {
  Serial.begin(115200);
  delay(800);
  Serial.println(F("\nboot: AI Baby Companion firmware (Phase 1)"));

  // One-time hardware init for the always-on subsystems.
  bringup::eyesInit();
  bringup::touchInit();
  bringup::audioInit();
  bringup::servosInit();

  printMenu();
}

void loop() {
  if (!Serial.available()) { delay(10); return; }
  const char c = Serial.read();
  if (c == '\n' || c == '\r') return;

  switch (c) {
    case '1': bringup::powerCheck(); break;
    case '2': bringup::i2cScan(); break;
    case '3': bringup::micCaptureTest(); break;
    case '4': bringup::speakerToneTest(); break;
    case '5': bringup::eyesDemo(); break;
    case '6': bringup::touchMonitor(10000); break;
    case '7': bringup::servoSweepAll(); break;
    case '8': bringup::wifiConnectTest(); break;
    case '9': bringup::bleAdvertiseStart(); break;
    case 'a': case 'A': runAll(); break;
    case '?': printMenu(); return;
    default:  Serial.printf("  unknown option '%c'\n", c); break;
  }
  Serial.print(F("\n> "));
}
