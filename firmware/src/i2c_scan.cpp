// i2c_scan.cpp — Task 2: I2C bus bring-up.
// Scans the shared bus and reports which expected devices answered.
#include "bringup.h"
#include "pins.h"
#include "config.h"
#include <Wire.h>

namespace bringup {

struct Expected { uint8_t addr; const char* name; };

static const Expected kExpected[] = {
  { ADDR_PCA9685, "PCA9685 servo driver" },
  { ADDR_MPU6050, "MPU6050 IMU" },
  { ADDR_BH1750,  "BH1750 ambient light" },
  { ADDR_BME280,  "BME280 temp/humidity" },
  { ADDR_OV2640,  "OV2640 camera (SCCB)" },
};

static bool present(uint8_t addr) {
  Wire.beginTransmission(addr);
  return Wire.endTransmission() == 0;
}

void i2cScan() {
  Serial.println(F("\n[2] I2C BUS SCAN"));
  static bool begun = false;
  if (!begun) { Wire.begin(PIN_I2C_SDA, PIN_I2C_SCL); begun = true; }

  int found = 0;
  for (uint8_t a = 1; a < 127; a++) {
    if (present(a)) { Serial.printf("  found device @ 0x%02X\n", a); found++; }
  }
  Serial.printf("  %d device(s) on the bus.\n", found);

  Serial.println(F("  Expected devices:"));
  for (const auto& e : kExpected) {
    Serial.printf("    [%s] 0x%02X  %s\n", present(e.addr) ? "OK" : "--", e.addr, e.name);
  }
  Serial.println(F("  (camera at 0x30 may need XCLK running before it ACKs)"));
}

} // namespace bringup
