/**
 * Anchoring tree heads to Bitcoin, for real.
 *
 * The `anchor` domain answers a question the other six cannot: *when* did this
 * exist? Every other proof in a receipt is signed by someone — CooL, the
 * silicon, a witness — and a signature can be produced at any time by whoever
 * holds the key. A Bitcoin block header cannot. If a tree head is committed
 * inside block 900,000, then that head existed before that block was mined, and
 * no amount of key compromise changes it afterwards.
 *
 * This is an OpenTimestamps client — the format, not a lookalike. Proofs written
 * here are byte-identical to what the `ots` tool produces, verify with
 * `ots verify`, and depend on no CooL service: the calendars are public and
 * independently operated, and the final proof is a chain of hashes into a block
 * header that anyone with a Bitcoin node can check.
 *
 * The honest shape of it:
 *
 *   submitted  → calendars accepted the digest, nothing is on-chain yet
 *   pending    → the proof commits to a block, that block is unverified here
 *   confirmed  → the recomputed root equals the header's merkle root
 *
 * Only the third is a `pass`. Aggregation happens roughly hourly, so the gap
 * between the first and the last is normally an hour or two — which is the
 * truth about Bitcoin, not a limitation of this code.
 */
import { sha256 } from "@noble/hashes/sha2";
import { sha1, ripemd160 } from "@noble/hashes/legacy";
import { keccak_256 } from "@noble/hashes/sha3";
/* ── the wire format ──────────────────────────────────────────────────── */
/** `\0OpenTimestamps\0\0Proof\0` + 8 magic bytes. Detached-proof file header. */
const HEADER_MAGIC = hexToBytes("004f70656e54696d657374616d7073000050726f6f6600bf89e2e884e89294");
const MAJOR_VERSION = 1;
const TAG_PENDING = "83dfe30d2ef90c8e";
const TAG_BITCOIN = "0588960d73d71901";
const TAG_LITECOIN = "06869a0d73d71b45";
const TAG_ETHEREUM = "30fe8087b5c7ead7";
/** Op tags. Unary ops hash; binary ops carry an argument. */
const OP_SHA1 = 0x02;
const OP_RIPEMD160 = 0x03;
const OP_SHA256 = 0x08;
const OP_KECCAK256 = 0x67;
const OP_APPEND = 0xf0;
const OP_PREPEND = 0xf1;
const OP_REVERSE = 0xf2;
const OP_HEXLIFY = 0xf3;
export function hexToBytes(hex) {
    const clean = hex.startsWith("hex:") ? hex.slice(4) : hex;
    const out = new Uint8Array(clean.length / 2);
    for (let i = 0; i < out.length; i++)
        out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
    return out;
}
export function bytesToHex(bytes) {
    let out = "";
    for (const byte of bytes)
        out += byte.toString(16).padStart(2, "0");
    return out;
}
/** Base64 without assuming Node or a browser — the SDK runs in both. */
export function bytesToBase64(bytes) {
    let binary = "";
    for (const byte of bytes)
        binary += String.fromCharCode(byte);
    return typeof btoa === "function"
        ? btoa(binary)
        : globalThis
            .Buffer.from(binary, "binary")
            .toString("base64");
}
export function base64ToBytes(base64) {
    const binary = typeof atob === "function"
        ? atob(base64)
        : globalThis.Buffer.from(base64, "base64").toString("binary");
    const out = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++)
        out[i] = binary.charCodeAt(i);
    return out;
}
/* ── reading ──────────────────────────────────────────────────────────── */
class Reader {
    bytes;
    offset = 0;
    constructor(bytes) {
        this.bytes = bytes;
    }
    get done() {
        return this.offset >= this.bytes.length;
    }
    byte() {
        if (this.offset >= this.bytes.length)
            throw new Error("proof ended mid-structure");
        return this.bytes[this.offset++];
    }
    take(n) {
        if (this.offset + n > this.bytes.length)
            throw new Error("proof ended mid-value");
        const slice = this.bytes.subarray(this.offset, this.offset + n);
        this.offset += n;
        return slice;
    }
    /** Base-128, little-endian, high bit continues. */
    varuint() {
        let value = 0;
        let shift = 0;
        for (;;) {
            const byte = this.byte();
            value += (byte & 0x7f) * 2 ** shift;
            if ((byte & 0x80) === 0)
                return value;
            shift += 7;
            if (shift > 56)
                throw new Error("varuint too large to be meaningful");
        }
    }
    varbytes() {
        return this.take(this.varuint());
    }
    expect(magic, what) {
        const seen = this.take(magic.length);
        for (let i = 0; i < magic.length; i++) {
            if (seen[i] !== magic[i])
                throw new Error(`not ${what} — magic bytes do not match`);
        }
    }
}
class Writer {
    chunks = [];
    byte(value) {
        this.chunks.push(value & 0xff);
    }
    bytes(value) {
        for (const byte of value)
            this.chunks.push(byte);
    }
    varuint(value) {
        let remaining = value;
        if (remaining === 0) {
            this.byte(0);
            return;
        }
        for (;;) {
            let byte = remaining & 0x7f;
            if (remaining > 0x7f)
                byte |= 0x80;
            this.byte(byte);
            if (remaining <= 0x7f)
                return;
            remaining = Math.floor(remaining / 128);
        }
    }
    varbytes(value) {
        this.varuint(value.length);
        this.bytes(value);
    }
    finish() {
        return Uint8Array.from(this.chunks);
    }
}
function readAttestation(reader) {
    const tag = bytesToHex(reader.take(8));
    const payload = new Reader(reader.varbytes());
    if (tag === TAG_PENDING)
        return { kind: "pending", uri: new TextDecoder().decode(payload.varbytes()) };
    if (tag === TAG_BITCOIN)
        return { kind: "bitcoin", height: payload.varuint() };
    if (tag === TAG_LITECOIN)
        return { kind: "litecoin", height: payload.varuint() };
    if (tag === TAG_ETHEREUM)
        return { kind: "ethereum", height: payload.varuint() };
    return { kind: "unknown", tag, payload: new Uint8Array() };
}
function writeAttestation(writer, attestation) {
    const payload = new Writer();
    let tag;
    switch (attestation.kind) {
        case "pending":
            tag = TAG_PENDING;
            payload.varbytes(new TextEncoder().encode(attestation.uri));
            break;
        case "bitcoin":
            tag = TAG_BITCOIN;
            payload.varuint(attestation.height);
            break;
        case "litecoin":
            tag = TAG_LITECOIN;
            payload.varuint(attestation.height);
            break;
        case "ethereum":
            tag = TAG_ETHEREUM;
            payload.varuint(attestation.height);
            break;
        default:
            tag = attestation.tag;
            payload.bytes(attestation.payload);
    }
    writer.bytes(hexToBytes(tag));
    writer.varbytes(payload.finish());
}
function readOp(reader, tag) {
    if (tag === OP_APPEND || tag === OP_PREPEND)
        return { tag, arg: reader.varbytes() };
    return { tag };
}
/** Apply one operation to a message. This is the whole of the proof's semantics. */
export function applyOp(op, msg) {
    switch (op.tag) {
        case OP_SHA256:
            return sha256(msg);
        case OP_SHA1:
            return sha1(msg);
        case OP_RIPEMD160:
            return ripemd160(msg);
        case OP_KECCAK256:
            return keccak_256(msg);
        case OP_APPEND:
            return concat(msg, op.arg ?? new Uint8Array());
        case OP_PREPEND:
            return concat(op.arg ?? new Uint8Array(), msg);
        case OP_REVERSE:
            return Uint8Array.from(msg).reverse();
        case OP_HEXLIFY:
            return new TextEncoder().encode(bytesToHex(msg));
        default:
            throw new Error(`unknown operation 0x${op.tag.toString(16)} — refusing to guess`);
    }
}
function concat(a, b) {
    const out = new Uint8Array(a.length + b.length);
    out.set(a, 0);
    out.set(b, a.length);
    return out;
}
function readTimestamp(reader, msg) {
    const stamp = { msg, attestations: [], ops: [] };
    const one = (tag) => {
        if (tag === 0x00) {
            stamp.attestations.push(readAttestation(reader));
            return;
        }
        const op = readOp(reader, tag);
        stamp.ops.push({ op, stamp: readTimestamp(reader, applyOp(op, msg)) });
    };
    let tag = reader.byte();
    while (tag === 0xff) {
        one(reader.byte());
        tag = reader.byte();
    }
    one(tag);
    return stamp;
}
/**
 * Serialisation is order-sensitive: attestations before ops, everything sorted,
 * `0xff` separating all but the last item. Getting this wrong produces a file
 * that this code round-trips happily and `ots` rejects, so it follows the
 * reference implementation exactly.
 */
