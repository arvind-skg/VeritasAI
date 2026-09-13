/**
 * The audit pack — one file you can hand to someone who does not trust you.
 *
 * An auditor's real complaint about evidence systems is not cryptographic, it is
 * logistical: they get a spreadsheet, a screenshot and a promise, then spend two
 * weeks reconciling them. A pack is the opposite shape — every receipt, the keys
 * needed to check them, the measurement the deployment pinned, and the clause
 * mapping, in a single self-contained document that verifies offline.
 *
 * `verifyAuditPack` deliberately re-derives everything rather than trusting the
 * pack's own summary. A pack that lies about its contents fails on the first
 * receipt, which is the only sane behaviour for a document whose entire purpose
 * is being checked by a stranger.
 */
import type { KeyDirectory } from "../types.js";
import type { VerifyArgsV2 } from "./verify.js";
import type { Measurement, ReceiptV2, VerdictV2 } from "./types.js";
export interface AuditPackEntry {
    readonly record_id: string;
    readonly schema: string;
    readonly sealed_at: string;
    readonly receipt: ReceiptV2;
}
export interface AuditPack {
    readonly schema: "cool.audit-pack.v2";
    readonly generated_at: string;
    readonly subject: string;
    readonly enclave: {
        readonly vendor: string;
        readonly mode: string;
        readonly app_id: string;
        readonly measurement: Measurement | null;
    } | null;
    readonly records: readonly AuditPackEntry[];
    readonly obligations: readonly {
        id: string;
        regime: string;
        clause: string;
        requirement: string;
        satisfied_by: string;
        records: number;
        covered: boolean;
    }[];
    /** Keys a verifier may want that are not inside individual receipts. */
    readonly trusted_keys: KeyDirectory;
    readonly how_to_verify: string;
}
export interface BuildPackOptions {
    readonly subject: string;
    readonly generatedAt?: string;
    readonly enclave?: AuditPack["enclave"];
    readonly trustedKeys?: KeyDirectory;
}
export declare function buildAuditPack(receipts: readonly ReceiptV2[], options: BuildPackOptions): AuditPack;
export interface PackVerdict {
    readonly ok: boolean;
    readonly total: number;
    readonly verified: number;
    readonly failed: number;
    /** Records that did not verify, with the reason. */
    readonly failures: readonly {
        record_id: string;
        reasons: readonly string[];
    }[];
    /** Independent witness co-signatures found across the pack. */
    readonly witnesses: number;
    /** Per-record verdicts, in pack order. */
    readonly verdicts: readonly VerdictV2[];
    readonly obligationsCovered: number;
    readonly obligationsTotal: number;
}
/**
 * Verify every receipt in a pack.
 *
 * The summary inside the pack is ignored on purpose — this recomputes it. A pack
 * is only worth what an independent check of it says.
 */
export declare function verifyAuditPack(pack: AuditPack, options?: VerifyArgsV2): Promise<PackVerdict>;
