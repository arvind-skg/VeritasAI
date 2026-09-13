/**
 * A dependency-free, monotonic ULID.
 *
 * The v1 core uses the `ulid` package. The v2 tier cannot: that package detects
 * its randomness source by looking for `window`, and falls back to
 * `require("crypto")` when it does not find one — which breaks the moment the
 * library is bundled for a browser and then run anywhere that is not a browser
 * (Deno, a Worker, Node, a test runner). An id generator failing at runtime
 * would take the whole capture path down, so this replaces it with thirty lines
 * that read from the same CSPRNG as every other random value in the SDK.
 *
 * Two properties matter here beyond "unique":
 *
 *   • lexicographic order == time order, because record ids are sorted, paged
 *     and compared in a ledger;
 *   • monotonicity inside a millisecond. Records are sealed in tight loops, and
 *     a plain random suffix would let two records from the same millisecond sort
 *     in an order that contradicts their sequence numbers.
 */
/** Build a monotonic ULID factory. Inject `now` for deterministic tests. */
export declare function createUlid(now?: () => number): () => string;
/** The default factory — one monotonic sequence per process. */
export declare const ulid: () => string;
