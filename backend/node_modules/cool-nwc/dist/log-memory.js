import { multihashFromDigest } from "./multihash.js";
import { inclusionProof, leafHash, merkleRoot } from "./merkle.js";
import { hybridSign } from "./sign.js";
import { sthSigningMessage } from "./record.js";
/**
 * A minimal append-only log. Leaves are arbitrary byte strings (CooL appends
 * the 32-byte binding digest of each record). The log is signed by `logKey`
 * and self-co-signed as a non-independent witness.
 */
export class MemoryLog {
    logId;
    logKey;
    leaves = [];
    leafHashes = [];
    /**
     * @param logId stable log identifier recorded in the STH
     * @param logKey the hybrid key that signs the STH (and self-co-signs it)
     */
    constructor(logId, logKey) {
        this.logId = logId;
        this.logKey = logKey;
    }
    /** Number of entries currently in the log. */
    get size() {
        return this.leaves.length;
    }
    /** Append a leaf, returning its index and the resulting tree size. */
    append(leafData) {
        const leafIndex = this.leaves.length;
        this.leaves.push(leafData);
        this.leafHashes.push(leafHash(leafData));
        return { leafIndex, treeSize: this.leaves.length };
    }
    /** Audit path (sibling hashes, as multihashes) proving inclusion of `leafIndex`. */
    inclusionAuditPath(leafIndex) {
        return inclusionProof(this.leafHashes, leafIndex).map(multihashFromDigest);
    }
    /** The current Merkle root as a multihash (the root digest, not re-hashed). */
    rootHash() {
        return multihashFromDigest(merkleRoot(this.leafHashes));
    }
    /**
     * Build a Signed Tree Head over the current tree, signed by the log key and
     * carrying a single CooL self co-signature (`external: false`).
     * @param timestamp caller-supplied RFC 3339 STH time (the log keeps no clock)
     */
    buildSTH(timestamp) {
        const core = {
            log_id: this.logId,
            tree_size: this.leaves.length,
            root_hash: this.rootHash(),
            timestamp,
        };
        const message = sthSigningMessage(core);
        const signature = hybridSign(message, this.logKey);
        const selfWitness = {
            id: "cool-self",
            external: false,
            alg: signature.alg,
            ml_dsa: signature.ml_dsa,
            ed25519: signature.ed25519,
        };
        return { ...core, signature, witnesses: [selfWitness] };
    }
}
//# sourceMappingURL=log-memory.js.map