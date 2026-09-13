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

export class VeritasClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl: string = "http://localhost:3000") {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  public async record(params: {
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
  }) {
    const payload = {
      agentId: params.agentId,
      eventType: params.action,
      decision: params.decision,
      riskLevel: params.risk || "LOW",
      payloads: params.inputData,
      metadata: params.outputData || {},
      policyProof: params.policy,
      modelProvenance: params.model,
      humanApproval: params.humanApproval,
      toolCalls: params.toolCalls || [],
      parentEventId: params.parentEventId,
    };

    const res = await fetch(`${this.baseUrl}/api/v1/events`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        "User-Agent": "VeritasAI-Node-SDK/2.0",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`VeritasAI record failed with status ${res.status}: ${await res.text()}`);
    }

    return res.json();
  }
}
