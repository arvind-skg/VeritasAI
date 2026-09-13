/**
 * VeritasAI API Client — Typed Fetch Wrapper for SaaS Platform
 */

const rawUrl = (import.meta.env.VITE_API_URL || "http://localhost:4000").replace(/\/+$/, "");
const API_BASE = rawUrl.endsWith("/api/v1") ? rawUrl : `${rawUrl}/api/v1`;

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
}

export interface CredentialInfo {
  id: string;
  agentId: string;
  name: string;
  keyPrefix: string;
  lastFour: string;
  status: "ACTIVE" | "REVOKED";
  lastUsedAt: string | null;
  createdAt: string;
  revokedAt: string | null;
}

export interface Agent {
  id: string;
  orgId: string | null;
  name: string;
  description: string | null;
  type: string;
  environment: "PRODUCTION" | "STAGING" | "TEST";
  status: "ACTIVE" | "DISABLED" | "REVOKED";
  apiKey: string | null;
  createdAt: string;
  updatedAt: string;
  credentials?: CredentialInfo[];
  eventsCount?: number;
}

export interface DomainCheck {
  status: "pass" | "fail" | "simulated" | "absent";
  detail: string;
}

export interface VerdictChecks {
  binding: DomainCheck;
  signature: DomainCheck;
  inclusion: DomainCheck;
  witnesses: DomainCheck;
  attestation: DomainCheck;
  enclave: DomainCheck;
  anchor: DomainCheck;
}

export interface Verdict {
  ok: boolean;
  schema: string;
  subject: {
    kind: string;
    subject: string;
    issued_at: string;
    record_id: string;
    key_id: string;
    tee: string;
  } | null;
  checks: VerdictChecks;
  reasons: string[];
}

export interface ActionStage {
  stage: string;
  title: string;
  payload: Record<string, any>;
  stageHash: string;
  prevStageHash: string | null;
  timestamp: string;
  status: "COMPLETED" | "FLAGGED" | "OVERRIDDEN";
}

export interface EventRecord {
  id: string;
  orgId: string | null;
  agentId: string;
  eventType: string;
  decision: string | null;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  inputJson: Record<string, any> | null;
  outputJson: Record<string, any> | null;
  metadataJson: Record<string, any> | null;
  requestId: string | null;
  status: "recorded" | "recording_failed";
  receiptJson: unknown | null;
  errorDetail: string | null;
  verdictJson: Verdict | null;
  verifiedAt: string | null;
  createdAt: string;

  // New Enterprise Differentiators
  parentEventId?: string | null;
  actionChain?: ActionStage[] | null;
  policyProof?: Record<string, any> | null;
  humanApproval?: Record<string, any> | null;
  modelProvenance?: Record<string, any> | null;
  toolCalls?: Array<Record<string, any>> | null;
  selectiveCommitments?: Record<string, any> | null;
  externalTimestamp?: Record<string, any> | null;
  logIndex?: number | null;
  treeHeadHash?: string | null;

  agent?: {
    id: string;
    name: string;
    type: string;
    environment: string;
  };
}

