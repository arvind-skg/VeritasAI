/**
 * VeritasAI Evidence Service — delegates to the internal VerificationProvider.
 *
 * Preserves the exact interface expected by existing routes and tests.
 */
import { defaultProvider } from "./providers/index.js";
/**
 * Record an evidence event via the internal VerificationProvider.
 */
export async function recordEvent(eventType, metadata, payloads) {
    return defaultProvider.record(eventType, metadata, payloads);
}
/**
 * Verify evidence offline across trust domains.
 */
export async function verifyReceipt(evidence) {
    return defaultProvider.verify(evidence);
}
export { defaultProvider };
