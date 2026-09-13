import { canonicalCbor } from "../canonical.js";
import { concatBytes, fromHexField, utf8 } from "../codec.js";
import { mhSha256 } from "../multihash.js";
import { hybridSign, hybridVerify } from "../sign.js";
/** Key id under which the simulator's attestation root is published in receipts. */
export const SIM_ROOT_KEY_ID = "cool-sim-attestation-root-01";
/** Domain-separation tag for the 64 bytes bound into a quote's `report_data`. */
const REPORT_DATA_TAG = "cool/report-data/v2";
/* ── measurements ─────────────────────────────────────────────────────── */
/** Field-by-field equality. Used for the measurement pin. */
export function measurementEquals(a, b) {
    return (a.mrtd === b.mrtd &&
        a.rtmr0 === b.rtmr0 &&
        a.rtmr1 === b.rtmr1 &&
        a.rtmr2 === b.rtmr2 &&
        a.rtmr3 === b.rtmr3);
}
/** A single short digest over a measurement set — for display and comparison. */
export function measurementDigest(m) {
    return mhSha256(canonicalCbor(m));
}
/** The first `n` hex characters of a measurement register, for compact display. */
export function shortMeasurement(m, n = 12) {
    return m.mrtd.slice("hex:".length, "hex:".length + n);
}
/** Which register(s) differ — so a mismatch says *what* changed, not just "no". */
export function measurementDiff(a, b) {
    const fields = ["mrtd", "rtmr0", "rtmr1", "rtmr2", "rtmr3"];
    return fields.filter((f) => a[f] !== b[f]);
}
/* ── the key ↔ enclave binding ────────────────────────────────────────── */
/**
 * The commitment placed in a quote's `report_data`.
 *
 * This is the hinge of the whole design. The hardware attests to a measurement
 * AND to 64 bytes of our choosing; we spend those bytes on the public half of
 * the key the enclave signs with. A verifier recomputes this from the receipt's
 * own `key_directory` and compares. If they match, "attested code" and "signing
 * key" are the same entity — which is precisely what stops a real quote from
 * being stapled onto a record signed somewhere else.
 */
export function enclaveReportData(entry) {
    return mhSha256(concatBytes(utf8(REPORT_DATA_TAG), canonicalCbor({ ed25519_pub: entry.ed25519_pub, ml_dsa_pub: entry.ml_dsa_pub })));
}
/** The 64 raw bytes to hand a TDX `GetQuote` call, derived from the commitment. */
export function reportDataBytes(commitment) {
    const digest = fromHexField(`hex:${commitment.slice("mh:sha256:".length)}`);
    const out = new Uint8Array(64);
    out.set(digest, 0);
    return out;
}
/* ── envelope helpers ─────────────────────────────────────────────────── */
/** The exact bytes a quote signature (or the silicon) covers. */
export function quoteSigningMessage(body) {
    return canonicalCbor(body);
}
/**
 * The digest that goes into the record's signed core (`runtime.tee_quote`).
 * Hashing the whole envelope — signature and raw bytes included — is what makes
 * the record signature cover the quote, so neither can be swapped for the other.
 */
export function quoteDigest(quote) {
    return mhSha256(canonicalCbor(quote));
}
/** Sign a simulated quote body with the simulator's root key. */
export function signSimulatedQuote(body, rootKey) {
    return hybridSign(quoteSigningMessage(body), rootKey);
}
/**
 * Verifier for simulator-issued quotes.
 *
 * It performs a genuine hybrid-signature check against the simulator root key
 * carried in the receipt — so a tampered simulated quote is still caught — and
 * then reports `ok: true` with a root of `cool-sim-root`. Callers translate that
 * into the `simulated` status; nothing here ever claims a vendor root.
 */
