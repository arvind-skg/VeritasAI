/**
 * VeritasAI TypeScript / Node.js SDK
 *
 * Provides a 5-minute integration client and decorator for TypeScript applications.
 */
export interface AuditOptions {
    action: string;
    risk?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    agentId?: string;
    policyName?: string;
    modelVersion?: string;
}
export declare class VeritasClient {
    private apiKey;
    private baseUrl;
    constructor(apiKey: string, baseUrl?: string);
    record(params: {
        agentId: string;
        action: string;
        decision: string;
        inputData: Record<string, unknown>;
        outputData?: Record<string, unknown>;
        risk?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
        policy?: Record<string, unknown>;
        model?: Record<string, unknown>;
        humanApproval?: Record<string, unknown>;
        toolCalls?: Array<Record<string, unknown>>;
        parentEventId?: string;
    }): Promise<any>;
}
