/** Wrap a paragraph to the terminal width. */
export declare function paragraph(text: string, indent?: string): void;
/** The default `cool help`: what exists, and where to read more. */
export declare function helpIndex(): void;
/** One command, in full. */
export declare function helpCommand(name: string): boolean;
/** One concept, in full. */
export declare function helpTopic(name: string): boolean;
/**
 * `cool help [thing]`.
 *
 * Commands and concepts share one namespace on purpose: somebody typing
 * `cool help attestation` does not care which of the two it is, and being told
 * "no such command" when a perfectly good explanation exists is a small,
 * avoidable insult.
 */
export declare function help(args: string[]): number;
