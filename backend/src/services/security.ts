/**
 * Security & Cryptography Utilities for VeritasAI
 *
 * Handles:
 * - Bcrypt password hashing
 * - JWT issuance and verification
 * - Secure API Key generation and SHA-256 hashing
 */
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || "veritasai-enterprise-jwt-secret-key-2026";
const JWT_EXPIRES_IN = "7d";

export interface UserTokenPayload {
  userId: string;
  orgId: string;
  role: string;
}

/**
 * Hash a password using bcrypt.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Verify a plaintext password against a bcrypt hash.
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Sign a JWT token for an authenticated user.
 */
export function generateToken(payload: UserTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verify and decode a JWT token. Returns null if invalid or expired.
 */
export function verifyToken(token: string): UserTokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as UserTokenPayload;
  } catch {
    return null;
  }
}

/**
 * Securely generate an agent API key.
 *
 * Format:
 * Production: vra_live_<32 hex chars>
 * Test/Sandbox: vra_test_<32 hex chars>
 *
 * Returns:
 * - rawKey: Full secret shown ONCE to the developer
 * - keyPrefix: "vra_live_" or "vra_test_"
 * - keyHash: SHA-256 hash stored in the database
 * - lastFour: Last 4 characters for safe display in dashboard
 */
export function generateApiKey(environment: "PRODUCTION" | "STAGING" | "TEST" = "PRODUCTION"): {
  rawKey: string;
  keyPrefix: string;
  keyHash: string;
  lastFour: string;
} {
  const prefix = environment === "PRODUCTION" ? "vra_live_" : "vra_test_";
  const randomBytes = crypto.randomBytes(24).toString("hex");
  const rawKey = `${prefix}${randomBytes}`;
  const keyHash = hashApiKey(rawKey);
  const lastFour = rawKey.slice(-4);

  return {
    rawKey,
    keyPrefix: prefix,
    keyHash,
    lastFour,
  };
}

/**
 * Hash an API key using SHA-256 for fast, deterministic lookups without storing plaintext secrets.
 */
export function hashApiKey(key: string): string {
  return crypto.createHash("sha256").update(key.trim()).digest("hex");
}

// -----------------------------------------------------------------------------
// AES-256-GCM Database Field-Level Encryption at Rest
// -----------------------------------------------------------------------------

const ENCRYPTION_PREFIX = "enc:v1:";
const RAW_MASTER_KEY =
  process.env.ENCRYPTION_KEY ||
  process.env.VERITASAI_ENCRYPTION_KEY ||
  "veritasai-enterprise-master-encryption-key-2026-secure-default";

// Derive deterministic 32-byte (256-bit) key buffer
const MASTER_KEY_BUFFER = crypto.createHash("sha256").update(RAW_MASTER_KEY).digest();

/**
 * Check if a string is already encrypted with the AES-256-GCM envelope format.
 */
export function isEncrypted(text: string | null | undefined): boolean {
  return typeof text === "string" && text.startsWith(ENCRYPTION_PREFIX);
}

/**
 * Encrypt a plaintext string using AES-256-GCM with a unique 96-bit IV and 128-bit auth tag.
 * Output format: enc:v1:<iv_hex>:<authTag_hex>:<ciphertext_hex>
 */
export function encryptData(plaintext: string): string {
  if (typeof plaintext !== "string" || plaintext.length === 0) {
    return plaintext;
  }
  // Avoid double-encrypting already encrypted payloads
  if (isEncrypted(plaintext)) {
    return plaintext;
  }

  const iv = crypto.randomBytes(12); // 96 bits IV recommended for AES-GCM
  const cipher = crypto.createCipheriv("aes-256-gcm", MASTER_KEY_BUFFER, iv);

  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag(); // 128-bit authentication tag

  return `${ENCRYPTION_PREFIX}${iv.toString("hex")}:${authTag.toString("hex")}:${ciphertext.toString("hex")}`;
}

/**
 * Decrypt an AES-256-GCM encrypted envelope.
 * Fully backward-compatible: returns unencrypted legacy plaintext as-is.
 */
export function decryptData(ciphertextOrPlain: string): string {
  if (typeof ciphertextOrPlain !== "string" || !isEncrypted(ciphertextOrPlain)) {
    return ciphertextOrPlain;
  }

  try {
    const parts = ciphertextOrPlain.split(":");
    // Expect: ["enc", "v1", ivHex, tagHex, cipherHex]
    if (parts.length !== 5) {
      return ciphertextOrPlain;
    }

    const iv = Buffer.from(parts[2], "hex");
    const authTag = Buffer.from(parts[3], "hex");
    const ciphertext = Buffer.from(parts[4], "hex");

    const decipher = crypto.createDecipheriv("aes-256-gcm", MASTER_KEY_BUFFER, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);

    return decrypted.toString("utf8");
  } catch (err) {
    console.error("[VeritasAI Security] Decryption error (data may be tampered or key mismatch):", err);
    // In fail-safe mode, return original string if decryption fails
    return ciphertextOrPlain;
  }
}

/**
 * Encrypt arbitrary JSON serializable data.
 */
export function encryptJson(data: unknown): string | null {
  if (data === null || data === undefined) return null;
  const jsonStr = typeof data === "string" ? data : JSON.stringify(data);
  return encryptData(jsonStr);
}

/**
 * Decrypt and parse JSON payload.
 * Supports both encrypted `enc:v1:...` envelopes and legacy plaintext JSON.
 */
export function decryptJson<T = any>(payload: string | null | undefined): T | null {
  if (!payload) return null;
  try {
    const plain = decryptData(payload);
    return JSON.parse(plain) as T;
  } catch {
    // If parsing fails, return decrypted string as raw representation
    return (decryptData(payload) as unknown) as T;
  }
}

