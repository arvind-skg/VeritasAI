/**
 * Structural validation for `cool.receipt.v2`.
 *
 * v1 validates against the JSON Schema published in `cool-spec`. v2's schema is
 * still in flight, so this hand-written validator is the normative shape check
 * until it lands — it is deliberately exhaustive and its messages name the exact
 * field, because "malformed receipt" with no path is useless to whoever has to
 * work out why an auditor's copy will not verify.
 *
 * Shape only. Nothing here says a receipt is authentic; that is what the
 * hash, signature, log and attestation domains in `./verify.ts` are for.
 */
import type { ReceiptV2 } from "./types.js";
/** The outcome of a shape check. `receipt` is only set when `ok` is true. */
export interface ShapeResult {
    readonly ok: boolean;
    readonly errors: readonly string[];
    readonly receipt: ReceiptV2 | null;
}
/** Validate the shape of a `cool.receipt.v2` value. Never throws. */
export declare function validateReceiptV2Shape(value: unknown): ShapeResult;
