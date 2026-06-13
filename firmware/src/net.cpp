// net.cpp — Task 6: connectivity bring-up (Wi-Fi join + BLE advertise).
#include "bringup.h"
#include "config.h"
#include <WiFi.h>
#include <NimBLEDevice.h>

namespace bringup {

void wifiConnectTest() {
  Serial.println(F("\n[6a] WIFI JOIN"));
  if (strlen(WIFI_SSID) == 0) {
    Serial.println(F("  WIFI_SSID blank in config.h — skipping"));
    return;
  }
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.printf("  joining \"%s\"", WIFI_SSID);
  const uint32_t end = millis() + WIFI_TIMEOUT_MS;
  while (WiFi.status() != WL_CONNECTED && millis() < end) { delay(300); Serial.print('.'); }
  Serial.println();
  if (WiFi.status() == WL_CONNECTED) {
    Serial.print(F("  connected, IP="));
    Serial.println(WiFi.localIP());
    Serial.printf("  RSSI=%d dBm\n", WiFi.RSSI());
  } else {
    Serial.println(F("  FAILED to connect (check credentials / 2.4GHz band)"));
  }
}

void bleAdvertiseStart() {
  Serial.println(F("\n[6b] BLE ADVERTISE"));
  NimBLEDevice::init(BLE_DEVICE_NAME);
  NimBLEServer* server = NimBLEDevice::createServer();
  // Minimal service so a phone scanner sees more than just the name.
  NimBLEService* svc = server->createService("180A");          // Device Information
  NimBLECharacteristic* ch =
      svc->createCharacteristic("2A29", NIMBLE_PROPERTY::READ); // Manufacturer Name
  ch->setValue("3C Foods / AI Baby Companion");
  svc->start();

  NimBLEAdvertising* adv = NimBLEDevice::getAdvertising();
  adv->addServiceUUID("180A");
  adv->setName(BLE_DEVICE_NAME);
  adv->start();
  Serial.printf("  advertising as \"%s\" — scan with nRF Connect / your phone\n", BLE_DEVICE_NAME);
}

} // namespace bringup
