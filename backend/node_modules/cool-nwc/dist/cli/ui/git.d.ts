export interface GitContext {
    /** Absolute path of the repository root, or null when not a repo. */
    readonly root: string | null;
    readonly branch: string | null;
    /** Short hash of HEAD. Null in a repository with no commits yet. */
    readonly commit: string | null;
    readonly commitSubject: string | null;
    /** `Name <email>` of the configured user — who is making this change now. */
    readonly author: string | null;
    readonly authorEmail: string | null;
    readonly remote: string | null;
    /** True when the working tree has uncommitted changes. */
    readonly dirty: boolean;
}
/** Read everything worth recording about the repository at `cwd`. */
export declare function gitContext(cwd: string): GitContext;
/**
 * The previous committed contents of a file.
 *
 * This is what makes the `before` side of a change real rather than remembered.
 * When the file is tracked, the baseline is what git has, so restarting `cool
 * ui` does not reset history or invent an empty previous value. Untracked files
 * return null and are recorded as first writes, which is what they are.
 */
export declare function committedContents(cwd: string, relativePath: string): string | null;
/** Files git is tracking, relative to the repository root. */
export declare function trackedFiles(cwd: string): string[];
/**
 * The actor for a change made right now.
 *
 * `session` rather than `oidc`: a person saving a file in an editor is exactly
 * the case the policy set treats as needing human approval, and claiming a CI
 * identity here would route the change down the wrong rule.
 */
export declare function actorFrom(context: GitContext): {
    id: string;
    method: string;
};
/** Labels the policy engine can match on, and an auditor can read. */
export declare function labelsFrom(context: GitContext, repoName: string): string[];
