export type ActionStageType = "INPUT" | "CONTEXT" | "POLICY_CHECK" | "AI_REASONING" | "RISK_ASSESSMENT" | "TOOL_CALL" | "HUMAN_APPROVAL" | "FINAL_ACTION" | "OUTCOME";
export interface ActionStage {
    stage: ActionStageType;
    title: string;
    payload: Record<string, unknown>;
    stageHash: string;
    prevStageHash: string | null;
    timestamp: string;
    status: "COMPLETED" | "FLAGGED" | "OVERRIDDEN";
}
export declare function computeStageHash(prevHash: string | null, stage: ActionStageType, payload: Record<string, unknown>, timestamp: string): string;
export declare function buildActionChain(stages: Array<{
    stage: ActionStageType;
    title?: string;
    payload: Record<string, unknown>;
    status?: "COMPLETED" | "FLAGGED" | "OVERRIDDEN";
    timestamp?: string;
}>): ActionStage[];
export declare function verifyActionChain(chain: ActionStage[]): {
    valid: boolean;
    brokenStage?: number;
    error?: string;
};
/**
 * Automatically synthesizes a 9-stage action chain from standard decision inputs.
 * Ensures every VeritasAI event has a complete cryptographically linked lifecycle.
 */
export declare function synthesizeDefaultActionChain(params: {
    inputData?: unknown;
    outputData?: unknown;
    decision?: string | null;
    riskLevel?: string;
    policy?: {
        name?: string;
        version?: string;
        hash?: string;
    };
    humanApproval?: {
        reviewer?: string;
        decision?: string;
        modified?: boolean;
    };
    toolCalls?: Array<{
        tool: string;
        params?: unknown;
        outcome?: string;
    }>;
    model?: {
        name?: string;
        version?: string;
    };
    createdAt?: string;
}): ActionStage[];
