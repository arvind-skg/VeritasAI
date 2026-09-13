import { checkQuoteStructure, enclaveReportData, measurementDiff, measurementEquals, simulatedQuoteVerifier, } from "./quote.js";
/**
 * Run the attestation handshake against an enclave endpoint.
 *
 * `expectedKey` is the public half of the key the endpoint claims to sign
 * records with. Binding it into the quote's `report_data` is what makes the
 * channel meaningful: a valid quote for the wrong key is rejected here, before
 * any data moves, rather than being discovered later by an auditor.
 */
export async function attestEndpoint(client, expectedKey, policy = {}) {
    const steps = [];
    const reasons = [];
    const step = (label, ok, detail) => {
        steps.push({ label, ok, detail });
        if (!ok)
            reasons.push(`${label}: ${detail}`);
        return ok;
    };
    const info = await client.info();
    step("enclave info", true, `${info.appName} · app ${info.appId.slice(0, 12)} · instance ${info.instanceId.slice(0, 12)}`);
    const expectedReportData = enclaveReportData(expectedKey);
    const quote = await client.getQuote(expectedReportData);
    const directory = { ...client.directory() };
    step("quote fetched", true, `${quote.format} · TCB ${quote.body.tcb_status}`);
    const structural = checkQuoteStructure(quote);
    step("quote structure", structural === null, structural?.detail ?? "well-formed");
    const allowSimulated = policy.allowSimulated ?? true;
    const simulated = quote.root === "cool-sim-root";
    if (simulated && !allowSimulated) {
        step("root of trust", false, "simulated quote rejected — policy requires hardware");
    }
    else {
        const verifier = policy.verifier ?? (simulated ? simulatedQuoteVerifier(directory) : null);
        if (!verifier) {
            const required = policy.requireVerifiedRoot ?? true;
            step("root of trust", !required, required
                ? `no verifier configured for root '${quote.root}' — refusing to transmit`
                : `root '${quote.root}' REPORTED, NOT VERIFIED (policy.requireVerifiedRoot = false)`);
        }
        else {
            const verification = await verifier.verify(quote);
            step("root of trust", verification.ok, verification.detail);
        }
    }
    if (policy.requireVendor && policy.requireVendor.length > 0) {
        const ok = policy.requireVendor.includes(quote.body.vendor);
        step("vendor", ok, ok
            ? `${quote.body.vendor} permitted`
            : `${quote.body.vendor} not in [${policy.requireVendor.join(", ")}]`);
    }
    if (policy.expectedMeasurement) {
        const ok = measurementEquals(policy.expectedMeasurement, quote.body.measurement);
        step("measurement pin", ok, ok
            ? `matches the pinned image (${quote.body.measurement.mrtd.slice(4, 16)}…)`
            : `MISMATCH in ${measurementDiff(policy.expectedMeasurement, quote.body.measurement).join(", ")} — the endpoint is not running the approved image`);
    }
    else {
        step("measurement pin", true, "no pin configured (development posture)");
    }
    const bindingOk = quote.body.report_data === expectedReportData;
    step("key binding", bindingOk, bindingOk
        ? "quote report_data commits to the endpoint's signing key"
        : "quote is for a DIFFERENT key — refusing to transmit");
    const ok = steps.every((s) => s.ok);
    step("channel", ok, ok ? "open — events may be transmitted" : "CLOSED — no data will be sent");
    return {
        ok,
        mode: client.mode,
        info,
        quote,
        directory,
        steps,
        reasons,
        at: new Date().toISOString(),
    };
}
/** Thrown when a caller tries to transmit over a channel that never attested. */
export class ChannelClosedError extends Error {
    constructor(reasons) {
        super(`RA-TLS channel closed: ${reasons.join("; ") || "attestation failed"}`);
        this.name = "ChannelClosedError";
    }
}
/**
 * An attested transport. Construct it with {@link AttestedChannel.connect} — the
 * constructor is private precisely so an unattested channel cannot exist.
 */
export class AttestedChannel {
    handshake;
    sink;
    constructor(handshake, sink) {
        this.handshake = handshake;
        this.sink = sink;
    }
    static async connect(args) {
        const handshake = await attestEndpoint(args.client, args.expectedKey, args.policy ?? {});
        return new AttestedChannel(handshake, args.sink);
    }
    get open() {
        return this.handshake.ok;
    }
    /** Transmit a batch. Rejects — never silently drops — on a closed channel. */
    async send(batch) {
        if (!this.handshake.ok)
            throw new ChannelClosedError(this.handshake.reasons);
        if (batch.length === 0)
            return;
        await this.sink(batch);
    }
}
//# sourceMappingURL=ratls.js.map