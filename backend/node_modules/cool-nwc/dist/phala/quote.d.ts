/**
 * Quotes: building them, hashing them into the record, and checking them.
 *
 * A quote is the only thing in CooL that cannot be verified by pure maths. Every
 * other domain — binding, signature, inclusion — is self-contained: you check it
 * with the bytes in front of you. A quote is a statement by silicon, and
 * believing it means chaining to a vendor root (Intel DCAP, AMD KDS, NVIDIA
 * NRAS). This module keeps that boundary explicit:
 *
 *   • Everything that CAN be checked offline is checked offline, always — the
 *     quote's structure, the measurement pin, and the binding between the quote
 *     and the key that signed the record.
 *   • Chaining to a vendor root is delegated to a pluggable {@link QuoteVerifier}.
 *     No verifier attached → the domain reports what it saw and stops. It never
 *     upgrades itself to `pass` out of optimism.
 *
 * The simulator's root is a CooL-held key. Its quotes are structurally complete
 * and cryptographically real, and they still mean nothing about confidentiality,
 * which is why they are reported as `simulated` for as long as they exist.
 */
import type { DirectoryEntry, KeyDirectory, KeyPair, Multihash, SignatureBlock } from "../types.js";
import type { AttestationRoot, DomainCheckV2, Measurement, QuoteBody, QuoteEnvelope } from "./types.js";
/** Key id under which the simulator's attestation root is published in receipts. */
export declare const SIM_ROOT_KEY_ID = "cool-sim-attestation-root-01";
/** Field-by-field equality. Used for the measurement pin. */
export declare function measurementEquals(a: Measurement, b: Measurement): boolean;
/** A single short digest over a measurement set — for display and comparison. */
export declare function measurementDigest(m: Measurement): Multihash;
/** The first `n` hex characters of a measurement register, for compact display. */
export declare function shortMeasurement(m: Measurement, n?: number): string;
/** Which register(s) differ — so a mismatch says *what* changed, not just "no". */
export declare function measurementDiff(a: Measurement, b: Measurement): string[];
/**
 * The commitment placed in a quote's `report_data`.
 *
 * This is the hinge of the whole design. The hardware attests to a measurement
 * AND to 64 bytes of our choosing; we spend those bytes on the public half of
 * the key the enclave signs with. A verifier recomputes this from the receipt's
 * own `key_directory` and compares. If they match, "attested code" and "signing
 * key" are the same entity — which is precisely what stops a real quote from
 * being stapled onto a record signed somewhere else.
 */
export declare function enclaveReportData(entry: DirectoryEntry): Multihash;
/** The 64 raw bytes to hand a TDX `GetQuote` call, derived from the commitment. */
export declare function reportDataBytes(commitment: Multihash): Uint8Array;
/** The exact bytes a quote signature (or the silicon) covers. */
export declare function quoteSigningMessage(body: QuoteBody): Uint8Array;
/**
 * The digest that goes into the record's signed core (`runtime.tee_quote`).
 * Hashing the whole envelope — signature and raw bytes included — is what makes
 * the record signature cover the quote, so neither can be swapped for the other.
 */
export declare function quoteDigest(quote: QuoteEnvelope): Multihash;
/** Sign a simulated quote body with the simulator's root key. */
export declare function signSimulatedQuote(body: QuoteBody, rootKey: KeyPair): SignatureBlock;
/** The outcome of chaining a quote to its root of trust. */
export interface QuoteVerification {
    readonly ok: boolean;
    readonly root: AttestationRoot;
    readonly tcb_status: string;
    readonly detail: string;
}
/**
 * A root-of-trust checker. Two implementations ship here — the simulator's, and
 * a remote DCAP/NRAS client. A customer running on Phala Cloud can supply their
 * own (Intel Trust Authority, Phala's verifier service, an in-house DCAP setup)
 * without touching anything else in the pipeline.
 */
export interface QuoteVerifier {
    readonly root: AttestationRoot;
    readonly name: string;
    verify(quote: QuoteEnvelope): Promise<QuoteVerification>;
}
/**
 * Verifier for simulator-issued quotes.
 *
 * It performs a genuine hybrid-signature check against the simulator root key
 * carried in the receipt — so a tampered simulated quote is still caught — and
 * then reports `ok: true` with a root of `cool-sim-root`. Callers translate that
 * into the `simulated` status; nothing here ever claims a vendor root.
 */
export declare function simulatedQuoteVerifier(directory: KeyDirectory): QuoteVerifier;
/** Configuration for {@link remoteQuoteVerifier}. */
export interface RemoteVerifierOptions {
    /**
     * Attestation-verification endpoint. Phala's verifier, Intel Trust Authority
     * and a self-hosted DCAP service all accept a raw quote and return a verdict;
     * the exact URL and payload shape is per-service, hence `encode`/`decode`.
     */
    readonly endpoint: string;
    readonly root: AttestationRoot;
    readonly name?: string;
    readonly headers?: Readonly<Record<string, string>>;
    /** Build the request body from the raw quote. Defaults to `{ quote }`. */
    readonly encode?: (rawQuoteBase64: string, quote: QuoteEnvelope) => unknown;
    /** Read the service's verdict. Defaults to `{ ok|verified, tcb_status }`. */
    readonly decode?: (response: unknown) => {
        ok: boolean;
        tcb_status?: string;
        detail?: string;
    };
}
/**
 * Verifier that posts the vendor-native quote bytes to an attestation service.
 *
 * This is the hardware path. It is a network call by construction — DCAP
 * collateral is not something a browser or an air-gapped verifier can synthesise
 * — so it is opt-in, and its absence degrades to "reported, not verified" rather
 * than to a silent pass.
 */
export declare function remoteQuoteVerifier(options: RemoteVerifierOptions): QuoteVerifier;
/** Reject a quote whose shape is wrong before any root is consulted. */
export declare function checkQuoteStructure(quote: QuoteEnvelope): DomainCheckV2 | null;
