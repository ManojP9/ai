// expressions.h — emotion -> physical expression contract (Phase 4).
// Mirrors lib/companion/expressions.ts in the backend. The backend's structured
// reply includes an `emotion`; the device looks it up here to drive the WS2812B
// eyes (RGB + pulse) and a named servo gesture.
//
// Wiring playExpression() into the eyes (touch_leds.cpp) and servos (servos.cpp)
// modules is a follow-up; this header is the single source of truth for the mapping.
#pragma once
#include <stdint.h>
#include <string.h>

namespace expr {

enum class Gesture { Nod, Tilt, Wave, Wiggle, Still, LookUp, Hug };

struct Expression {
  uint8_t r, g, b;   // eye color
  Gesture gesture;
  bool pulse;        // eyes breathe/pulse
};

// Keep these RGB values in sync with the backend hex table.
inline Expression expressionFor(const char* emotion) {
  if (!emotion) return { 0x1f, 0xb6, 0xa6, Gesture::Still, true };        // calm
  if (!strcmp(emotion, "happy"))     return { 0xff, 0xd4, 0x3b, Gesture::Nod,    false };
  if (!strcmp(emotion, "excited"))   return { 0xff, 0x92, 0x2b, Gesture::Wiggle, true  };
  if (!strcmp(emotion, "curious"))   return { 0x4d, 0xab, 0xf7, Gesture::Tilt,   false };
  if (!strcmp(emotion, "sad"))       return { 0x5c, 0x7c, 0xfa, Gesture::LookUp, true  };
  if (!strcmp(emotion, "sleepy"))    return { 0x97, 0x75, 0xfa, Gesture::Still,  true  };
  if (!strcmp(emotion, "surprised")) return { 0xff, 0xff, 0xff, Gesture::LookUp, false };
  if (!strcmp(emotion, "loving"))    return { 0xff, 0x6b, 0x6b, Gesture::Hug,    true  };
  return { 0x1f, 0xb6, 0xa6, Gesture::Still, true };                       // calm (default)
}

} // namespace expr
