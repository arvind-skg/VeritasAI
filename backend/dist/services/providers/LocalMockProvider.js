import crypto from "crypto";
export class LocalMockProvider {
    name = "Local Mock / Sandbox Provider";
    async record(eventType, metadata, payloads) {
        const recordId = `rec_sim_${crypto.randomBytes(12).toString("hex")}`;
        const issuedAt = new Date().toISOString();
        const payloadHash = crypto.createHash("sha256").update(JSON.stringify(payloads)).digest("hex");
        return {
            evidence: {
                schema: "cool.receipt.v2",
                subject: {
                    kind: "evidence",
                    subject: eventType,
                    issued_at: issuedAt,
                    record_id: recordId,
                    key_id: `key_${crypto.randomBytes(8).toString("hex")}`,
                    tee: "simulated-tee",
                },
                payload_digest: payloadHash,
                metadata,
                signature: `ed25519_sim_${crypto.randomBytes(32).toString("hex")}`,
            },
        };
    }
    async verify(_evidence) {
        return {
            ok: true,
            schema: "cool.receipt.v2",
            subject: {
                kind: "evidence",
                subject: "agent_decision",
                issued_at: new Date().toISOString(),
                record_id: `rec_${crypto.randomBytes(8).toString("hex")}`,
                key_id: "key_simulated",
                tee: "simulated-tee",
            },
            checks: {
                binding: { status: "pass", detail: "Agent key is bound to identity" },
                signature: { status: "pass", detail: "Ed25519 signature is cryptographically valid" },
                inclusion: { status: "simulated", detail: "Proof of inclusion in simulated Merkle accumulator" },
                witnesses: { status: "simulated", detail: "Quorum confirmed by decentralized simulated witnesses" },
                attestation: { status: "simulated", detail: "Hardware measurement attestation valid" },
                enclave: { status: "simulated", detail: "Enclave security parameters validated" },
                anchor: { status: "simulated", detail: "Root trust anchor verified" },
            },
            reasons: [],
        };
    }
}
