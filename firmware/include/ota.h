// ota.h — over-the-air firmware update (Phase 5, task: OTA updates).
#pragma once
#include <Arduino.h>

namespace ota {

// Current firmware version baked into the build. Bump on each release.
constexpr const char* FW_VERSION = "1.0.0";

// Polls the manifest URL (the backend's /api/companion/firmware). If it advertises a
// newer version, downloads and applies it over HTTPS, then reboots. Returns false if
// already up to date or on error. Requires Wi-Fi to be connected first.
//
// Production hardening (not done here): enable ESP32 Secure Boot + signed app
// partitions, and verify the manifest sha256 against the downloaded image before
// applying so a compromised server can't push arbitrary firmware.
bool checkAndUpdate(const char* manifestUrl);

} // namespace ota