export function simulatedQuoteVerifier(directory) {
    return {
        root: "cool-sim-root",
        name: "cool-simulator",
        async verify(quote) {
            if (!quote.signature) {
                return {
                    ok: false,
                    root: "cool-sim-root",
                    tcb_status: quote.body.tcb_status,
                    detail: "simulated quote carries no signature",
                };
            }
            const entry = directory[quote.signature.key_id];
            if (!entry) {
                return {
                    ok: false,
                    root: "cool-sim-root",
                    tcb_status: quote.body.tcb_status,
                    detail: `no public key for simulator root '${quote.signature.key_id}'`,
                };
            }
            const ok = hybridVerify(quoteSigningMessage(quote.body), quote.signature, entry).ok;
            return {
                ok,
                root: "cool-sim-root",
                tcb_status: quote.body.tcb_status,
                detail: ok
                    ? "simulated quote signature valid under the CooL simulator root (NOT a vendor root)"
                    : "simulated quote signature does not verify",
            };
        },
    };
}
/**
 * Verifier that posts the vendor-native quote bytes to an attestation service.
 *
 * This is the hardware path. It is a network call by construction — DCAP
 * collateral is not something a browser or an air-gapped verifier can synthesise
 * — so it is opt-in, and its absence degrades to "reported, not verified" rather
 * than to a silent pass.
 */
export function remoteQuoteVerifier(options) {
    const encode = options.encode ?? ((raw) => ({ quote: raw }));
    const decode = options.decode ??
        ((response) => {
            const r = (response ?? {});
            const ok = r["ok"] === true || r["verified"] === true || r["success"] === true;
            const tcb = typeof r["tcb_status"] === "string" ? r["tcb_status"] : undefined;
            const detail = typeof r["detail"] === "string" ? r["detail"] : undefined;
            return tcb === undefined
                ? detail === undefined
                    ? { ok }
                    : { ok, detail }
                : detail === undefined
                    ? { ok, tcb_status: tcb }
                    : { ok, tcb_status: tcb, detail };
        });
    return {
        root: options.root,
        name: options.name ?? "remote-attestation-service",
        async verify(quote) {
            if (!quote.raw) {
                return {
                    ok: false,
                    root: options.root,
                    tcb_status: quote.body.tcb_status,
                    detail: "no raw vendor quote bytes to submit (this receipt is not from hardware)",
                };
            }
            try {
                const raw = quote.raw.slice("base64:".length);
                const response = await fetch(options.endpoint, {
                    method: "POST",
                    headers: { "content-type": "application/json", ...(options.headers ?? {}) },
                    body: JSON.stringify(encode(raw, quote)),
                });
                if (!response.ok) {
                    return {
                        ok: false,
                        root: options.root,
                        tcb_status: quote.body.tcb_status,
                        detail: `attestation service returned HTTP ${response.status}`,
                    };
                }
                const verdict = decode(await response.json());
                return {
                    ok: verdict.ok,
                    root: options.root,
                    tcb_status: verdict.tcb_status ?? quote.body.tcb_status,
                    detail: verdict.detail ??
                        (verdict.ok
                            ? `quote verified against ${options.root}`
                            : `quote rejected by ${options.root}`),
                };
            }
            catch (error) {
                return {
                    ok: false,
                    root: options.root,
                    tcb_status: quote.body.tcb_status,
                    detail: `attestation service unreachable: ${error.message}`,
                };
            }
        },
    };
}
/* ── structural checks (always offline, always run) ───────────────────── */
const HEX32 = /^hex:[0-9a-f]{96}$|^hex:[0-9a-f]{64}$/;
/** Reject a quote whose shape is wrong before any root is consulted. */
export function checkQuoteStructure(quote) {
    const m = quote.body.measurement;
    for (const [name, value] of Object.entries(m)) {
        if (!HEX32.test(value)) {
            return { status: "fail", detail: `FAILED — malformed measurement register '${name}'` };
        }
    }
    if (!/^mh:sha256:[0-9a-f]{64}$/.test(quote.body.report_data)) {
        return { status: "fail", detail: "FAILED — malformed report_data commitment" };
    }
    if (quote.root === "cool-sim-root" && quote.raw !== null) {
        return { status: "fail", detail: "FAILED — a simulated quote must not carry vendor bytes" };
    }
    if (quote.root !== "cool-sim-root" && quote.raw === null) {
        return {
            status: "fail",
            detail: `FAILED — quote claims root '${quote.root}' but carries no vendor bytes`,
        };
    }
    return null;
}
//# sourceMappingURL=quote.js.map