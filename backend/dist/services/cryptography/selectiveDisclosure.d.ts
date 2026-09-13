export interface FieldCommitment {
    field: string;
    salt: string;
    commitment: string;
}
export interface SelectiveCommitmentPackage {
    rootCommitment: string;
    fieldCount: number;
    commitments: Record<string, {
        salt: string;
        commitment: string;
    }>;
}
export interface SelectiveDisclosureProof {
    schema: "veritasai.selective_disclosure.v1";
    rootCommitment: string;
    disclosedFields: Record<string, unknown>;
    disclosedProofs: Record<string, {
        salt: string;
        commitment: string;
    }>;
    hiddenCommitments: Record<string, string>;
    generatedAt: string;
}
export declare function computeFieldCommitment(field: string, value: unknown, salt: string): string;
export declare function generateSelectiveCommitments(payload: Record<string, unknown>): SelectiveCommitmentPackage;
export declare function createSelectiveDisclosureProof(fullPayload: Record<string, unknown>, commitmentsPackage: SelectiveCommitmentPackage, selectedFields: string[]): SelectiveDisclosureProof;
export declare function verifySelectiveDisclosureProof(proof: SelectiveDisclosureProof): {
    valid: boolean;
    error?: string;
    verifiedFields: string[];
};
