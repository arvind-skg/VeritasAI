/**
 * Terminal drawing, with no dependencies.
 *
 * A CLI that ships `chalk`, `ora`, `boxen` and `cli-table` pulls twenty-odd
 * transitive packages into a security product's dependency tree in order to draw
 * boxes. This is the same output in one file: colour, panels, spinners, bars and
 * sparklines, degrading cleanly when the terminal cannot do them.
 *
 * Three environments are handled explicitly rather than assumed:
 *   • no TTY (a pipe, CI, `> file`) → no colour, no spinner, no cursor tricks;
 *   • `NO_COLOR` or `TERM=dumb` → the same;
 *   • legacy Windows consoles → ASCII glyphs instead of box-drawing and braille.
 */
export declare const isTTY: boolean;
export declare const useColor: boolean;
/**
 * Whether the terminal can be trusted with box-drawing and braille. Windows
 * Terminal, VS Code's terminal and every modern *nix terminal can; the legacy
 * conhost that `cmd.exe` still opens by default cannot.
 */
export declare const useUnicode: boolean;
export declare const c: {
    bold: (t: string) => string;
    dim: (t: string) => string;
    inverse: (t: string) => string;
    brand: (text: string) => string;
    blue: (text: string) => string;
    green: (text: string) => string;
    red: (text: string) => string;
    yellow: (text: string) => string;
    cyan: (text: string) => string;
    purple: (text: string) => string;
    grey: (text: string) => string;
    faint: (text: string) => string;
};
/** Glyphs, with an ASCII fallback for terminals that would render tofu. */
export declare const g: {
    tl: string;
    tr: string;
    bl: string;
    br: string;
    h: string;
    v: string;
    pass: string;
    fail: string;
    warn: string;
    partial: string;
    dot: string;
    arrow: string;
    bullet: string;
    block: string;
    light: string;
    spark: string[];
    spinner: string[];
};
/** Printable width, ignoring escape sequences. */
export declare function width(text: string): number;
export declare function pad(text: string, to: number): string;
export declare function padStart(text: string, to: number): string;
export declare function truncate(text: string, to: number): string;
/** Usable columns, clamped so a maximised 4K terminal does not produce a mural. */
export declare function columns(): number;
export declare const out: (line?: string) => void;
export declare function rule(label?: string): void;
/** A titled panel — the one piece of chrome the whole CLI is built from. */
export declare function panel(title: string, lines: string[], tone?: (t: string) => string): void;
/** A two-column key/value list, aligned on the widest key. */
export declare function fields(rows: [string, string][], indent?: string): void;
/** A horizontal bar, for the analytics panel. */
export declare function bar(value: number, max: number, cells?: number): string;
/** A sparkline over a series. */
export declare function sparkline(values: number[]): string;
/** Status glyph + colour + word — never colour alone. */
export declare function status(kind: string): string;
/**
 * A spinner that knows when not to be one.
 *
 * On a pipe it prints each step as a plain line, so `cool seal | tee log` and CI
 * output stay readable instead of filling with cursor escapes.
 */
export declare class Progress {
    private timer;
    private frame;
    private text;
    private started;
    start(text: string): this;
    update(text: string): this;
    private render;
    private stop;
    succeed(text?: string): void;
    fail(text?: string): void;
}
/** Clear the screen, when there is a screen to clear. */
export declare function clear(): void;
