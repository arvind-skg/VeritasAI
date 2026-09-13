import type { AnchorProof, ReceiptV2 } from "./types.js";
export declare function hexToBytes(hex: string): Uint8Array;
export declare function bytesToHex(bytes: Uint8Array): string;
/** Base64 without assuming Node or a browser — the SDK runs in both. */
export declare function bytesToBase64(bytes: Uint8Array): string;
export declare function base64ToBytes(base64: string): Uint8Array;
/** One step in the commitment path. */
export interface AnchorOp {
    readonly tag: number;
    /** Argument for append/prepend; absent for the hash ops. */
    readonly arg?: Uint8Array;
}
/** Where a commitment ended up. */
export type Attestation = {
    readonly kind: "pending";
    readonly uri: string;
} | {
    readonly kind: "bitcoin";
    readonly height: number;
} | {
    readonly kind: "litecoin";
    readonly height: number;
} | {
    readonly kind: "ethereum";
    readonly height: number;
} | {
    readonly kind: "unknown";
    readonly tag: string;
    readonly payload: Uint8Array;
};
/**
 * A timestamp is a tree: a message, the attestations made about it directly,
 * and the operations that lead to further messages further up.
 */
export interface Timestamp {
    readonly msg: Uint8Array;
    readonly attestations: Attestation[];
    readonly ops: {
        op: AnchorOp;
        stamp: Timestamp;
    }[];
}
/** Apply one operation to a message. This is the whole of the proof's semantics. */
export declare function applyOp(op: AnchorOp, msg: Uint8Array): Uint8Array;
/** Parse a `.ots` file. Returns the digest it is about and the proof tree. */
export declare function parseProof(bytes: Uint8Array): {
    digest: Uint8Array;
    timestamp: Timestamp;
};
/** Write a `.ots` file. Byte-identical to the reference tool's output. */
export declare function serialiseProof(digest: Uint8Array, timestamp: Timestamp): Uint8Array;
/** Union two proofs about the same message. Used to fold in an upgrade. */
export declare function merge(into: Timestamp, from: Timestamp): void;
/** An attestation together with the message it is about. */
export interface Reached {
    readonly attestation: Attestation;
    readonly commitment: Uint8Array;
}
export declare function reachable(stamp: Timestamp): Reached[];
/**
 * The default calendars. Four operators, none of them CooL, none of them Phala.
 * That independence is the point: a timestamp is only worth what the party
 * holding it cannot forge, and these parties do not know each other.
 */
export declare const CALENDARS: readonly string[];
export interface SubmitOptions {
    readonly calendars?: readonly string[];
    readonly fetchImpl?: typeof fetch;
    readonly timeoutMs?: number;
}
export interface SubmitResult {
    readonly digest: Uint8Array;
    readonly timestamp: Timestamp;
    readonly accepted: readonly string[];
    readonly refused: readonly {
        readonly calendar: string;
        readonly reason: string;
    }[];
}
/**
 * Submit a digest to the calendars.
 *
 * A calendar that fails is recorded rather than thrown: the whole reason to use
 * four is that any one of them can be down, and a proof from three is a proof.
 */
export declare function submit(digest: Uint8Array, options?: SubmitOptions): Promise<SubmitResult>;
export interface UpgradeResult {
    readonly upgraded: boolean;
    readonly heights: readonly number[];
    readonly stillPending: number;
}
/**
 * Ask the calendars whether the pending commitments made it into a block.
 *
 * Aggregation is hourly, so calling this too early is normal and reported as
 * "still pending" rather than as a failure.
 */
export declare function upgrade(timestamp: Timestamp, options?: SubmitOptions): Promise<UpgradeResult>;
/** Look up a Bitcoin block header's merkle root, in display (big-endian) hex. */
export type BlockHeaderSource = (height: number) => Promise<string | null>;
export interface AnchorCheck {
    readonly status: "confirmed" | "pending" | "submitted" | "fail";
    readonly detail: string;
    readonly heights: readonly number[];
    readonly calendars: readonly string[];
}
/**
 * Verify a proof against the digest it claims to be about.
 *
 * The hash chain is recomputed from the digest — `parseProof` already did that
 * while reading, since every sub-message is derived rather than stored, so a
 * tampered proof cannot parse into something that verifies. What remains is the
 * part no proof can carry: whether the block really has that merkle root. With
 * no header source, this reports `pending`, never `confirmed`. A timestamp
 * nobody checked against a chain is not an anchor.
 */
export declare function verifyAnchor(digest: Uint8Array, timestamp: Timestamp, headers?: BlockHeaderSource): Promise<AnchorCheck>;
/**
 * Anchor a tree head and produce the proof record that goes in a receipt.
 *
 * The digest submitted is the tree head root itself, so one submission covers
 * every record in the log up to that size — anchoring per-receipt would be
 * thousands of Bitcoin commitments for no extra proof.
 */
export declare function anchorHead(rootHash: string, treeSize: number, options?: SubmitOptions & {
    readonly now?: string;
}): Promise<AnchorProof>;
/** Re-ask the calendars, returning a proof that now names its blocks. */
export declare function upgradeProof(anchor: AnchorProof, options?: SubmitOptions): Promise<{
    anchor: AnchorProof;
    result: UpgradeResult;
}>;
/**
 * Attach an anchor to a receipt.
 *
 * Refuses when the proof is about a different head. The check is cheap and the
 * failure it prevents — a receipt carrying a valid proof of something else — is
 * exactly the kind that survives casual review.
 */
export declare function attachAnchor(receipt: ReceiptV2, anchor: AnchorProof): ReceiptV2;
/**
 * Block headers from a public explorer.
 *
 * Convenient, and a trusted third party — which is why `verifyAnchor` takes the
 * source as an argument. Point it at your own node with `BITCOIN_HEADER_URL`
 * and the proof stops depending on anyone's goodwill.
 */
export declare function explorerHeaders(base?: string, fetchImpl?: typeof fetch): BlockHeaderSource;
