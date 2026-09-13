/**
 * `cool anchor` — put the tree head somewhere nobody can move it.
 *
 * The other six domains are all signatures, and a signature says "someone with
 * this key asserts X", not "X was true at 14:02 on Tuesday". Whoever holds the
 * key can produce one at any time, including later, including about a past they
 * would prefer. Bitcoin's block headers are the cheapest widely-replicated
 * object that cannot be backdated, so that is what the head is committed into.
 *
 * Three subcommands, matching the three things that actually happen:
 *
 *   submit    hand the current head to the public calendars
 *   upgrade   ask whether it made it into a block yet (aggregation is hourly)
 *   verify    recompute the commitment and check it against the block header
 *
 * No CooL service is involved at any point. The calendars are independently
 * operated, the proof is a standard `.ots` file, and `cool anchor export` writes
 * it out so an auditor can run `ots verify` and never touch this code.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { anchorHead, attachAnchor, base64ToBytes, explorerHeaders, parseProof, reachable, upgradeProof, verifyAnchor, } from "../phala/index.js";
import { loadReceipts, saveReceipt } from "./workspace.js";
import { Progress, c, fields, g, out, panel } from "./tty.js";
/** Where anchors live, keyed by the tree size they cover. */
function anchorPath(root, size) {
    const dir = join(root, ".cool", "anchors");
    mkdirSync(dir, { recursive: true });
    return join(dir, `${size}.json`);
}
function headerSource() {
    return explorerHeaders(process.env["BITCOIN_HEADER_URL"] ?? undefined);
}
/** Re-attach an anchor to every receipt whose head it covers. */
function reattach(workspace, anchor) {
    let touched = 0;
    for (const entry of loadReceipts(workspace.root)) {
        if (entry.receipt.sth?.root_hash !== anchor.target)
            continue;
        saveReceipt(workspace.root, attachAnchor(entry.receipt, anchor));
        touched++;
    }
    return touched;
}
export async function anchorCommand(workspace, args) {
    const sub = args[0] ?? "status";
    switch (sub) {
        case "submit":
            return submitCommand(workspace);
        case "upgrade":
            return upgradeCommand(workspace);
        case "verify":
            return verifyCommand(workspace);
        case "export":
            return exportCommand(workspace, args[1]);
        case "status":
            return statusCommand(workspace);
        default:
            out(`  ${c.red(g.fail)} unknown: ${sub}. One of: submit, upgrade, verify, export, status`);
            return 1;
    }
}
/* ── submit ───────────────────────────────────────────────────────────── */
async function submitCommand(workspace) {
    const head = workspace.log?.lastCheckpoint() ?? null;
    if (!head) {
        out(`  ${c.yellow(g.warn)} nothing to anchor — seal a record first`);
        return 1;
    }
    const progress = new Progress().start("submitting the tree head to the public calendars");
    let anchor;
    try {
        anchor = await anchorHead(head.root_hash, head.tree_size);
    }
    catch (error) {
        progress.fail("no calendar accepted the head");
        out(`  ${c.faint(error.message)}`);
        out(`  ${c.faint("Offline? The head is unchanged — run this again when you have a network.")}`);
        return 1;
    }
    progress.succeed(`accepted by ${c.bold(String(anchor.calendars.length))} independent calendars`);
    writeFileSync(anchorPath(workspace.root, head.tree_size), JSON.stringify(anchor, null, 2));
    const touched = reattach(workspace, anchor);
    fields([
        ["head", c.grey(head.root_hash)],
        ["size", `${head.tree_size} record${head.tree_size === 1 ? "" : "s"}`],
        ["calendars", anchor.calendars.map((url) => new URL(url).hostname).join(", ")],
        ["receipts", `${touched} updated`],
    ]);
    out();
    out(`  ${c.faint("Bitcoin aggregation runs about hourly. Come back with")} ${c.brand("cool anchor upgrade")} ${c.faint("to collect the block.")}`);
    out();
    return 0;
}
/* ── upgrade ──────────────────────────────────────────────────────────── */
async function upgradeCommand(workspace) {
    const anchors = storedAnchors(workspace);
    if (anchors.length === 0) {
        out(`  ${c.yellow(g.warn)} no anchors yet — run ${c.brand("cool anchor submit")}`);
        return 1;
    }
    let confirmed = 0;
    for (const anchor of anchors) {
        if (anchor.heights.length > 0) {
            out(`  ${c.green(g.pass)} size ${anchor.tree_size} already in block ${anchor.heights.join(", ")}`);
            confirmed++;
            continue;
        }
        const progress = new Progress().start(`asking about the head at size ${anchor.tree_size}`);
        const { anchor: fresh, result } = await upgradeProof(anchor);
        if (result.heights.length > 0) {
            progress.succeed(`size ${anchor.tree_size} → Bitcoin block ${c.bold(result.heights.join(", "))}`);
            writeFileSync(anchorPath(workspace.root, fresh.tree_size), JSON.stringify(fresh, null, 2));
            reattach(workspace, fresh);
            confirmed++;
        }
        else {
            progress.fail(`size ${anchor.tree_size} not aggregated yet`);
            out(`    ${c.faint(`${result.stillPending} commitment${result.stillPending === 1 ? "" : "s"} still pending — ` +
                "the calendars batch hourly, so this is normal for the first hour")}`);
        }
    }
    out();
    return confirmed > 0 ? 0 : 1;
}
/* ── verify ───────────────────────────────────────────────────────────── */
async function verifyCommand(workspace) {
    const anchors = storedAnchors(workspace);
    if (anchors.length === 0) {
        out(`  ${c.yellow(g.warn)} no anchors to verify`);
        return 1;
    }
    const headers = headerSource();
    let failures = 0;
    for (const anchor of anchors) {
        const progress = new Progress().start(`checking the head at size ${anchor.tree_size}`);
        const parsed = parseProof(base64ToBytes(anchor.proof));
        const check = await verifyAnchor(parsed.digest, parsed.timestamp, headers);
        if (check.status === "confirmed")
            progress.succeed(`size ${anchor.tree_size}`);
        else if (check.status === "fail")
            progress.fail(`size ${anchor.tree_size}`);
        else
            progress.update(`size ${anchor.tree_size}`);
        const tone = check.status === "confirmed" ? c.green : check.status === "fail" ? c.red : c.yellow;
        out(`  ${tone(check.status)}  ${c.faint(check.detail)}`);
        if (check.status === "fail")
            failures++;
    }
    out();
    out(`  ${c.faint("Block headers came from")} ${c.grey(process.env["BITCOIN_HEADER_URL"] ?? "blockstream.info")}${c.faint(" — point BITCOIN_HEADER_URL at your own node to depend on nobody.")}`);
    out();
    return failures > 0 ? 1 : 0;
}
/* ── export ───────────────────────────────────────────────────────────── */
function exportCommand(workspace, target) {
    const anchors = storedAnchors(workspace);
    const anchor = anchors.at(-1);
    if (!anchor) {
        out(`  ${c.yellow(g.warn)} no anchors to export`);
        return 1;
    }
    const path = target ?? join(workspace.root, `cool-head-${anchor.tree_size}.ots`);
    writeFileSync(path, base64ToBytes(anchor.proof));
    out(`  ${c.green(g.pass)} wrote ${c.bold(path)}`);
    out();
    out(`  ${c.faint("Anyone can check it without CooL:")}`);
    out(`    ${c.dim(`ots verify -d ${anchor.target.replace("mh:sha256:", "")} ${path}`)}`);
    out();
    return 0;
}
/* ── status ───────────────────────────────────────────────────────────── */
function statusCommand(workspace) {
    const anchors = storedAnchors(workspace);
    const head = workspace.log?.lastCheckpoint() ?? null;
    panel("anchor", [
        `${c.grey("current head")}  ${head ? `${head.root_hash.slice(10, 26)}… at size ${head.tree_size}` : "—"}`,
        `${c.grey("anchors")}       ${anchors.length}`,
        `${c.grey("confirmed")}     ${anchors.filter((a) => a.heights.length > 0).length}`,
    ]);
    out();
    for (const anchor of anchors) {
        const pending = reachable(parseProof(base64ToBytes(anchor.proof)).timestamp).filter((entry) => entry.attestation.kind === "pending").length;
        out(`  ${anchor.heights.length > 0 ? c.green(g.pass) : c.yellow(g.partial)} size ${String(anchor.tree_size).padEnd(5)} ${anchor.heights.length > 0
            ? c.green(`Bitcoin block ${anchor.heights.join(", ")}`)
            : c.yellow(`pending — ${pending} calendar commitment${pending === 1 ? "" : "s"}`)}  ${c.faint(anchor.submitted_at)}`);
    }
    if (anchors.length === 0) {
        out(`  ${c.faint("Nothing anchored yet.")} ${c.brand("cool anchor submit")}`);
    }
    out();
    return 0;
}
function storedAnchors(workspace) {
    const found = new Map();
    for (const entry of loadReceipts(workspace.root)) {
        const anchor = entry.receipt.anchor;
        if (anchor)
            found.set(anchor.tree_size, anchor);
    }
    return [...found.values()].sort((a, b) => a.tree_size - b.tree_size);
}
//# sourceMappingURL=anchor.js.map