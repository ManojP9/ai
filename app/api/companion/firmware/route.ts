// /api/companion/firmware — OTA update manifest (Phase 5, task: OTA updates).
// The device polls this for the latest signed firmware version + download URL.
// Values come from env so a release can bump them without a redeploy.
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    version: process.env.COMPANION_FW_VERSION || "1.0.0",
    url: process.env.COMPANION_FW_URL || "",
    // SHA-256 of the .bin; the device verifies this before applying (defense in depth
    // alongside ESP32 secure boot / signed app partitions).
    sha256: process.env.COMPANION_FW_SHA256 || "",
    mandatory: process.env.COMPANION_FW_MANDATORY === "1",
    notes: process.env.COMPANION_FW_NOTES || "",
  });
}
