import type { Evidence, Verdict } from "cool-nwc/verify";
import type { VerificationProvider } from "./types.js";
export declare class CooLProvider implements VerificationProvider {
    readonly name = "CooL / TEE Provider";
    private cool;
    constructor();
    record(eventType: string, metadata: Record<string, unknown>, payloads: Record<string, unknown>): Promise<{
        evidence: Evidence;
    }>;
    verify(evidence: unknown): Promise<Verdict>;
}