function writeTimestamp(writer, stamp) {
    const attestations = [...stamp.attestations].sort(compareAttestations);
    const ops = [...stamp.ops].sort((a, b) => compareOps(a.op, b.op));
    if (attestations.length === 0 && ops.length === 0) {
        throw new Error("a timestamp with neither attestation nor operation says nothing");
    }
    for (const attestation of attestations.slice(0, -1)) {
        writer.byte(0xff);
        writer.byte(0x00);
        writeAttestation(writer, attestation);
    }
    if (attestations.length > 0) {
        if (ops.length > 0) {
            writer.byte(0xff);
            writer.byte(0x00);
        }
        else {
            writer.byte(0x00);
        }
        writeAttestation(writer, attestations[attestations.length - 1]);
    }
    for (const [index, entry] of ops.entries()) {
        if (index < ops.length - 1)
            writer.byte(0xff);
        writer.byte(entry.op.tag);
        if (entry.op.arg)
            writer.varbytes(entry.op.arg);
        writeTimestamp(writer, entry.stamp);
    }
}
function attestationKey(attestation) {
    const writer = new Writer();
    writeAttestation(writer, attestation);
    return writer.finish();
}
function opKey(op) {
    const writer = new Writer();
    writer.byte(op.tag);
    if (op.arg)
        writer.varbytes(op.arg);
    return writer.finish();
}
/**
 * Ordering, exactly as the reference implementation defines it.
 *
 * This matters more than it looks. Serialisation order is part of the format,
 * so a proof written in a different order is a different file — it still
 * *verifies*, but it is no longer byte-identical to what `ots` would write, and
 * anyone diffing the two has to work out why. Ops compare by tag, then by
 * argument as raw bytes (a prefix sorts first); attestations compare within a
 * kind — pending by URI string, blockchain by height — and across kinds by tag.
 */
