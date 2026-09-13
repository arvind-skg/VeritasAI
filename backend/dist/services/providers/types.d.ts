/**
 * Verification Provider Interface Definitions
 *
 * Decouples VeritasAI from any specific attestation network or vendor (e.g. CooL, SGX, Nitro).
 */
import type { Verdict } from "cool-nwc/verify";
export type { Verdict };
export interface EvidencePayload {
    eventType: string;
    metadata: Record<string, unknown>;
    payloads: Record<string, unknown>;
}
export interface VerificationProvider {
    name: string;
    /**
     * Cryptographically record an agent decision event.
     * `metadata` contains public indexed context.
     * `payloads` contains sensitive data that is salted/hashed.
     */
    record(eventType: string, metadata: Record<string, unknown>, payloads: Record<string, unknown>): Promise<{
        evidence: unknown;
    }>;
    /**
     * Cryptographically verify an existing evidence receipt offline across trust domains.
     */
    verify(evidence: unknown): Promise<Verdict>;
}
