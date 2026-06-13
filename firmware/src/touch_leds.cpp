// touch_leds.cpp — Task 4: touch sensors + RGB eyes bring-up.
#include "bringup.h"
#include "pins.h"
#include <Adafruit_NeoPixel.h>

namespace bringup {

static Adafruit_NeoPixel eyeL(1, PIN_EYE_LEFT, NEO_GRB + NEO_KHZ800);
static Adafruit_NeoPixel eyeR(1, PIN_EYE_RIGHT, NEO_GRB + NEO_KHZ800);

void eyesInit() {
  eyeL.begin(); eyeR.begin();
  eyeL.setBrightness(60); eyeR.setBrightness(60);
  eyeL.clear(); eyeR.clear(); eyeL.show(); eyeR.show();
}

static void bothEyes(uint8_t r, uint8_t g, uint8_t b) {
  eyeL.setPixelColor(0, eyeL.Color(r, g, b)); eyeL.show();
  eyeR.setPixelColor(0, eyeR.Color(r, g, b)); eyeR.show();
}

void eyesDemo() {
  Serial.println(F("\n[4a] EYES — color cycle"));
  const uint32_t colors[][3] = { {255,0,0}, {0,255,0}, {0,0,255}, {255,255,255} };
  for (auto& c : colors) { bothEyes(c[0], c[1], c[2]); delay(350); }
  // gentle "breathing" pulse
  for (int i = 0; i < 2; i++) {
    for (int b = 0; b <= 80; b += 5) { bothEyes(0, b, b); delay(15); }
    for (int b = 80; b >= 0; b -= 5) { bothEyes(0, b, b); delay(15); }
  }
  bothEyes(0, 0, 0);
  Serial.println(F("  if both eyes lit and pulsed, WS2812B path OK"));
}

void touchInit() {
  pinMode(PIN_TOUCH_LEFT, INPUT);
  pinMode(PIN_TOUCH_RIGHT, INPUT);
  pinMode(PIN_TOUCH_HEAD, INPUT);
}

void touchMonitor(uint32_t durationMs) {
  Serial.println(F("\n[4b] TOUCH — tap left hand / right hand / head"));
  Serial.println(F("  (note: these pins overlap camera D4-D6; test with camera unplugged)"));
  const uint32_t end = millis() + durationMs;
  int pl = -1, pr = -1, ph = -1;
  while (millis() < end) {
    const int l = digitalRead(PIN_TOUCH_LEFT);
    const int r = digitalRead(PIN_TOUCH_RIGHT);
    const int h = digitalRead(PIN_TOUCH_HEAD);
    if (l != pl || r != pr || h != ph) {
      Serial.printf("  L:%d  R:%d  HEAD:%d\n", l, r, h);
      // reflect touch on the eyes for quick visual confirmation
      bothEyes(r ? 120 : 0, l ? 120 : 0, h ? 120 : 0);
      pl = l; pr = r; ph = h;
    }
    delay(20);
  }
  bothEyes(0, 0, 0);
}

} // namespace bringup
