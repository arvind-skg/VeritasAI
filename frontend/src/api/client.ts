/**
 * VeritasAI API client — typed fetch wrapper for the backend REST API.
 */

const API_BASE = "http://localhost:4000/api/v1";

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 
      "Content-Type": "application/json", 
      "Authorization": "Bearer veritasai-admin",
      ...options.headers 
    },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

// --- Types ---

export interface Agent {
  id: string;
  name: string;
  apiKey: string;
  createdAt: string;
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

export interface EventRecord {
  id: string;
  agentId: string;
  eventType: string;
  status: "recorded" | "recording_failed";
  receiptJson: unknown | null;
  errorDetail: string | null;
  verdictJson: Verdict | null;
  verifiedAt: string | null;
  createdAt: string;
  agent?: Agent;
}

export interface EventsResponse {
  events: EventRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface VerifyResponse {
  eventId: string;
  verdict: Verdict;
  verifiedAt: string;
}

// --- API calls ---

export const api = {
  // Agents
  createAgent: (name: string) =>
    request<Agent>("/agents", {
      method: "POST",
      body: JSON.stringify({ name }),
    }),

  listAgents: () => request<{ agents: Agent[] }>("/agents"),

  // Events
  listEvents: (params?: {
    agentId?: string;
    eventType?: string;
    page?: number;
    limit?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.agentId) searchParams.set("agentId", params.agentId);
    if (params?.eventType) searchParams.set("eventType", params.eventType);
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.limit) searchParams.set("limit", String(params.limit));
    const qs = searchParams.toString();
    return request<EventsResponse>(`/events${qs ? `?${qs}` : ""}`);
  },

  getEvent: (id: string) => request<EventRecord>(`/events/${id}`),

  verifyEvent: (id: string) =>
    request<VerifyResponse>(`/events/${id}/verify`, { method: "POST" }),

  recordEvent: (data: {
    agentId: string;
    eventType: string;
    metadata?: Record<string, unknown>;
    payloads?: Record<string, unknown>;
  }) =>
    request<EventRecord>("/events", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Demo
  seedDemo: () =>
    request<{ message: string; events: EventRecord[] }>("/demo/seed", {
      method: "POST",
    }),

  // Health
  health: () => request<{ status: string }>("/health"),
};
