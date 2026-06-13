// power.cpp — Task 1: power-rail bring-up.
// The ESP32-S3 cannot measure its own 3.3V/5V rails directly, so this prints a
// multimeter checklist. If PIN_BATTERY_ADC is wired (through a divider), it also
// reports the measured pack voltage.
#include "bringup.h"
#include "pins.h"

namespace bringup {

void powerCheck() {
  Serial.println(F("\n[1] POWER RAILS — manual verification"));
  Serial.println(F("  Measure with a multimeter at the distribution points:"));
  Serial.println(F("    - Boost converter output ......... expect ~5.0 V"));
  Serial.println(F("    - Buck converter output .......... expect ~3.3 V"));
  Serial.println(F("    - MCU 3V3 pin .................... expect 3.3 V +/-5%"));
  Serial.println(F("    - Servo driver V+ (5V rail) ...... expect ~5.0 V under load"));

#if PIN_BATTERY_ADC >= 0
  analogReadResolution(12);
  const int raw = analogRead(PIN_BATTERY_ADC);
  // Assumes a 2:1 divider into a 3.3V ADC reference. Adjust DIVIDER for your wiring.
  const float DIVIDER = 2.0f;
  const float v = (raw / 4095.0f) * 3.3f * DIVIDER;
  Serial.printf("  Battery ADC: raw=%d  ~%.2f V\n", raw, v);
#else
  Serial.println(F("  (battery ADC not configured — set PIN_BATTERY_ADC in pins.h)"));
#endif
}

} // namespace bringup