function compareBytes(a, b) {
    const shared = Math.min(a.length, b.length);
    for (let i = 0; i < shared; i++) {
        if (a[i] !== b[i])
            return a[i] - b[i];
    }
    return a.length - b.length;
}
function compareOps(a, b) {
    if (a.tag !== b.tag)
        return a.tag - b.tag;
    return compareBytes(a.arg ?? new Uint8Array(), b.arg ?? new Uint8Array());
}
function attestationTag(attestation) {
    switch (attestation.kind) {
        case "pending":
            return TAG_PENDING;
        case "bitcoin":
            return TAG_BITCOIN;
        case "litecoin":
            return TAG_LITECOIN;
        case "ethereum":
            return TAG_ETHEREUM;
        default:
            return attestation.tag;
    }
}
function compareAttestations(a, b) {
    if (a.kind !== b.kind) {
        return compareBytes(hexToBytes(attestationTag(a)), hexToBytes(attestationTag(b)));
    }
    if (a.kind === "pending" && b.kind === "pending") {
        return a.uri < b.uri ? -1 : a.uri > b.uri ? 1 : 0;
    }
    if (a.kind === "unknown" && b.kind === "unknown") {
        const byTag = compareBytes(hexToBytes(a.tag), hexToBytes(b.tag));
        return byTag !== 0 ? byTag : compareBytes(a.payload, b.payload);
    }
    return a.height - b.height;
}
/* ── detached proof files ─────────────────────────────────────────────── */
/** Parse a `.ots` file. Returns the digest it is about and the proof tree. */
export function parseProof(bytes) {
    const reader = new Reader(bytes);
    reader.expect(HEADER_MAGIC, "an OpenTimestamps proof");
    const version = reader.varuint();
    if (version !== MAJOR_VERSION)
        throw new Error(`proof version ${version} is not supported`);
    const hashOp = reader.byte();
    const length = hashOp === OP_SHA256 || hashOp === OP_KECCAK256 ? 32 : hashOp === OP_SHA1 ? 20 : 20;
    const digest = reader.take(length);
    return { digest, timestamp: readTimestamp(reader, digest) };
}
/** Write a `.ots` file. Byte-identical to the reference tool's output. */
export function serialiseProof(digest, timestamp) {
    const writer = new Writer();
    writer.bytes(HEADER_MAGIC);
    writer.varuint(MAJOR_VERSION);
    writer.byte(OP_SHA256);
    writer.bytes(digest);
    writeTimestamp(writer, timestamp);
    return writer.finish();
}
/** Union two proofs about the same message. Used to fold in an upgrade. */
export function merge(into, from) {
    if (bytesToHex(into.msg) !== bytesToHex(from.msg)) {
        throw new Error("refusing to merge proofs about different messages");
    }
    for (const attestation of from.attestations) {
        const key = bytesToHex(attestationKey(attestation));
        if (!into.attestations.some((existing) => bytesToHex(attestationKey(existing)) === key)) {
            into.attestations.push(attestation);
        }
    }
    for (const entry of from.ops) {
        const key = bytesToHex(opKey(entry.op));
        const mine = into.ops.find((existing) => bytesToHex(opKey(existing.op)) === key);
        if (mine)
            merge(mine.stamp, entry.stamp);
        else
            into.ops.push(entry);
    }
}
export function reachable(stamp) {
    const found = [];
    for (const attestation of stamp.attestations)
        found.push({ attestation, commitment: stamp.msg });
    for (const entry of stamp.ops)
        found.push(...reachable(entry.stamp));
    return found;
}
/* ── the calendars ────────────────────────────────────────────────────── */
/**
 * The default calendars. Four operators, none of them CooL, none of them Phala.
 * That independence is the point: a timestamp is only worth what the party
 * holding it cannot forge, and these parties do not know each other.
 */
