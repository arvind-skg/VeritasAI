/** What `HttpDstackClient` needs from a transport — a subset of `fetch`. */
export type FetchLike = (input: string | URL, init?: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
}) => Promise<{
    ok: boolean;
    status: number;
    json: () => Promise<unknown>;
    text: () => Promise<string>;
}>;
/** True when an endpoint is a unix socket or a Windows named pipe, not a URL. */
export declare function isSocketPath(endpoint: string): boolean;
/**
 * A `fetch` that goes over a socket.
 *
 * The URL's host is ignored — it only exists because HTTP requires one. The path
 * is what matters, and the socket is what carries it.
 */
export declare function unixFetch(socketPath: string): FetchLike;
/**
 * Pick a transport for an endpoint.
 *
 * Returns `null` for ordinary URLs so the caller keeps using the platform
 * `fetch` — there is no reason to route TCP through this.
 */
export declare function transportFor(endpoint: string): FetchLike | null;
