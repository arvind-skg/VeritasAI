import type { DirectoryEntry, KeyPair, SignatureBlock } from "./types.js";
export declare const SIGNATURE_ALG: "ml-dsa-65+ed25519";
/** The outcome of verifying a hybrid signature, with per-scheme detail. */
export interface HybridVerifyResult {
    /** True only if BOTH schemes verify. */
    readonly ok: boolean;
    readonly mlDsaOk: boolean;
    readonly ed25519Ok: boolean;
}
/** Produce a hybrid signature block over `message` using both secret keys. */
export declare function hybridSign(message: Uint8Array, key: KeyPair): SignatureBlock;
/**
 * Verify a hybrid signature block over `message` against a directory entry.
 * Returns per-scheme results; `ok` is true only when BOTH verify. Never throws
 * on a bad signature — malformed bytes are reported as a failed verify.
 */
export declare function hybridVerify(message: Uint8Array, signature: SignatureBlock, entry: DirectoryEntry): HybridVerifyResult;