export const CALENDARS = [
    "https://alice.btc.calendar.opentimestamps.org",
    "https://bob.btc.calendar.opentimestamps.org",
    "https://finney.calendar.eternitywall.com",
    "https://btc.calendar.catallaxy.com",
];
/**
 * Submit a digest to the calendars.
 *
 * A calendar that fails is recorded rather than thrown: the whole reason to use
 * four is that any one of them can be down, and a proof from three is a proof.
 */
export async function submit(digest, options = {}) {
    if (digest.length !== 32)
        throw new Error("anchor a 32-byte digest — the tree head root");
    const calendars = options.calendars ?? CALENDARS;
    const doFetch = options.fetchImpl ?? globalThis.fetch.bind(globalThis);
    const timeoutMs = options.timeoutMs ?? 15_000;
    const combined = { msg: digest, attestations: [], ops: [] };
    const accepted = [];
    const refused = [];
    await Promise.all(calendars.map(async (calendar) => {
        try {
            const response = await doFetch(`${calendar}/digest`, {
                method: "POST",
                body: digest,
                headers: {
                    "content-type": "application/x-www-form-urlencoded",
                    accept: "application/vnd.opentimestamps.v1",
                    "user-agent": "cool-nwc",
                },
                signal: AbortSignal.timeout(timeoutMs),
            });
            if (!response.ok)
                throw new Error(`HTTP ${response.status}`);
            const body = new Uint8Array(await response.arrayBuffer());
            merge(combined, readTimestamp(new Reader(body), digest));
            accepted.push(calendar);
        }
        catch (error) {
            refused.push({ calendar, reason: error.message });
        }
    }));
    if (accepted.length === 0) {
        throw new Error(`no calendar accepted the digest (${refused
            .map((entry) => `${entry.calendar}: ${entry.reason}`)
            .join("; ")})`);
    }
    return { digest, timestamp: combined, accepted, refused };
}
/**
 * Ask the calendars whether the pending commitments made it into a block.
 *
 * Aggregation is hourly, so calling this too early is normal and reported as
 * "still pending" rather than as a failure.
 */
