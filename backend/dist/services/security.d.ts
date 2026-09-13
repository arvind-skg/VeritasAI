export interface UserTokenPayload {
    userId: string;
    orgId: string;
    role: string;
}
/**
 * Hash a password using bcrypt.
 */
export declare function hashPassword(password: string): Promise<string>;
/**
 * Verify a plaintext password against a bcrypt hash.
 */
export declare function verifyPassword(password: string, hash: string): Promise<boolean>;
/**
 * Sign a JWT token for an authenticated user.
 */
export declare function generateToken(payload: UserTokenPayload): string;
/**
 * Verify and decode a JWT token. Returns null if invalid or expired.
 */
export declare function verifyToken(token: string): UserTokenPayload | null;
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
export declare function generateApiKey(environment?: "PRODUCTION" | "STAGING" | "TEST"): {
    rawKey: string;
    keyPrefix: string;
    keyHash: string;
    lastFour: string;
};
/**
 * Hash an API key using SHA-256 for fast, deterministic lookups without storing plaintext secrets.
 */
export declare function hashApiKey(key: string): string;
/**
 * Check if a string is already encrypted with the AES-256-GCM envelope format.
 */
export declare function isEncrypted(text: string | null | undefined): boolean;
/**
 * Encrypt a plaintext string using AES-256-GCM with a unique 96-bit IV and 128-bit auth tag.
 * Output format: enc:v1:<iv_hex>:<authTag_hex>:<ciphertext_hex>
 */
export declare function encryptData(plaintext: string): string;
/**
 * Decrypt an AES-256-GCM encrypted envelope.
 * Fully backward-compatible: returns unencrypted legacy plaintext as-is.
 */
export declare function decryptData(ciphertextOrPlain: string): string;
/**
 * Encrypt arbitrary JSON serializable data.
 */
export declare function encryptJson(data: unknown): string | null;
/**
 * Decrypt and parse JSON payload.
 * Supports both encrypted `enc:v1:...` envelopes and legacy plaintext JSON.
 */
export declare function decryptJson<T = any>(payload: string | null | undefined): T | null;
