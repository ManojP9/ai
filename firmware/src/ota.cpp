// ota.cpp — HTTPS OTA update for the ESP32-S3 (Phase 5).
#include "ota.h"
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <HTTPUpdate.h>

namespace ota {

// Minimal field extractor for the small manifest JSON (avoids an extra JSON lib).
static String field(const String& json, const char* key) {
  String pat = String("\"") + key + "\"";
  int k = json.indexOf(pat);
  if (k < 0) return "";
  int colon = json.indexOf(':', k);
  if (colon < 0) return "";
  int q1 = json.indexOf('"', colon + 1);
  if (q1 < 0) return "";
  int q2 = json.indexOf('"', q1 + 1);
  if (q2 < 0) return "";
  return json.substring(q1 + 1, q2);
}

bool checkAndUpdate(const char* manifestUrl) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println(F("[ota] Wi-Fi not connected"));
    return false;
  }

  WiFiClientSecure client;
  client.setInsecure(); // TODO: pin the server cert / CA for production

  HTTPClient http;
  if (!http.begin(client, manifestUrl)) {
    Serial.println(F("[ota] manifest begin failed"));
    return false;
  }
  int code = http.GET();
  if (code != HTTP_CODE_OK) {
    Serial.printf("[ota] manifest HTTP %d\n", code);
    http.end();
    return false;
  }
  String body = http.getString();
  http.end();

  String latest = field(body, "version");
  String url = field(body, "url");
  if (latest.length() == 0 || latest == FW_VERSION) {
    Serial.printf("[ota] up to date (%s)\n", FW_VERSION);
    return false;
  }
  if (url.length() == 0) {
    Serial.println(F("[ota] new version advertised but no url"));
    return false;
  }

  Serial.printf("[ota] updating %s -> %s\n", FW_VERSION, latest.c_str());
  httpUpdate.rebootOnUpdate(true);
  t_httpUpdate_return ret = httpUpdate.update(client, url);
  switch (ret) {
    case HTTP_UPDATE_FAILED:
      Serial.printf("[ota] failed: %s\n", httpUpdate.getLastErrorString().c_str());
      return false;
    case HTTP_UPDATE_NO_UPDATES:
      Serial.println(F("[ota] no updates"));
      return false;
    case HTTP_UPDATE_OK:
      Serial.println(F("[ota] ok, rebooting"));
      return true;
  }
  return false;
}

} // namespace ota
