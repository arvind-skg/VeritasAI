/**
 * VeritasAI Multi-Tenant Database Service
 *
 * Implements strict tenant isolation, agent credential management,
 * decision/event persistence, analytics, and audit logging.
 */
import { PrismaClient } from "@prisma/client";
import { type ActionStage, type SelectiveCommitmentPackage, type ExternalTimestampToken } from "./cryptography/index.js";
declare const prisma: PrismaClient<import(".prisma/client").Prisma.PrismaClientOptions, never, import("@prisma/client/runtime/library").DefaultArgs>;
export interface OrganizationRecord {
    id: string;
    name: string;
    slug: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface UserRecord {
    id: string;
    orgId: string;
    email: string;
    passwordHash: string;
    name: string;
    role: string;
    createdAt: Date;
}
export interface AgentRecord {
    id: string;
    orgId: string | null;
    name: string;
    description: string | null;
    type: string;
    environment: string;
    status: string;
    apiKey: string | null;
    createdAt: Date;
    updatedAt: Date;
    credentials?: CredentialRecord[];
    eventsCount?: number;
}
export interface CredentialRecord {
    id: string;
    agentId: string;
    name: string;
    keyPrefix: string;
    lastFour: string;
    status: string;
    lastUsedAt: Date | null;
    createdAt: Date;
    revokedAt: Date | null;
}
export interface EventRecord {
    id: string;
    orgId: string | null;
    agentId: string;
    eventType: string;
    decision: string | null;
    riskLevel: string;
    inputJson: unknown | null;
    outputJson: unknown | null;
    metadataJson: unknown | null;
    requestId: string | null;
    status: "recorded" | "recording_failed";
    receiptJson: unknown | null;
    errorDetail: string | null;
    verdictJson: unknown | null;
    verifiedAt: Date | null;
    createdAt: Date;
    parentEventId?: string | null;
    actionChain?: ActionStage[] | null;
    policyProof?: Record<string, unknown> | null;
    humanApproval?: Record<string, unknown> | null;
    modelProvenance?: Record<string, unknown> | null;
    toolCalls?: Array<Record<string, unknown>> | null;
    selectiveCommitments?: SelectiveCommitmentPackage | null;
    externalTimestamp?: ExternalTimestampToken | null;
    logIndex?: number | null;
    treeHeadHash?: string | null;
    agent?: {
        id: string;
        name: string;
        type: string;
        environment: string;
    };
}
export declare function ensureDefaultOrganization(): Promise<OrganizationRecord>;
export declare function createOrganization(name: string, slug?: string): Promise<OrganizationRecord>;
export declare function getOrganization(id: string): Promise<OrganizationRecord | null>;
export declare function createUser(orgId: string, email: string, passwordHash: string, name: string, role?: string): Promise<UserRecord>;
export declare function getUserByEmail(email: string): Promise<(UserRecord & {
    organization: OrganizationRecord;
}) | null>;
export declare function getUserById(id: string): Promise<(UserRecord & {
    organization: OrganizationRecord;
}) | null>;
export declare function createAgent(orgId: string, data: {
    name: string;
    description?: string;
    type?: string;
    environment?: "PRODUCTION" | "STAGING" | "TEST";
}): Promise<{
    agent: AgentRecord;
    credential: {
        id: string;
        rawKey: string;
        keyPrefix: string;
        lastFour: string;
    };
}>;
export declare function listAgents(orgId: string): Promise<AgentRecord[]>;
export declare function getAgentByApiKey(apiKey: string): Promise<AgentRecord | null>;
export declare function getAgent(id: string, orgId?: string): Promise<AgentRecord | null>;
export declare function updateAgent(id: string, orgId: string, data: Partial<{
    name: string;
    description: string;
    type: string;
    environment: string;
    status: string;
}>): Promise<AgentRecord | null>;
export declare function getAgentStats(agentId: string, orgId: string): Promise<{
    total: number;
    verified: number;
    failed: number;
    highRisk: number;
    verificationRate: number;
}>;
export declare function createCredential(agentId: string, orgId: string, name?: string, environment?: "PRODUCTION" | "TEST"): Promise<{
    id: string;
    rawKey: string;
    keyPrefix: string;
    lastFour: string;
}>;
export declare function listCredentials(agentId: string, orgId: string): Promise<CredentialRecord[]>;
export declare function rotateCredential(agentId: string, credId: string, orgId: string, name?: string): Promise<{
    id: string;
    rawKey: string;
    keyPrefix: string;
    lastFour: string;
}>;
export declare function revokeCredential(agentId: string, credId: string, orgId: string): Promise<boolean>;
export declare function findActiveCredentialByKey(rawKey: string): Promise<{
    credentialId: string;
    credentialStatus: string;
    agent: {
        organization: {
            name: string;
            id: string;
            slug: string;
            createdAt: Date;
            updatedAt: Date;
        } | null;
    } & {
        name: string;
        status: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        orgId: string | null;
        description: string | null;
        type: string;
        environment: string;
        apiKey: string | null;
        baselineModel: string | null;
        baselinePromptHash: string | null;
    };
    orgId: string | null;
} | null>;
export declare function touchCredentialLastUsed(credentialId: string): Promise<void>;
export declare function saveDecision(params: {
    orgId?: string | null;
    agentId: string;
    eventType: string;
    decision?: string | null;
    riskLevel?: string;
    inputData?: unknown;
    outputData?: unknown;
    metadata?: Record<string, unknown>;
    requestId?: string;
    receipt: unknown | null;
    status: "recorded" | "recording_failed";
    errorDetail?: string | null;
    parentEventId?: string | null;
    actionChain?: ActionStage[] | null;
    policyProof?: Record<string, unknown> | null;
    humanApproval?: Record<string, unknown> | null;
    modelProvenance?: Record<string, unknown> | null;
    toolCalls?: Array<Record<string, unknown>> | null;
    selectiveCommitments?: SelectiveCommitmentPackage | null;
    externalTimestamp?: ExternalTimestampToken | null;
}): Promise<EventRecord>;
export declare function getEventCausalChain(eventId: string, orgId?: string): Promise<EventRecord[]>;
/**
 * Backward-compatible saveReceipt method.
 */
export declare function saveReceipt(agentId: string, eventType: string, receipt: unknown | null, status: "recorded" | "recording_failed", errorDetail?: string, orgId?: string | null): Promise<EventRecord>;
export declare function getEvent(id: string, orgId?: string): Promise<EventRecord | null>;
export declare function listEvents(filters?: {
    orgId?: string;
    agentId?: string;
    eventType?: string;
    status?: string;
    riskLevel?: string;
    search?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
}): Promise<{
    events: EventRecord[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}>;
export declare function updateEventVerdict(id: string, verdictJson: unknown): Promise<EventRecord | null>;
export declare function getOrganizationStats(orgId: string): Promise<{
    totalAgents: number;
    activeAgents: number;
    totalEvents: number;
    verifiedEvents: number;
    failedEvents: number;
    highRiskEvents: number;
    verificationPassRate: number;
}>;
export declare function createAuditLog(orgId: string, action: string, resourceType: string, resourceId?: string, userId?: string, details?: Record<string, unknown>): Promise<{
    id: string;
    createdAt: Date;
    orgId: string;
    action: string;
    resourceType: string;
    resourceId: string | null;
    detailsJson: string | null;
    userId: string | null;
}>;
export declare function listAuditLogs(orgId: string, limit?: number, action?: string, resourceType?: string, search?: string): Promise<{
    details: any;
    user: {
        name: string;
        id: string;
        email: string;
    } | null;
    id: string;
    createdAt: Date;
    orgId: string;
    action: string;
    resourceType: string;
    resourceId: string | null;
    detailsJson: string | null;
    userId: string | null;
}[]>;
export { prisma };
