/**
 * CooL (cool-nwc) Implementation of VerificationProvider
 *
 * Provides cryptographic attestation, Ed25519 signing, and 7-domain offline verification
 * via the CooL SDK and TEE simulator.
 */
import { CooL, verifyEvidence } from "cool-nwc";
const COOL_APP_ID = process.env.COOL_APPLICATION_ID || "veritasai";
export class CooLProvider {
    name = "CooL / TEE Provider";
    cool;
    constructor() {
        this.cool = new CooL({ applicationId: COOL_APP_ID });
    }
    async record(eventType, metadata, payloads) {
        const result = await this.cool.record({
            type: eventType,
            metadata,
            payloads,
        });
        return { evidence: result.evidence };
    }
    async verify(evidence) {
        return verifyEvidence(evidence);
    }
}
