import type { KeyPair, Multihash, STH } from "../types.js";
import type { AppendResult, EvidenceLog } from "./log.js";
export interface FileLogOptions {
    /** Directory to keep the log in. Default `.cool/log`. */
    readonly dir?: string;
    /** Stable log id recorded in every STH. */
    readonly logId: string;
    /** The key that signs tree heads — sealed to the enclave measurement. */
    readonly logKey: KeyPair;
}
export declare class FileLog implements EvidenceLog {
    private readonly leafHashes;
    private readonly dir;
    private readonly leafPath;
    private readonly logId;
    private readonly logKey;
    constructor(options: FileLogOptions);
    /**
     * Rebuild the tree from disk.
     *
     * A malformed line is fatal rather than skipped: silently dropping a leaf
     * would change every root hash after it and produce a log that disagrees with
     * receipts already issued, which is worse than refusing to start.
     */
    private replay;
    get size(): number;
    /** Where the log lives, for anyone who wants to inspect or back it up. */
    get path(): string;
    append(leafData: Uint8Array): AppendResult;
    inclusionAuditPath(leafIndex: number): Multihash[];
    rootHash(): Multihash;
    buildSTH(timestamp: string): STH;
    /**
     * Keep the newest tree head on disk.
     *
     * It is what a monitor gossips, what a witness co-signs, and what proves the
     * log did not shrink while nobody was looking.
     */
    private checkpoint;
    /** The last tree head written, if any. */
    lastCheckpoint(): STH | null;
    /**
     * Proof that the tree only ever grew.
     *
     * Hand this and an older tree head to anyone who kept one, and they can check
     * that today's log still contains everything yesterday's did — the property an
     * append-only claim actually rests on.
     */
    consistency(fromSize: number): Multihash[];
}
