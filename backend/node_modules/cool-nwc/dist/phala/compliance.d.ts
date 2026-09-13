/**
 * Obligations, and whether the evidence actually covers them.
 *
 * The catalogue below is the part of CooL that a compliance officer reads and a
 * founder over-claims. So the rule here is strict: coverage is **computed from
 * receipts**, never asserted. If an obligation has no records behind it, it
 * reports zero and says what would satisfy it. A dashboard that shows green for
 * a control nobody exercised is worse than no dashboard, because it is the exact
 * thing an auditor is trained to disbelieve.
 *
 * Each obligation names the receipt field that satisfies it, so the mapping can
 * be argued with rather than taken on faith — which is what you want in the room
 * where it gets argued with.
 */
import type { ReceiptV2 } from "./types.js";
export interface Obligation {
    readonly id: string;
    readonly regime: string;
    readonly clause: string;
    readonly requirement: string;
    /** The receipt field or property that satisfies it. */
    readonly satisfiedBy: string;
    /** Which records count. Deliberately explicit rather than clever. */
    readonly counts: (receipt: ReceiptV2) => boolean;
}
export declare const OBLIGATIONS: readonly Obligation[];
export interface Coverage {
    readonly obligation: Obligation;
    readonly records: number;
    /** Records covering this obligation, as a share of all records. */
    readonly share: number;
    /** True only when at least one record actually satisfies the mapping. */
    readonly covered: boolean;
}
/** Compute coverage from a set of receipts. Nothing here is a stored value. */
export declare function coverage(receipts: readonly ReceiptV2[]): Coverage[];
/** Obligations with nothing behind them — the list worth acting on. */
export declare function gaps(receipts: readonly ReceiptV2[]): Coverage[];
