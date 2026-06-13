// crypto.ts — encryption at rest for sensitive companion data (Phase 5).
// AES-256-GCM. Key comes from COMPANION_ENC_KEY (32 bytes, base64 or 64-hex chars).
// If no key is set, values pass through unencrypted (with a one-time warning) so the
// app still runs in dev — but production MUST set the key.
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const PREFIX = "enc:v1:";

function loadKey(): Buffer | null {
  const raw = process.env.COMPANION_ENC_KEY;
  if (!raw) return null;
  const buf = /^[0-9a-fA-F]{64}$/.test(raw) ? Buffer.from(raw, "hex") : Buffer.from(raw, "base64");
  return buf.length === 32 ? buf : null;
}

const KEY = loadKey();
let warned = false;
function warnOnce() {
  if (!warned && !KEY) {
    warned = true;
    console.warn("[companion] COMPANION_ENC_KEY not set — storing sensitive data UNENCRYPTED (dev only).");
  }
}

export function isEncryptionEnabled(): boolean {
  return KEY !== null;
}

export function encryptField(plain: string): string {
  if (!KEY) {
    warnOnce();
    return plain;
  }
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", KEY, iv);
  const ct = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return PREFIX + Buffer.concat([iv, tag, ct]).toString("base64");
}

export function decryptField(stored: string): string {
  if (!stored.startsWith(PREFIX)) return stored; // legacy/plaintext value
  if (!KEY) return "[encrypted]";
  const blob = Buffer.from(stored.slice(PREFIX.length), "base64");
  const iv = blob.subarray(0, 12);
  const tag = blob.subarray(12, 28);
  const ct = blob.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", KEY, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ct), decipher.final()]).toString("utf8");
}
