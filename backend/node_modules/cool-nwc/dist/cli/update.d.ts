/** Compare two semver-ish versions. Pre-release suffixes sort before release. */
export declare function isNewer(candidate: string, current: string): boolean;
/**
 * The newest published version, or null if we should not or could not ask.
 *
 * Never throws. Never blocks for more than a second.
 */
export declare function latestVersion(root?: string): Promise<string | null>;
/** A one-line nudge, or nothing at all. */
export declare function updateNotice(current: string, root?: string): Promise<string | null>;
