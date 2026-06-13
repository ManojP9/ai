// ble.ts — BLE manager wrapping react-native-ble-plx for the companion device.
// Covers Phase-3 tasks: pairing (scan/connect), Wi-Fi provisioning, settings, status.
import { BleManager, Device } from "react-native-ble-plx";
import { encode as b64encode, decode as b64decode } from "base-64";
import { BLE, CompanionSettings } from "./constants";

const manager = new BleManager();

export type DeviceStatus = { online: boolean; wifi?: string; ip?: string };

function toB64(s: string) {
  return b64encode(s);
}
function fromB64(s: string | null | undefined) {
  return s ? b64decode(s) : "";
}

/** Scan for companion devices. Returns an unsubscribe function. */
export function scan(onFound: (d: Device) => void, onError: (e: Error) => void): () => void {
  manager.startDeviceScan([BLE.SERVICE], { allowDuplicates: false }, (error, device) => {
    if (error) return onError(error);
    if (device && (device.name === BLE.DEVICE_NAME || device.localName === BLE.DEVICE_NAME)) {
      onFound(device);
    }
  });
  return () => manager.stopDeviceScan();
}

export async function connect(deviceId: string): Promise<Device> {
  manager.stopDeviceScan();
  const device = await manager.connectToDevice(deviceId, { timeout: 10000 });
  await device.discoverAllServicesAndCharacteristics();
  return device;
}

export async function disconnect(deviceId: string) {
  await manager.cancelDeviceConnection(deviceId).catch(() => {});
}

/** Send Wi-Fi credentials and tell the device to connect. */
export async function provisionWifi(device: Device, ssid: string, password: string) {
  await device.writeCharacteristicWithResponseForService(BLE.SERVICE, BLE.CHAR_WIFI_SSID, toB64(ssid));
  await device.writeCharacteristicWithResponseForService(BLE.SERVICE, BLE.CHAR_WIFI_PASS, toB64(password));
  await device.writeCharacteristicWithResponseForService(BLE.SERVICE, BLE.CHAR_WIFI_APPLY, toB64("1"));
}

export async function readBattery(device: Device): Promise<number> {
  const c = await device.readCharacteristicForService(BLE.SERVICE, BLE.CHAR_BATTERY);
  const v = parseInt(fromB64(c.value), 10);
  return Number.isFinite(v) ? v : 0;
}

export async function readStatus(device: Device): Promise<DeviceStatus> {
  const c = await device.readCharacteristicForService(BLE.SERVICE, BLE.CHAR_STATUS);
  try {
    return { online: true, ...JSON.parse(fromB64(c.value)) };
  } catch {
    return { online: true };
  }
}

export async function readSettings(device: Device): Promise<Partial<CompanionSettings>> {
  const c = await device.readCharacteristicForService(BLE.SERVICE, BLE.CHAR_SETTINGS);
  try {
    return JSON.parse(fromB64(c.value)) as CompanionSettings;
  } catch {
    return {};
  }
}

export async function writeSettings(device: Device, settings: CompanionSettings) {
  await device.writeCharacteristicWithResponseForService(
    BLE.SERVICE,
    BLE.CHAR_SETTINGS,
    toB64(JSON.stringify(settings)),
  );
}

export { manager };
