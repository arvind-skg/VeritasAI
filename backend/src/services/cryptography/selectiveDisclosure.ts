/**
 * VeritasAI Selective Disclosure Engine
 *
 * Implements Salted Field Commitments & Zero-Knowledge-Style Selective Disclosure.
 * Allows claimants and auditors to verify a specific subset of fields (e.g. Income = ₹35,000)
 * without revealing confidential PII (SSN, Phone, Address, Medical Data).
 */
import crypto from "crypto";

export interface FieldCommitment {
  field: string;
  salt: string;
  commitment: string;
}

export interface SelectiveCommitmentPackage {
  rootCommitment: string;
  fieldCount: number;
  commitments: Record<string, { salt: string; commitment: string }>;
}

export interface SelectiveDisclosureProof {
  schema: "veritasai.selective_disclosure.v1";
  rootCommitment: string;
  disclosedFields: Record<string, unknown>;
  disclosedProofs: Record<string, { salt: string; commitment: string }>;
  hiddenCommitments: Record<string, string>;
  generatedAt: string;
}

export function computeFieldCommitment(field: string, value: unknown, salt: string): string {
  const serialized = typeof value === "object" ? JSON.stringify(value) : String(value);
  return crypto.createHash("sha256").update(`${salt}:${field}:${serialized}`).digest("hex");
}

export function generateSelectiveCommitments(payload: Record<string, unknown>): SelectiveCommitmentPackage {
  const commitments: Record<string, { salt: string; commitment: string }> = {};
  const fieldNames = Object.keys(payload).sort();
  const sortedHashes: string[] = [];

  for (const field of fieldNames) {
    const salt = crypto.randomBytes(16).toString("hex");
    const commitment = computeFieldCommitment(field, payload[field], salt);
    commitments[field] = { salt, commitment };
    sortedHashes.push(commitment);
  }

  // Compute Root Commitment (Hash of sorted field commitments)
  const rootCommitment = crypto
    .createHash("sha256")
    .update(sortedHashes.join(":"))
    .digest("hex");

  return {
    rootCommitment,
    fieldCount: fieldNames.length,
    commitments,
  };
}

export function createSelectiveDisclosureProof(
  fullPayload: Record<string, unknown>,
  commitmentsPackage: SelectiveCommitmentPackage,
  selectedFields: string[]
): SelectiveDisclosureProof {
  const selectedSet = new Set(selectedFields);
  const disclosedFields: Record<string, unknown> = {};
  const disclosedProofs: Record<string, { salt: string; commitment: string }> = {};
  const hiddenCommitments: Record<string, string> = {};

  for (const [field, comm] of Object.entries(commitmentsPackage.commitments)) {
    if (selectedSet.has(field)) {
      disclosedFields[field] = fullPayload[field];
      disclosedProofs[field] = {
        salt: comm.salt,
        commitment: comm.commitment,
      };
    } else {
      // Hide the salt and value, provide only the one-way commitment hash
      hiddenCommitments[field] = comm.commitment;
    }
  }

  return {
    schema: "veritasai.selective_disclosure.v1",
    rootCommitment: commitmentsPackage.rootCommitment,
    disclosedFields,
    disclosedProofs,
    hiddenCommitments,
    generatedAt: new Date().toISOString(),
  };
}

export function verifySelectiveDisclosureProof(proof: SelectiveDisclosureProof): {
  valid: boolean;
  error?: string;
  verifiedFields: string[];
} {
  const allFieldNames = [
    ...Object.keys(proof.disclosedFields),
    ...Object.keys(proof.hiddenCommitments),
  ].sort();

  const reconstructedCommitments: Record<string, string> = {};

  // 1. Verify disclosed fields against their salts
  for (const [field, value] of Object.entries(proof.disclosedFields)) {
    const proofData = proof.disclosedProofs[field];
    if (!proofData) {
      return { valid: false, error: `Missing proof salt for disclosed field: ${field}`, verifiedFields: [] };
    }

    const calculatedCommitment = computeFieldCommitment(field, value, proofData.salt);
    if (calculatedCommitment !== proofData.commitment) {
      return {
        valid: false,
        error: `Field commitment mismatch for "${field}". Data has been altered!`,
        verifiedFields: [],
      };
    }

    reconstructedCommitments[field] = calculatedCommitment;
  }

  // 2. Add hidden field commitments
  for (const [field, commitment] of Object.entries(proof.hiddenCommitments)) {
    reconstructedCommitments[field] = commitment;
  }

  // 3. Rebuild root commitment
  const sortedHashes = allFieldNames.map((f) => reconstructedCommitments[f]);
  const reconstructedRoot = crypto
    .createHash("sha256")
    .update(sortedHashes.join(":"))
    .digest("hex");

  if (reconstructedRoot !== proof.rootCommitment) {
    return {
      valid: false,
      error: `Root commitment mismatch. The selective disclosure does not belong to the original committed record.`,
      verifiedFields: [],
    };
  }

  return {
    valid: true,
    verifiedFields: Object.keys(proof.disclosedFields),
  };
}
