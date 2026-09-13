import type { Multihash } from "../types.js";
import type { ChangeApproval, ChangeKind } from "./types.js";
/** What a rule can decide. `escalate` means "a human must look". */
export type Decision = "auto-approved" | "approved" | "rejected" | "escalate";
/** The facts a rule is evaluated against. */
export interface PolicyInput {
    readonly kind: ChangeKind;
    readonly ref: string;
    readonly environment: string;
    readonly actor: {
        readonly id: string;
        readonly method: string;
    };
    readonly approvers: readonly string[];
    /** Optional risk signals the caller can supply — e.g. from a scoring model. */
    readonly risk?: number;
    /** Free-form labels: `owner:payments`, `tier:high`, `pii:true`. */
    readonly labels?: readonly string[];
}
/** A condition. Every field present must hold. */
export interface PolicyMatch {
    readonly kinds?: readonly ChangeKind[];
    readonly environments?: readonly string[];
    /** Substring or `re:<pattern>` against the change ref. */
    readonly ref?: string;
    /** Minimum number of approvers for the rule to apply. */
    readonly minApprovers?: number;
    /**
     * Maximum number of approvers. The pair lets a rule set say "approved with
     * two, escalate with fewer" without the escalate rule also firing on the
     * approved case — which, under strictest-wins, would make approval
     * unreachable.
     */
    readonly maxApprovers?: number;
    /** Applies only when the caller's risk signal is at or above this. */
    readonly minRisk?: number;
    readonly labels?: readonly string[];
    /** Actor method, e.g. `oidc` for CI, `session` for a human. */
    readonly actorMethods?: readonly string[];
}
export interface PolicyRule {
    /** Stable identifier recorded in the receipt, e.g. `POL-002`. */
    readonly id: string;
    readonly title: string;
    readonly when: PolicyMatch;
    readonly decision: Decision;
    /** Regulatory obligations this rule exists to satisfy. */
    readonly obligations?: readonly string[];
    /** Why the rule exists — printed by `cool policy` and shown in the console. */
    readonly because?: string;
}
export interface PolicySet {
    readonly id: string;
    readonly rules: readonly PolicyRule[];
    /** Decision when nothing matches. Default `escalate` — silence is not consent. */
    readonly fallback?: Decision;
}
/** The outcome, which is what gets sealed. */
export interface PolicyOutcome {
    readonly decision: Decision;
    readonly rule: string | null;
    readonly title: string | null;
    readonly obligations: readonly string[];
    /** Commitment to the exact rule set used. Rules change; records should not. */
    readonly policy_hash: Multihash;
    /** Every rule that matched, worst decision first — the audit trail of the decision. */
    readonly considered: readonly {
        id: string;
        decision: Decision;
    }[];
}
/** Deterministic commitment to a rule set, so a record names the rules it met. */
export declare function policyHash(policy: PolicySet): Multihash;
/**
 * Evaluate a change against a policy set.
 *
 * Strictest-wins rather than first-match: a permissive rule written later can
 * never quietly override a restrictive one, which is the failure mode that makes
 * hand-ordered rule lists dangerous.
 */
export declare function evaluate(policy: PolicySet, input: PolicyInput): PolicyOutcome;
/**
 * Fold an outcome into the approval block a record carries.
 *
 * `escalate` is recorded as `rejected` in the receipt schema — the record only
 * knows "this did not have authority to proceed"; the difference between "needs
 * a human" and "forbidden" is an operational one, kept in the outcome.
 */
export declare function approvalFrom(outcome: PolicyOutcome, approvers: readonly string[]): ChangeApproval;
/**
 * A defensible starting set.
 *
 * Written to be read by a compliance officer rather than a programmer, and
 * chosen so the defaults fail safe: production prompt and model changes need two
 * humans, widening what an agent may do is never automatic, and anything not
 * covered escalates instead of sliding through.
 */
export declare const DEFAULT_POLICY: PolicySet;
