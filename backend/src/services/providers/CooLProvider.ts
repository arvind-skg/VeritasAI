/**
 * CooL (cool-nwc) Implementation of VerificationProvider
 *
 * Provides cryptographic attestation, Ed25519 signing, and 7-domain offline verification
 * via the CooL SDK and TEE simulator.
 */
import { CooL, verifyEvidence } from "cool-nwc";
import type { Evidence, Verdict } from "cool-nwc/verify";
import type { VerificationProvider } from "./types.js";

const COOL_APP_ID = process.env.COOL_APPLICATION_ID || "veritasai";

export class CooLProvider implements VerificationProvider {
  public readonly name = "CooL / TEE Provider";
  private cool: CooL;

  constructor() {
    this.cool = new CooL({ applicationId: COOL_APP_ID });
  }

  public async record(
    eventType: string,
    metadata: Record<string, unknown>,
    payloads: Record<string, unknown>
  ): Promise<{ evidence: Evidence }> {
    const result = await this.cool.record({
      type: eventType,
      metadata,
      payloads,
    });
    return { evidence: result.evidence };
  }

  public async verify(evidence: unknown): Promise<Verdict> {
    return verifyEvidence(evidence as Evidence);
  }
}