export interface EventsResponse {
  events: EventRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface OrgStats {
  totalAgents: number;
  activeAgents: number;
  totalEvents: number;
  verifiedEvents: number;
  failedEvents: number;
  highRiskEvents: number;
  verificationPassRate: number;
}

export interface AuditLogItem {
  id: string;
  action: string;
  resourceType: string;
  resourceId: string | null;
  createdAt: string;
  details: Record<string, any> | null;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("vai_token") || "veritasai-admin";
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string>),
  };

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Auth
  register: (data: { orgName: string; email: string; password: string; name?: string }) =>
    request<{
      token: string;
      user: User;
      organization: Organization;
      starterAgent: { id: string; name: string; apiKey: string };
    }>("/auth/register", { method: "POST", body: JSON.stringify(data) }),

  login: (data: { email: string; password: string }) =>
    request<{
      token: string;
      user: User;
      organization: Organization;
    }>("/auth/login", { method: "POST", body: JSON.stringify(data) }),

  me: () => request<{ user: User; organization: Organization }>("/auth/me"),
  getOrgStats: () => request<{ stats: OrgStats }>("/auth/stats"),

  // Agents
  listAgents: () => request<{ agents: Agent[] }>("/agents"),
  createAgent: (data: { name: string; description?: string; type?: string; environment?: string }) =>
    request<{ agent: Agent; credential: { rawKey: string }; apiKey: string }>("/agents", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getAgent: (id: string) =>
    request<{ agent: Agent; stats: { total: number; verified: number; failed: number; highRisk: number; verificationRate: number } }>(
      `/agents/${id}`
    ),
  updateAgent: (id: string, data: Partial<Agent>) =>
    request<{ agent: Agent }>(`/agents/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  // Credentials
  listCredentials: (agentId: string) =>
    request<{ credentials: CredentialInfo[] }>(`/agents/${agentId}/credentials`),
  createCredential: (agentId: string, name?: string, environment?: string) =>
    request<{ credential: CredentialInfo; apiKey: string }>(`/agents/${agentId}/credentials`, {
      method: "POST",
      body: JSON.stringify({ name, environment }),
    }),
  rotateCredential: (agentId: string, credId: string, name?: string) =>
    request<{ message: string; credential: CredentialInfo; apiKey: string }>(
      `/agents/${agentId}/credentials/${credId}/rotate`,
      { method: "POST", body: JSON.stringify({ name }) }
    ),
  revokeCredential: (agentId: string, credId: string) =>
    request<{ message: string }>(`/agents/${agentId}/credentials/${credId}`, {
      method: "DELETE",
    }),

  // Events & Decisions
  listEvents: (params?: {
    agentId?: string;
    eventType?: string;
    status?: string;
    riskLevel?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.agentId) searchParams.set("agentId", params.agentId);
    if (params?.eventType) searchParams.set("eventType", params.eventType);
    if (params?.status) searchParams.set("status", params.status);
    if (params?.riskLevel) searchParams.set("riskLevel", params.riskLevel);
    if (params?.search) searchParams.set("search", params.search);
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.limit) searchParams.set("limit", String(params.limit));
    const qs = searchParams.toString();
    return request<EventsResponse>(`/events${qs ? `?${qs}` : ""}`);
  },

  getEvent: (id: string) => request<EventRecord>(`/events/${id}`),
  verifyEvent: (id: string) =>
    request<{ eventId: string; verdict: Verdict; verifiedAt: string }>(`/events/${id}/verify`, {
      method: "POST",
    }),
  getCausalChain: (id: string) =>
    request<{ causalChainLength: number; events: EventRecord[] }>(`/events/${id}/causal-chain`),
  generateSelectiveDisclosure: (id: string, selectedFields: string[]) =>
    request<{ eventId: string; proof: any }>(`/events/${id}/selective-disclosure`, {
      method: "POST",
      body: JSON.stringify({ selectedFields }),
    }),
  verifySelectiveProof: (proof: any) =>
    request<{ valid: boolean; verifiedFields: string[]; error?: string }>(`/events/verify-selective-proof`, {
      method: "POST",
      body: JSON.stringify({ proof }),
    }),

  // Attack Playground
  getPlaygroundScenarios: () => request<{ scenarios: any[] }>("/playground/scenarios"),
  executeAttack: (attackType: string, eventId?: string) =>
    request<any>("/playground/attack", {
      method: "POST",
      body: JSON.stringify({ attackType, eventId }),
    }),

  // Compliance Packs
  getComplianceFrameworks: () => request<{ frameworks: any }>("/compliance/frameworks"),
  generateCompliancePack: (framework: string) =>
    request<any>("/compliance/generate", {
      method: "POST",
      body: JSON.stringify({ framework }),
    }),

  // Audit
  listAuditLogs: (params?: { action?: string; resourceType?: string; search?: string; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.action) searchParams.set("action", params.action);
    if (params?.resourceType) searchParams.set("resourceType", params.resourceType);
    if (params?.search) searchParams.set("search", params.search);
    if (params?.limit) searchParams.set("limit", String(params.limit));
    const qs = searchParams.toString();
    return request<{ logs: AuditLogItem[]; total?: number }>(`/audit${qs ? `?${qs}` : ""}`);
  },

  // Demo
  seedDemo: () => request<{ message: string; events: any[] }>("/demo/seed", { method: "POST" }),
  health: () => request<{ status: string }>("/health"),
};
