import type { KeyDirectory, KeyPair } from "./types.js";
/** Options for {@link generateKeypair}. */
export interface GenerateKeypairOptions {
    /**
     * A 32-byte deterministic seed. If provided, the SAME keypair is produced
     * every time — used for reproducible conformance vectors and tests ONLY.
     * If omitted, a fresh random seed is drawn from the platform CSPRNG.
     */
    readonly seed?: Uint8Array;
}
/**
 * Generate a hybrid ML-DSA-65 + Ed25519 keypair bound to a key id.
 * @param keyId operator-chosen label recorded in signatures and the key directory
 */
export declare function generateKeypair(keyId: string, options?: GenerateKeypairOptions): KeyPair;
/** Build a single-entry key directory from a keypair. */
export declare function directoryFromKeypair(key: KeyPair): KeyDirectory;
/** Merge several keypairs' directory entries into one key directory. */
export declare function mergeDirectories(...keys: KeyPair[]): KeyDirectory;
