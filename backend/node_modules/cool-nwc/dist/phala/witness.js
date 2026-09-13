import { hybridSign, hybridVerify } from "../sign.js";
import { sthCore, sthSigningMessage } from "../record.js";
/**
 * Co-sign a tree head as an independent observer.
 *
 * The signature covers exactly the bytes the log's own signature covers, so a
 * witness never has to trust the operator's rendering of the tree — only the
 * (log_id, size, root, timestamp) it was shown.
 */
export function cosign(sth, key) {
    const signature = hybridSign(sthSigningMessage(sthCore(sth)), key);
    return {
        witness_id: key.keyId,
        log_id: sth.log_id,
        tree_size: sth.tree_size,
        root_hash: sth.root_hash,
        // The tree head's own timestamp, not the wall clock: this statement is
        // about a specific head, and that head is identified by its timestamp too.
        observed_at: sth.timestamp,
        witness: {
            id: key.keyId,
            external: true,
            alg: signature.alg,
            ml_dsa: signature.ml_dsa,
            ed25519: signature.ed25519,
        },
        directory_entry: key.directoryEntry,
    };
}
/**
 * Attach a witness statement to a receipt.
 *
 * Rejects a statement for a different tree — attaching one would produce a
 * receipt whose witness signature fails, which reads as an attack rather than
 * as the mistake it is.
 */
export function attachWitness(receipt, statement) {
    if (!receipt.sth) {
        throw new Error("this receipt carries no tree head to witness");
    }
    // The timestamp is inside the bytes the witness signed, so a statement made
    // against a different tree head — even one with the same size and root — would
    // attach cleanly and then fail to verify, which reads as an attack rather than
    // as the mistake it is.
    if (statement.log_id !== receipt.sth.log_id ||
        statement.tree_size !== receipt.sth.tree_size ||
        statement.root_hash !== receipt.sth.root_hash ||
        statement.observed_at !== receipt.sth.timestamp) {
        throw new Error(`witness statement is for ${statement.log_id}@${statement.tree_size}, ` +
            `this receipt carries ${receipt.sth.log_id}@${receipt.sth.tree_size}`);
    }
    const already = receipt.sth.witnesses.some((w) => w.id === statement.witness_id);
    const witnesses = already
        ? receipt.sth.witnesses
        : [...receipt.sth.witnesses, statement.witness];
    const directory = {
        ...receipt.key_directory,
        [statement.witness_id]: statement.directory_entry,
    };
    return { ...receipt, sth: { ...receipt.sth, witnesses }, key_directory: directory };
}
/** How many independent witnesses actually verify on this receipt. */
export function countWitnesses(receipt) {
    if (!receipt.sth)
        return { external: 0, self: 0, invalid: 0 };
    const message = sthSigningMessage(sthCore(receipt.sth));
    let external = 0;
    let self = 0;
    let invalid = 0;
    for (const w of receipt.sth.witnesses) {
        if (!w.external) {
            self++;
            continue;
        }
        const entry = receipt.key_directory[w.id];
        const ok = entry !== undefined &&
            hybridVerify(message, { alg: w.alg, key_id: w.id, ml_dsa: w.ml_dsa, ed25519: w.ed25519 }, entry)
                .ok;
        if (ok)
            external++;
        else
            invalid++;
    }
    return { external, self, invalid };
}
//# sourceMappingURL=witness.js.map