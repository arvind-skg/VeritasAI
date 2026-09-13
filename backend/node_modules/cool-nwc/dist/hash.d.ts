import type { HexField, Multihash } from "./types.js";
/** Raw SHA-256 of the given bytes. */
export declare function sha256Bytes(data: Uint8Array): Uint8Array;
/** Generate a fresh 16-byte salt as a `hex:` field using the platform CSPRNG. */
export declare function randomSalt(): HexField;
/**
 * Compute a salted commitment `mh:sha256(salt_bytes ‖ data_bytes)`.
 * @param salt a `hex:` field (its bytes are prepended to the data)
 * @param data the committed value, as a UTF-8 string or raw bytes
 */
export declare function saltedCommit(salt: HexField, data: string | Uint8Array): Multihash;
