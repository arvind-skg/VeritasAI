/**
 * Encode a JSON-like value to canonical (CDE) CBOR bytes.
 * Deterministic: identical input values always yield identical bytes.
 */
export declare function canonicalCbor(value: unknown): Uint8Array;
/**
 * Human-facing JSON projection of a value (stable 2-space indentation).
 * For display only — NEVER hash or sign this; hashing uses {@link canonicalCbor}.
 */
export declare function jsonProjection(value: unknown): string;
