/** RFC 6962 leaf hash: SHA256(0x00 ‖ data). */
export declare function leafHash(data: Uint8Array): Uint8Array;
/** RFC 6962 interior node hash: SHA256(0x01 ‖ left ‖ right). */
export declare function nodeHash(left: Uint8Array, right: Uint8Array): Uint8Array;
/**
 * Merkle Tree Hash (MTH) of a list of already-computed leaf hashes.
 * `leafHashes[i]` must be the output of {@link leafHash} for entry i.
 */
export declare function merkleRoot(leafHashes: Uint8Array[]): Uint8Array;
/**
 * Audit path (RFC 6962 PATH(m, D[n])) proving inclusion of leaf index `m`
 * in a tree built from `leafHashes` (length n). Returns sibling hashes bottom-up.
 */
export declare function inclusionProof(leafHashes: Uint8Array[], m: number): Uint8Array[];
/**
 * Recompute a tree root from a leaf hash and its audit path (RFC 6962).
 * Returns the reconstructed root; the caller compares it to a trusted STH root.
 */
export declare function rootFromInclusionProof(leafHashValue: Uint8Array, leafIndex: number, treeSize: number, auditPath: Uint8Array[]): Uint8Array;
/**
 * Verify an inclusion proof against an expected root.
 * Returns true only if the reconstructed root equals `expectedRoot`.
 */
export declare function verifyInclusion(leafHashValue: Uint8Array, leafIndex: number, treeSize: number, auditPath: Uint8Array[], expectedRoot: Uint8Array): boolean;
/**
 * Consistency proof (RFC 6962 PROOF(m, D[n])) between an older tree of size
 * `m` and a newer tree built from `leafHashes` of size n (m ≤ n).
 */
export declare function consistencyProof(leafHashes: Uint8Array[], m: number): Uint8Array[];
/**
 * Verify a consistency proof: that the tree with root `secondRoot` (size n) is
 * an append-only extension of the tree with root `firstRoot` (size m).
 */
export declare function verifyConsistency(m: number, n: number, firstRoot: Uint8Array, secondRoot: Uint8Array, proof: Uint8Array[]): boolean;
