export interface HybridSignature {
    schema: "veritasai.hybrid_signature.v1";
    classical: {
        algorithm: "Ed25519";
        signature: string;
        publicKey: string;
    };
    postQuantum: {
        algorithm: "ML-DSA-65";
        signature: string;
        publicKey: string;
        securityCategory: "NIST Category 3 (192-bit quantum equivalence)";
    };
    digest: string;
    signedAt: string;
}
/**
 * Generates a dual hybrid signature over arbitrary canonical payload data.
 */
export declare function generateHybridSignature(payload: unknown, secretSeed?: string): HybridSignature;
/**
 * Validates both Classical and Post-Quantum signatures.
 */
export declare function verifyHybridSignature(payload: unknown, signatureObj: HybridSignature, secretSeed?: string): {
    valid: boolean;
    classicalValid: boolean;
    postQuantumValid: boolean;
    error?: string;
};
