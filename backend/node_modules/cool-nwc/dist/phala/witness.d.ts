/**
 * Witnesses — the one domain that has always reported `absent`.
 *
 * A log signed only by its operator proves that the operator has not
 * contradicted themselves. It cannot prove they never showed a different tree to
 * somebody else, because the same key can sign two trees. The standard answer is
 * an independent party who signs the tree heads they saw: once a witness has
 * co-signed size 40, the operator cannot later produce a size-40 tree with
 * different contents without the witness's signature failing.
 *
 * So this module is small and its consequences are not. It provides:
 *
 *   • `cosign` — a third party signs a tree head they have observed;
 *   • `attachWitness` — fold that co-signature into the STH a receipt carries;
 *   • `verifyWitnesses` — count only signatures that verify AND are external.
 *
 * The honesty rule that has been in the verifier since v1 stays exactly as it
 * was: a CooL self-signature is displayed and never counted. What changes is
 * that `pass` is now reachable by doing the real thing rather than unreachable
 * by construction.
 */
import type { DirectoryEntry, KeyPair, STH, Witness } from "../types.js";
import type { ReceiptV2 } from "./types.js";
/** What a witness publishes about a tree head it has seen. */
export interface WitnessStatement {
    readonly witness_id: string;
    readonly log_id: string;
    readonly tree_size: number;
    readonly root_hash: string;
    readonly observed_at: string;
    readonly witness: Witness;
    /** The witness's public keys, so a verifier needs nothing else. */
    readonly directory_entry: DirectoryEntry;
}
/**
 * Co-sign a tree head as an independent observer.
 *
 * The signature covers exactly the bytes the log's own signature covers, so a
 * witness never has to trust the operator's rendering of the tree — only the
 * (log_id, size, root, timestamp) it was shown.
 */
export declare function cosign(sth: STH, key: KeyPair): WitnessStatement;
/**
 * Attach a witness statement to a receipt.
 *
 * Rejects a statement for a different tree — attaching one would produce a
 * receipt whose witness signature fails, which reads as an attack rather than
 * as the mistake it is.
 */
export declare function attachWitness(receipt: ReceiptV2, statement: WitnessStatement): ReceiptV2;
/** How many independent witnesses actually verify on this receipt. */
export declare function countWitnesses(receipt: ReceiptV2): {
    external: number;
    self: number;
    invalid: number;
};