export async function upgrade(timestamp, options = {}) {
    const doFetch = options.fetchImpl ?? globalThis.fetch.bind(globalThis);
    const timeoutMs = options.timeoutMs ?? 15_000;
    let upgraded = false;
    let stillPending = 0;
    const pending = reachable(timestamp).filter((entry) => entry.attestation.kind === "pending");
    for (const entry of pending) {
        const uri = entry.attestation.uri;
        const commitment = bytesToHex(entry.commitment);
        try {
            const response = await doFetch(`${uri}/timestamp/${commitment}`, {
                headers: { accept: "application/vnd.opentimestamps.v1", "user-agent": "cool-nwc" },
                signal: AbortSignal.timeout(timeoutMs),
            });
            if (response.status === 404) {
                stillPending++;
                continue;
            }
            if (!response.ok)
                throw new Error(`HTTP ${response.status}`);
            const body = new Uint8Array(await response.arrayBuffer());
            const fresh = readTimestamp(new Reader(body), entry.commitment);
            spliceAt(timestamp, entry.commitment, fresh);
            upgraded = true;
        }
        catch {
            stillPending++;
        }
    }
    const heights = reachable(timestamp)
        .filter((entry) => entry.attestation.kind === "bitcoin")
        .map((entry) => entry.attestation.height);
    return { upgraded, heights: [...new Set(heights)].sort((a, b) => a - b), stillPending };
}
function spliceAt(stamp, commitment, fresh) {
    if (bytesToHex(stamp.msg) === bytesToHex(commitment)) {
        merge(stamp, fresh);
        return;
    }
    for (const entry of stamp.ops)
        spliceAt(entry.stamp, commitment, fresh);
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
export async function verifyAnchor(digest, timestamp, headers) {
    if (bytesToHex(timestamp.msg) !== bytesToHex(digest)) {
        return {
            status: "fail",
            detail: "the proof is about a different digest than the head it is attached to",
            heights: [],
            calendars: [],
        };
    }
    const reached = reachable(timestamp);
    const calendars = reached
        .filter((entry) => entry.attestation.kind === "pending")
        .map((entry) => entry.attestation.uri);
    const bitcoin = reached.filter((entry) => entry.attestation.kind === "bitcoin");
    const heights = [...new Set(bitcoin.map((entry) => entry.attestation.height))];
    if (bitcoin.length === 0) {
        return {
            status: "submitted",
            detail: `accepted by ${calendars.length} calendar${calendars.length === 1 ? "" : "s"}, not yet aggregated into a block (Bitcoin aggregation is hourly)`,
            heights: [],
            calendars,
        };
    }
    if (!headers) {
        return {
            status: "pending",
            detail: `commits to Bitcoin block${heights.length === 1 ? "" : "s"} ${heights.join(", ")} — no block header source given, so the commitment is unchecked`,
            heights,
            calendars,
        };
    }
    for (const entry of bitcoin) {
        const height = entry.attestation.height;
        const expected = await headers(height);
        if (expected === null) {
            return {
                status: "pending",
                detail: `could not read the header of block ${height} to check the commitment`,
                heights,
                calendars,
            };
        }
        // The commitment is the merkle root in internal byte order; explorers show
        // it reversed. Compare in one direction and say so.
        const computed = bytesToHex(Uint8Array.from(entry.commitment).reverse());
        if (computed !== expected.toLowerCase()) {
            return {
                status: "fail",
                detail: `block ${height} has merkle root ${expected}, the proof commits to ${computed}`,
                heights,
                calendars,
            };
        }
    }
    return {
        status: "confirmed",
        detail: `committed in Bitcoin block${heights.length === 1 ? "" : "s"} ${heights.join(", ")} — the head existed before that block was mined`,
        heights,
        calendars,
    };
}
/* ── attaching to receipts ────────────────────────────────────────────── */
/**
 * Anchor a tree head and produce the proof record that goes in a receipt.
 *
 * The digest submitted is the tree head root itself, so one submission covers
 * every record in the log up to that size — anchoring per-receipt would be
 * thousands of Bitcoin commitments for no extra proof.
 */
export async function anchorHead(rootHash, treeSize, options = {}) {
    const result = await submit(hexToBytes(rootHash.replace(/^mh:sha256:/, "")), options);
    return {
        kind: "opentimestamps",
        chain: "bitcoin",
        target: rootHash,
        tree_size: treeSize,
        proof: bytesToBase64(serialiseProof(result.digest, result.timestamp)),
        calendars: result.accepted,
        submitted_at: options.now ?? new Date().toISOString(),
        heights: [],
    };
}
/** Re-ask the calendars, returning a proof that now names its blocks. */
export async function upgradeProof(anchor, options = {}) {
    const parsed = parseProof(base64ToBytes(anchor.proof));
    const result = await upgrade(parsed.timestamp, options);
    return {
        anchor: {
            ...anchor,
            proof: bytesToBase64(serialiseProof(parsed.digest, parsed.timestamp)),
            heights: result.heights,
        },
        result,
    };
}
/**
 * Attach an anchor to a receipt.
 *
 * Refuses when the proof is about a different head. The check is cheap and the
 * failure it prevents — a receipt carrying a valid proof of something else — is
 * exactly the kind that survives casual review.
 */
export function attachAnchor(receipt, anchor) {
    if (!receipt.sth)
        throw new Error("this receipt has no tree head to anchor");
    if (receipt.sth.root_hash !== anchor.target) {
        throw new Error(`refusing to attach: the proof covers ${anchor.target}, this receipt's head is ${receipt.sth.root_hash}`);
    }
    if (receipt.sth.tree_size !== anchor.tree_size) {
        throw new Error(`refusing to attach: the proof is for tree size ${anchor.tree_size}, this receipt is at ${receipt.sth.tree_size}`);
    }
    return { ...receipt, anchor };
}
/**
 * Block headers from a public explorer.
 *
 * Convenient, and a trusted third party — which is why `verifyAnchor` takes the
 * source as an argument. Point it at your own node with `BITCOIN_HEADER_URL`
 * and the proof stops depending on anyone's goodwill.
 */
export function explorerHeaders(base = "https://blockstream.info/api", fetchImpl) {
    const doFetch = fetchImpl ?? globalThis.fetch.bind(globalThis);
    return async (height) => {
        try {
            const hashResponse = await doFetch(`${base}/block-height/${height}`, {
                signal: AbortSignal.timeout(15_000),
            });
            if (!hashResponse.ok)
                return null;
            const hash = (await hashResponse.text()).trim();
            const blockResponse = await doFetch(`${base}/block/${hash}`, {
                signal: AbortSignal.timeout(15_000),
            });
            if (!blockResponse.ok)
                return null;
            const block = (await blockResponse.json());
            return block.merkle_root ?? null;
        }
        catch {
            return null;
        }
    };
}
//# sourceMappingURL=anchor.js.map