import { verifyReceiptV2 } from "./verify.js";
import { coverage } from "./compliance.js";
import { countWitnesses } from "./witness.js";
export function buildAuditPack(receipts, options) {
    return {
        schema: "cool.audit-pack.v2",
        generated_at: options.generatedAt ?? new Date().toISOString(),
        subject: options.subject,
        enclave: options.enclave ?? null,
        records: receipts.map((receipt) => ({
            record_id: receipt.record.record_id,
            schema: receipt.record.schema,
            sealed_at: receipt.record.time.issued_at,
            receipt,
        })),
        obligations: coverage(receipts).map((row) => ({
            id: row.obligation.id,
            regime: row.obligation.regime,
            clause: row.obligation.clause,
            requirement: row.obligation.requirement,
            satisfied_by: row.obligation.satisfiedBy,
            records: row.records,
            covered: row.covered,
        })),
        trusted_keys: options.trustedKeys ?? {},
        how_to_verify: "npx cool-nwc verify <any receipt in this pack> — or `cool pack verify <this file>`. " +
            "Everything is checked offline: commitments, both signatures, Merkle inclusion, " +
            "and the binding between the enclave quote and the signing key.",
    };
}
/**
 * Verify every receipt in a pack.
 *
 * The summary inside the pack is ignored on purpose — this recomputes it. A pack
 * is only worth what an independent check of it says.
 */
export async function verifyAuditPack(pack, options = {}) {
    const verdicts = [];
    const failures = [];
    let witnesses = 0;
    for (const entry of pack.records) {
        const verdict = await verifyReceiptV2(entry.receipt, options);
        verdicts.push(verdict);
        if (!verdict.ok) {
            failures.push({ record_id: entry.record_id, reasons: [...verdict.reasons] });
        }
        witnesses += countWitnesses(entry.receipt).external;
    }
    const recomputed = coverage(pack.records.map((entry) => entry.receipt));
    return {
        ok: failures.length === 0 && pack.records.length > 0,
        total: pack.records.length,
        verified: verdicts.filter((v) => v.ok).length,
        failed: failures.length,
        failures,
        witnesses,
        verdicts,
        obligationsCovered: recomputed.filter((row) => row.covered).length,
        obligationsTotal: recomputed.length,
    };
}
//# sourceMappingURL=pack.js.map