/**
 * A minimal line diff.
 *
 * Change records commit to `diff_hash`, so something has to produce a canonical
 * diff text. This is a common-prefix/suffix diff rather than Myers: it is exact
 * for the edits CooL actually sees (a prompt paragraph rewritten, a temperature
 * changed, a tool added to an allow-list), it is deterministic, and it is thirty
 * lines instead of a dependency. The diff never leaves the customer's
 * environment — only its hash is committed — so its job is to be reproducible,
 * not to be beautiful.
 */
export interface DiffLine {
    readonly kind: "context" | "added" | "removed";
    readonly text: string;
}
/** Diff two texts by line. Deterministic for a given pair of inputs. */
export declare function lineDiff(before: string, after: string): DiffLine[];
/** Render a diff in unified form — the exact string that gets committed. */
export declare function unifiedDiff(before: string, after: string): string;
/** Count of added/removed lines, for the console's change list. */
export declare function diffStat(before: string, after: string): {
    added: number;
    removed: number;
};
