import type { ReceiptV2 } from "../phala/index.js";
import { type Workspace } from "./workspace.js";
/** `cool records` — the question "what happened here" as a table. */
export declare function records(workspace: Workspace | null, args: string[]): number;
/**
 * `cool disclose` — open one committed field, or check one you were given.
 *
 * The check path takes only a disclosure file and finds its receipt by id, so
 * the person verifying does not need to be told which file to pair it with.
 */
export declare function discloseCommand(workspace: Workspace | null, args: string[]): number;
/**
 * `cool witness` — make the witnesses domain mean something.
 *
 * The key is generated from a name so the same witness identity is reproducible
 * across runs; in a real deployment the witness is a different organisation
 * holding its own key, which is the entire point of the exercise.
 */
export declare function witnessCommand(workspace: Workspace | null, args: string[]): number;
/** `cool log` — the tree itself: size, root, checkpoint, consistency. */
export declare function logCommand(workspace: Workspace, args: string[]): Promise<number>;
/** Receipts as plain data, for anything that wants to pipe them. */
export declare function receiptsOf(workspace: Workspace | null): ReceiptV2[];
