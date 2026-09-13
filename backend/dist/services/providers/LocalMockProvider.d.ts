/**
 * LocalMockProvider — Fallback / Sandbox verification provider.
 *
 * Simulates 7-domain cryptographic receipts without external network dependencies.
 */
import type { VerificationProvider, Verdict } from "./types.js";
export declare class LocalMockProvider implements VerificationProvider {
    readonly name = "Local Mock / Sandbox Provider";
    record(eventType: string, metadata: Record<string, unknown>, payloads: Record<string, unknown>): Promise<{
        evidence: unknown;
    }>;
    verify(_evidence: unknown): Promise<Verdict>;
}
