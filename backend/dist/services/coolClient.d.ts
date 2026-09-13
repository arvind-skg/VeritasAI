/**
 * VeritasAI Evidence Service — delegates to the internal VerificationProvider.
 *
 * Preserves the exact interface expected by existing routes and tests.
 */
import { defaultProvider, type Verdict } from "./providers/index.js";
/**
 * Record an evidence event via the internal VerificationProvider.
 */
export declare function recordEvent(eventType: string, metadata: Record<string, unknown>, payloads: Record<string, unknown>): Promise<{
    evidence: any;
}>;
/**
 * Verify evidence offline across trust domains.
 */
export declare function verifyReceipt(evidence: unknown): Promise<Verdict>;
export { defaultProvider };
