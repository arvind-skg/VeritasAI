export interface SignedTreeHead {
    schema: "veritasai.sth.v1";
    treeSize: number;
    rootHash: string;
    timestamp: string;
    signature: string;
    keyId: string;
}
export interface InclusionProof {
    leafIndex: number;
    treeSize: number;
    leafHash: string;
    auditPath: Array<{
        direction: "left" | "right";
        hash: string;
    }>;
}
export interface ConsistencyProof {
    firstTreeSize: number;
    secondTreeSize: number;
    firstRootHash: string;
    secondRootHash: string;
    proofNodes: string[];
}
export declare function hashLeaf(data: string): string;
export declare function hashNode(left: string, right: string): string;
/**
 * Builds a Merkle Tree from an array of leaf strings or hashes.
 */
export declare function buildMerkleTree(leafHashes: string[]): {
    rootHash: string;
    layers: string[][];
};
/**
 * Generates an inclusion proof for a leaf at a given index.
 */
export declare function generateInclusionProof(leafIndex: number, leafHashes: string[]): InclusionProof;
/**
 * Verifies an inclusion proof against the root hash.
 */
export declare function verifyInclusionProof(proof: InclusionProof, expectedRoot: string): boolean;
/**
 * Generates a Signed Tree Head (STH) for the given event sequence.
 */
export declare function generateSignedTreeHead(leafHashes: string[], signingKeyHex?: string): SignedTreeHead;
/**
 * Verifies consistency between two tree states:
 * Proves that firstTree is an exact append-only prefix of secondTree.
 * If an attacker deleted or modified any event, this check fails.
 */
export declare function verifyConsistency(firstTreeLeaves: string[], secondTreeLeaves: string[]): {
    isConsistent: boolean;
    error?: string;
    firstRoot: string;
    secondRoot: string;
};
