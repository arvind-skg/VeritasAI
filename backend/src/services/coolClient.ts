/**
 * CooL SDK client wrapper for VeritasAI.
 *
 * Provides a singleton CooL instance and convenience functions for
 * recording evidence events and verifying receipts.
 */
import { CooL, verifyEvidence } from "cool-nwc";
import type { Evidence, Verdict } from "cool-nwc/verify";

const COOL_APP_ID = process.env.COOL_APPLICATION_ID || "veritasai";

// CooL constructor does no I/O — safe to create at module level.
// With no attestation.provider, it uses the built-in simulator.
const cool = new CooL({ applicationId: COOL_APP_ID });

/**
 * Record an evidence event via cool-nwc.
 *
 * `metadata` holds non-sensitive index fields (safe for a compliance officer to see).
 * `payloads` holds sensitive data — cool-nwc salts + hashes these; raw values
 * are discarded after commitment and never stored.
 */
export async function recordEvent(
  eventType: string,
  metadata: Record<string, unknown>,
  payloads: Record<string, unknown>
): Promise<{ evidence: Evidence }> {
  const result = await cool.record({
    type: eventType,
    metadata,
    payloads,
  });
  return { evidence: result.evidence };
}

/**
 * Verify a piece of CooL evidence, fully offline.
 *
 * Returns a structured verdict with 7 domain checks:
 * binding, signature, inclusion, witnesses, attestation, enclave, anchor.
 */
export async function verifyReceipt(evidence: Evidence): Promise<Verdict> {
  return verifyEvidence(evidence);
}

export { cool };
