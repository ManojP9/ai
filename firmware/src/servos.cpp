// servos.cpp — Task 5: servo bring-up via PCA9685.
#include "bringup.h"
#include "pins.h"
#include "config.h"
#include <Wire.h>
#include <Adafruit_PWMServoDriver.h>

namespace bringup {

static Adafruit_PWMServoDriver pca(ADDR_PCA9685);
static bool ready = false;

static const char* kNames[SERVO_COUNT] = {
  "head pitch", "head yaw", "L shoulder roll", "L shoulder pitch", "L elbow",
  "R shoulder roll", "R shoulder pitch", "R elbow", "waist yaw"
};

static void writeMicros(uint8_t ch, int us) {
  if (us < SERVO_US_MIN) us = SERVO_US_MIN;
  if (us > SERVO_US_MAX) us = SERVO_US_MAX;
  pca.writeMicroseconds(ch, us);
}

bool servosInit() {
  Wire.begin(PIN_I2C_SDA, PIN_I2C_SCL);
  if (!pca.begin()) { Serial.println(F("  PCA9685 begin FAILED")); return false; }
  pca.setOscillatorFrequency(27000000);
  pca.setPWMFreq(SERVO_FREQ_HZ);
  ready = true;
  Serial.println(F("  PCA9685 ready @ 50Hz"));
  return true;
}

void servoCenterAll() {
  if (!ready && !servosInit()) return;
  Serial.println(F("  centering all servos"));
  for (uint8_t ch = 0; ch < SERVO_COUNT; ch++) writeMicros(ch, SERVO_US_CENTER);
}

void servoSweep(uint8_t channel) {
  if (!ready && !servosInit()) return;
  if (channel >= SERVO_COUNT) { Serial.println(F("  bad channel")); return; }
  Serial.printf("  sweeping ch%u (%s)\n", channel, kNames[channel]);
  for (int us = SERVO_US_CENTER; us <= SERVO_US_MAX; us += 25) { writeMicros(channel, us); delay(8); }
  for (int us = SERVO_US_MAX; us >= SERVO_US_MIN; us -= 25)    { writeMicros(channel, us); delay(8); }
  for (int us = SERVO_US_MIN; us <= SERVO_US_CENTER; us += 25) { writeMicros(channel, us); delay(8); }
}

void servoSweepAll() {
  Serial.println(F("\n[5] SERVO SWEEP — one channel at a time"));
  if (!ready && !servosInit()) return;
  for (uint8_t ch = 0; ch < SERVO_COUNT; ch++) { servoSweep(ch); delay(150); }
  servoCenterAll();
  Serial.println(F("  done; verify each joint moved through its range"));
}

} // namespace bringup
