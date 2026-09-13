import type { ChangeKind } from "../../phala/types.js";
export declare function shouldWatch(relPath: string): boolean;
/**
 * What kind of change a path represents.
 *
 * Inference from the path, not from the diff. It is deliberately conservative:
 * `prompt` is the fallback for prose because that is the kind whose production
 * rules require two approvers, and guessing *down* into a laxer kind would
 * quietly route a real change past the rule that should have caught it.
 */
export declare function kindFor(relPath: string): ChangeKind;
/**
 * A stable reference for the thing that changed.
 *
 * The ref is what ties every record about one artefact together over time, so
 * it must not move when the working directory does. Path relative to the
 * project root, POSIX separators, with the extension dropped — `agents/fraud/
 * system.prompt` becomes `agents/fraud/system#prompt`.
 */
export declare function refFor(relPath: string): string;
export interface FileChange {
    /** Path relative to the project root, with the platform's separators. */
    readonly path: string;
    readonly ref: string;
    readonly kind: ChangeKind;
    readonly before: string | null;
    readonly after: string;
    readonly at: number;
}
export interface WatchOptions {
    readonly root: string;
    /** Previous contents by relative path — seeded from git where possible. */
    readonly baseline: Map<string, string>;
    readonly onChange: (change: FileChange) => void;
    /** Quiet period after the last event before a file is read. */
    readonly debounceMs?: number;
    readonly onError?: (message: string) => void;
}
export interface Watcher {
    close(): void;
}
export declare function watchProject(options: WatchOptions): Watcher;
/** Relative path helper that keeps the platform's separators. */
export declare function relativeTo(root: string, absolute: string): string;
