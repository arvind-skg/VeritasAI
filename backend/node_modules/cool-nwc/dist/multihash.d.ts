import type { Multihash } from "./types.js";
export declare const MULTIHASH_PREFIX = "mh:sha256:";
/** Compute the SHA-256 multihash of the given bytes. */
export declare function mhSha256(data: Uint8Array): Multihash;
/** Wrap an already-computed 32-byte digest as a `mh:sha256:` multihash. */
export declare function multihashFromDigest(digest: Uint8Array): Multihash;
/** True if the string is a well-formed `mh:sha256:` multihash. */
export declare function isMultihash(value: string): value is Multihash;
/**
 * Extract the raw 32-byte digest from a `mh:sha256:` multihash.
 * Throws if the prefix is missing or the digest is not 32 bytes.
 */
export declare function multihashDigest(mh: string): Uint8Array;
