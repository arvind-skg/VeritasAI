/**
 * Byte/string codecs for CooL's wire encodings.
 *
 * Vendored from `cool-sdk` (github.com/KenidoesCode/cool-sdk, Apache-2.0) with
 * ONE change: the upstream file encodes via Node's `Buffer`, which does not
 * exist in a browser. Every function below is a byte-for-byte equivalent built
 * on `btoa`/`atob` and manual hex, so the receipts this app produces are
 * identical to the ones the published SDK and CLI produce.
 *
 * What this proves: nothing on its own — these are deterministic, reversible
 * encodings (hex, base64) and the prefixed string forms used in receipts
 * (`hex:...`, `base64:...`).
 * What this does NOT prove: that the bytes are authentic, fresh, or meaningful.
 * Integrity comes from the hash/signature layers, not from encoding.
 */
/** Lowercase hex of the given bytes. */
export declare function toHex(bytes: Uint8Array): string;
/** Bytes from lowercase/uppercase hex. Throws on non-hex input. */
export declare function fromHex(hex: string): Uint8Array;
/**
 * Standard base64 of the given bytes.
 * Chunked because `String.fromCharCode(...bytes)` blows the argument limit on
 * an ML-DSA-65 signature (~3.3 KB) on some engines.
 */
export declare function toBase64(bytes: Uint8Array): string;
/** Bytes from base64. */
export declare function fromBase64(b64: string): Uint8Array;
/** UTF-8 encode a string to bytes. */
export declare function utf8(text: string): Uint8Array;
/** Concatenate byte arrays into one. */
export declare function concatBytes(...arrays: Uint8Array[]): Uint8Array;
/** Encode bytes as the receipt `hex:<hex>` field form. */
export declare function toHexField(bytes: Uint8Array): `hex:${string}`;
/** Decode a `hex:<hex>` field to bytes. Throws if the prefix is missing. */
export declare function fromHexField(field: string): Uint8Array;
/** Encode bytes as the receipt `base64:<b64>` field form. */
export declare function toBase64Field(bytes: Uint8Array): `base64:${string}`;
/** Decode a `base64:<b64>` field to bytes. Throws if the prefix is missing. */
export declare function fromBase64Field(field: string): Uint8Array;
/** Constant-time equality for two byte arrays of equal length. */
export declare function bytesEqual(a: Uint8Array, b: Uint8Array): boolean;
