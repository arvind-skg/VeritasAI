import type { HexField, KeyDirectory, Multihash } from "../types.js";
import type { Measurement, QuoteEnvelope, RuntimeMode, TeeVendor } from "./types.js";
/** One entry of the RTMR event log — what was extended, and with what. */
export interface EnclaveEvent {
    /** Which measurement register the event extended (0–3). */
    readonly imr: 0 | 1 | 2 | 3;
    readonly event: string;
    readonly digest: HexField;
}
/** Everything the guest agent knows about the VM it is running in. */
export interface EnclaveInfo {
    readonly appId: string;
    readonly instanceId: string;
    readonly appName: string;
    readonly vendor: TeeVendor;
    readonly mode: RuntimeMode;
    readonly measurement: Measurement;
    readonly tcbStatus: string;
    readonly eventLog: readonly EnclaveEvent[];
    /** Digest of the deployed compose/image — the input MRTD is derived from. */
    readonly imageDigest: string;
    /** Public ingress for the CVM, when dstack-gateway has published one. */
    readonly appUrl: string | null;
}
/**
 * The three calls CooL makes into the enclave. Anything that can satisfy this
 * interface — the real agent, the simulator, a test double — can host the
 * evidence plane, which is what keeps the SDK free of TEE-specific branches.
 */
export interface DstackClient {
    readonly mode: RuntimeMode;
    /** Who am I, and what is my measurement? */
    info(): Promise<EnclaveInfo>;
    /** Ask the hardware to sign a quote binding `reportData` to this measurement. */
    getQuote(reportData: Multihash): Promise<QuoteEnvelope>;
    /** Derive a 32-byte secret that only this measurement can obtain (dstack-KMS). */
    deriveKey(path: string): Promise<Uint8Array>;
    /**
     * Public keys a verifier needs that are not otherwise in the receipt. Empty on
     * hardware (Intel's roots are not ours to publish); the simulator returns its
     * root's public half so simulated receipts stay offline-verifiable.
     */
    directory(): KeyDirectory;
}
/** Wire-level options for {@link HttpDstackClient}. */
export interface HttpDstackOptions {
    /**
     * Guest-agent endpoint. Inside a dstack CVM this is the unix socket
     * `/var/run/dstack.sock`; over TCP (dev, or the dstack simulator binary) it is
     * an http:// URL. Node reaches the socket with `undici`'s socketPath or via
     * `DSTACK_SIMULATOR_ENDPOINT`; both arrive here as a base URL.
     */
    readonly endpoint: string;
    /**
     * RPC paths. dstack renamed these between the `tappd` generation and the
     * current agent, so they are overridable rather than hard-coded — confirm the
     * pair for your image before shipping.
     */
    readonly paths?: {
        readonly info?: string;
        readonly quote?: string;
        readonly key?: string;
    };
    readonly headers?: Readonly<Record<string, string>>;
    /** Vendor of the host silicon. Recorded in the runtime block. */
    readonly vendor?: TeeVendor;
    /**
     * `Info` takes no arguments, so it is a GET by default. Strict prpc endpoints
     * answer 405 to that and want a POST with an empty body — hence the switch,
     * which is cheaper than discovering the difference in a customer's cluster.
     */
    readonly infoMethod?: "GET" | "POST";
    /** Purpose string passed to the key provider. */
    readonly keyPurpose?: string;
    readonly fetchImpl?: typeof fetch;
}
/**
 * Talks to the dstack guest agent inside a confidential VM.
 *
 * Nothing here is Phala-proprietary: the same shape works against any agent that
 * can answer "what is my measurement", "quote these 64 bytes" and "derive a key
 * bound to me". That portability is deliberate — it is also what stops this
 * integration from becoming a lock-in.
 */
export declare class HttpDstackClient implements DstackClient {
    readonly mode: RuntimeMode;
    private readonly endpoint;
    private readonly vendor;
    private readonly fetchImpl;
    private readonly infoPath;
    private readonly quotePath;
    private readonly keyPath;
    private readonly headers;
    private readonly infoMethod;
    private readonly keyPurpose;
    constructor(options: HttpDstackOptions);
    private rpc;
    info(): Promise<EnclaveInfo>;
    getQuote(reportData: Multihash): Promise<QuoteEnvelope>;
    deriveKey(path: string): Promise<Uint8Array>;
    directory(): KeyDirectory;
}
/** Options for {@link SimulatedDstackClient}. */
export interface SimulatedDstackOptions {
    readonly appName: string;
    /**
     * Digest of the deployed image / compose file. THE input: everything the
     * simulator derives — measurement, keys, quotes — hangs off this value, so
     * "someone shipped different code" is expressed by changing one string.
     */
    readonly imageDigest: string;
    readonly instanceId?: string;
    readonly vendor?: TeeVendor;
    /** Root secret for the simulated attestation authority. Deterministic if fixed. */
    readonly rootSeed?: string;
    readonly clock?: () => string;
    readonly appUrl?: string;
}
/**
 * A dstack guest agent that runs anywhere.
 *
 * The measurement is a SHA-384 chain over the image digest and the same event
 * sequence a real dstack CVM extends into RTMR3 (app id, compose digest,
 * instance id, key provider). Key derivation mixes the measurement in, so the
 * sealing property is structural and not a claim in a comment.
 */
export declare class SimulatedDstackClient implements DstackClient {
    readonly mode: RuntimeMode;
    private readonly options;
    private readonly rootKey;
    private readonly appId;
    private readonly instanceId;
    private readonly clock;
    constructor(options: SimulatedDstackOptions);
    /** The measurement set this image produces. Pure function of the options. */
    measurement(): Measurement;
    info(): Promise<EnclaveInfo>;
    getQuote(reportData: Multihash): Promise<QuoteEnvelope>;
    /**
     * The sealing property, in one line: the seed is a function of the
     * measurement. Ship different code → different MRTD/RTMR3 → different seed →
     * a different signing key, and every record the old key signed now verifies
     * against a key this deployment can no longer produce.
     */
    deriveKey(path: string): Promise<Uint8Array>;
    directory(): KeyDirectory;
}
