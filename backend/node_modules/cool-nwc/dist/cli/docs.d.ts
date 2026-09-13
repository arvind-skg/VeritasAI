/**
 * The manual, as data.
 *
 * `cool help` used to be a list of one-line summaries, which is enough to remind
 * someone who already knows and useless to everyone else. This is the other
 * thing: a synopsis, a description that says *why*, worked examples, and the
 * concepts a reader needs before the commands make sense.
 *
 * Keeping it as data rather than printed strings means the same text serves the
 * terminal, `--json`, and anything that wants to render documentation elsewhere
 * — and it means a command with no examples is visibly missing them.
 */
export interface Example {
    readonly run: string;
    readonly does: string;
}
export interface CommandDoc {
    readonly name: string;
    readonly args: string;
    readonly summary: string;
    /** Prose. Two or three sentences on what it is FOR, not what it does. */
    readonly description: string;
    readonly examples: readonly Example[];
    readonly flags?: readonly {
        flag: string;
        does: string;
    }[];
    readonly seeAlso?: readonly string[];
}
export interface TopicDoc {
    readonly name: string;
    readonly title: string;
    /** Paragraphs. Rendered wrapped, one blank line between. */
    readonly body: readonly string[];
    readonly seeAlso?: readonly string[];
}
export declare const COMMANDS: readonly CommandDoc[];
export declare const TOPICS: readonly TopicDoc[];
export declare const command: (name: string) => CommandDoc | undefined;
export declare const topic: (name: string) => TopicDoc | undefined;
