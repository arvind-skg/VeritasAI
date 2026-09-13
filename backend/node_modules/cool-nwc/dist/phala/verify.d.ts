/**
 * The v2 verifier — the whole product, from the buyer's side.
 *
 * Everything else CooL builds exists so that this function can be run by someone
 * who trusts neither CooL nor Phala nor the customer: an auditor, a regulator, a
 * counterparty, the customer's own client. It takes bytes and returns a verdict,
 * with no network access required for any domain except chaining a hardware
 * quote to its vendor root.
 *
 * Seven domains, and the honesty rules that govern them:
 *
 *   binding     — recompute the commitment over the core. Maths. Pass or fail.
 *   signature   — BOTH ML-DSA-65 and Ed25519 over core‖binding. Maths.
 *   inclusion   — RFC 6962 audit path to a validly signed STH. Maths.
 *   witnesses   — only `external: true` co-signatures count. A CooL
 *                 self-signature is shown and never counted.
 *   attestation — the quote's chain to a vendor root. `pass` ONLY with a real
 *                 verifier and a real root; `simulated` for the simulator;
 *                 `absent` when a hardware quote is present but unverifiable
 *                 here. Never optimistic.
 *   enclave     — the binding between the quote and this record: the quote
 *                 digest is inside the signed core, the measurement matches, and
 *                 `report_data` commits to the very key that signed. This is the
 *                 domain v1 could not have, and the one that makes a quote mean
 *                 something about THIS record rather than about some record.
 *   anchor      — absent. Not implemented. Never a pass.
 */
import type { KeyDirectory } from "../types.js";
import type { QuoteVerifier } from "./quote.js";
import type { BlockHeaderSource } from "./anchor.js";
import type { ReceiptV2, VerdictChecksV2, VerdictV2, VerifyOptionsV2 } from "./types.js";
/** Verifier options, plus the optional root-of-trust checker. */
export type VerifyArgsV2 = VerifyOptionsV2 & {
    /**
     * Chains a hardware quote to Intel/AMD/NVIDIA. Omit it and a hardware quote
     * is reported as present-but-unverified rather than assumed good.
     */
    readonly quoteVerifier?: QuoteVerifier;
    /**
     * Reads a Bitcoin block header's merkle root. Omit it and an anchor is
     * reported as pending rather than passing — a timestamp nobody checked
     * against the chain is not an anchor.
     */
    readonly blockHeaders?: BlockHeaderSource;
};
/** Verify a `cool.receipt.v2`. Never throws; problems surface as failed domains. */
export declare function verifyReceiptV2(receipt: unknown, options?: VerifyArgsV2): Promise<VerdictV2>;
/** Convenience: the seven domains in display order. */
export declare function domainOrder(): (keyof VerdictChecksV2)[];
/** Merge a verifier's own trusted key directory over a receipt's embedded one. */
export declare function withTrustedKeys(receipt: ReceiptV2, trusted: KeyDirectory): ReceiptV2;
