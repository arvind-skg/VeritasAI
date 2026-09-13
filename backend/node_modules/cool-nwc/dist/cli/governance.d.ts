import type { PolicySet } from "../phala/index.js";
import { type Workspace } from "./workspace.js";
/** The rule set in force. One place, so the CLI cannot print a different one. */
export declare const ACTIVE_POLICY: PolicySet;
export declare function policyCommand(args: string[]): number;
export declare function complianceCommand(workspace: Workspace | null, args: string[]): number;
export declare function packCommand(workspace: Workspace | null, args: string[]): Promise<number>;
