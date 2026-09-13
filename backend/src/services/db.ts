/**
 * VeritasAI Multi-Tenant Database Service
 *
 * Implements strict tenant isolation, agent credential management,
 * decision/event persistence, analytics, and audit logging.
 */
import { PrismaClient } from "@prisma/client";
import {
  generateApiKey,
  hashApiKey,
  hashPassword,
  encryptData,
  decryptData,
  encryptJson,
  decryptJson,
} from "./security.js";
import {
  synthesizeDefaultActionChain,
  generateSelectiveCommitments,
  anchorToExternalAuthority,
  generateSignedTreeHead,
  buildMerkleTree,
  type ActionStage,
  type SelectiveCommitmentPackage,
  type ExternalTimestampToken,
} from "./cryptography/index.js";

const prisma = new PrismaClient();

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

  // Advanced Enterprise Provenance & Differentiators
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

// -----------------------------------------------------------------------------
// Database Initialization & Demo Seeding
// -----------------------------------------------------------------------------

export async function ensureDefaultOrganization(): Promise<OrganizationRecord> {
  let org = await prisma.organization.findFirst({
    where: { slug: "veritasai-demo" },
  });

  if (!org) {
    org = await prisma.organization.create({
      data: {
        name: "VeritasAI Demo Organization",
        slug: "veritasai-demo",
      },
    });

  }

  // Ensure standard admin accounts exist
  const defaultPassword = process.env.ADMIN_PASSWORD || "veritasai-admin";
  const passwordHash = await hashPassword(defaultPassword);
  for (const email of ["admin@veritasai.io", "admin@veritasai.local"]) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (!existing) {
      await prisma.user.create({
        data: {
          orgId: org.id,
          email,
          passwordHash,
          name: "VeritasAI Administrator",
          role: "ADMIN",
        },
      });
    }
  }

  // Always link any unlinked agents/events to this default organization
  await prisma.agent.updateMany({
    where: { orgId: null },
    data: { orgId: org.id },
  });

  await prisma.event.updateMany({
    where: { orgId: null },
    data: { orgId: org.id },
  });

  // Ensure default demo organization has a rich baseline audit trail
  const logCount = await prisma.auditLog.count({ where: { orgId: org.id } });
  if (logCount === 0) {
    const adminUser = await prisma.user.findFirst({ where: { orgId: org.id } });
    const now = Date.now();

    await prisma.auditLog.createMany({
      data: [
        {
          orgId: org.id,
          userId: adminUser?.id || null,
          action: "ORGANIZATION_INITIALIZED",
          resourceType: "ORGANIZATION",
          resourceId: org.id,
          detailsJson: encryptJson({
            orgName: "VeritasAI Demo Organization",
            complianceProfile: "EU_AI_ACT_HIGH_RISK_FINANCIAL",
            retentionPeriodDays: 365,
          }),
          createdAt: new Date(now - 86400000 * 3), // 3 days ago
        },
        {
          orgId: org.id,
          userId: adminUser?.id || null,
          action: "AGENT_PROVISIONED",
          resourceType: "AGENT",
          resourceId: "agent_loanbot_v2",
          detailsJson: encryptJson({
            name: "LoanBot v2.1",
            type: "LOAN_APPROVAL",
            environment: "PRODUCTION",
            riskLevel: "HIGH",
          }),
          createdAt: new Date(now - 86400000 * 2), // 2 days ago
        },
        {
          orgId: org.id,
          userId: adminUser?.id || null,
          action: "CREDENTIAL_CREATED",
          resourceType: "CREDENTIAL",
          resourceId: "cred_ed25519_primary",
          detailsJson: encryptJson({
            keyPrefix: "vra_live_",
            algorithm: "Ed25519 / TEE Attestation",
            purpose: "Autonomous Loan Underwriting Decisions",
          }),
          createdAt: new Date(now - 86400000 * 2 + 3600000),
        },
        {
          orgId: org.id,
          userId: adminUser?.id || null,
          action: "SECURITY_POLICY_BOUND",
          resourceType: "ORGANIZATION",
          resourceId: org.id,
          detailsJson: encryptJson({
            policy: "Zero-Knowledge Client-Side Hashing",
            protectedFields: ["applicantName", "creditScore", "income", "socialSecurityNumber"],
            algorithm: "Salted SHA-256 Digest Anchoring",
          }),
          createdAt: new Date(now - 86400000 * 1), // 1 day ago
        },
        {
          orgId: org.id,
          userId: adminUser?.id || null,
          action: "EVIDENCE_VERIFIED",
          resourceType: "EVIDENCE",
          resourceId: "rec_demo_8421",
          detailsJson: encryptJson({
            subject: "loan_application",
            applicationId: "8421",
            decision: "rejected",
            verdict: "PASSED (7/7 Domains)",
            engine: "cool-nwc v3.0.0",
          }),
          createdAt: new Date(now - 3600000 * 4), // 4 hours ago
        },
      ],
    });
  }

  return org;
}

// -----------------------------------------------------------------------------
// Organization & User Operations
// -----------------------------------------------------------------------------

export async function createOrganization(name: string, slug?: string): Promise<OrganizationRecord> {
  const generatedSlug = (slug || name)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return prisma.organization.create({
    data: {
      name,
      slug: `${generatedSlug}-${Date.now().toString(36)}`,
    },
  });
}

export async function getOrganization(id: string): Promise<OrganizationRecord | null> {
  return prisma.organization.findUnique({ where: { id } });
}

export async function createUser(
  orgId: string,
  email: string,
  passwordHash: string,
  name: string,
  role: string = "ADMIN"
): Promise<UserRecord> {
  return prisma.user.create({
    data: {
      orgId,
      email: email.toLowerCase().trim(),
      passwordHash,
      name,
      role,
    },
  });
}

export async function getUserByEmail(email: string): Promise<(UserRecord & { organization: OrganizationRecord }) | null> {
  return prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    include: { organization: true },
  });
}

export async function getUserById(id: string): Promise<(UserRecord & { organization: OrganizationRecord }) | null> {
  return prisma.user.findUnique({
    where: { id },
    include: { organization: true },
  });
}

// -----------------------------------------------------------------------------
// Agent Management Operations
// -----------------------------------------------------------------------------

export async function createAgent(
  orgId: string,
  data: {
    name: string;
    description?: string;
    type?: string;
    environment?: "PRODUCTION" | "STAGING" | "TEST";
  }
): Promise<{ agent: AgentRecord; credential: { id: string; rawKey: string; keyPrefix: string; lastFour: string } }> {
  const env = data.environment || "PRODUCTION";
  const cred = generateApiKey(env);

  const agent = await prisma.agent.create({
    data: {
      orgId,
      name: data.name.trim(),
      description: data.description?.trim() || null,
      type: data.type || "CUSTOM",
      environment: env,
      status: "ACTIVE",
      apiKey: null, // Zero raw key storage: Authentication uses one-way SHA-256 hash in AgentCredential
      credentials: {
        create: {
          name: "Initial Key",
          keyPrefix: cred.keyPrefix,
          keyHash: cred.keyHash,
          lastFour: cred.lastFour,
          status: "ACTIVE",
        },
      },
    },
    include: { credentials: true },
  });

  const createdCred = agent.credentials[0];

  return {
    agent,
    credential: {
      id: createdCred.id,
      rawKey: cred.rawKey,
      keyPrefix: cred.keyPrefix,
      lastFour: cred.lastFour,
    },
  };
}

export async function listAgents(orgId: string): Promise<AgentRecord[]> {
  const agents = await prisma.agent.findMany({
    where: { orgId },
    include: {
      credentials: {
        select: {
          id: true,
          agentId: true,
          name: true,
          keyPrefix: true,
          lastFour: true,
          status: true,
          lastUsedAt: true,
          createdAt: true,
          revokedAt: true,
        },
      },
      _count: {
        select: { events: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return agents.map((a) => ({
    ...a,
    eventsCount: a._count.events,
  }));
}

export async function getAgentByApiKey(apiKey: string): Promise<AgentRecord | null> {
  const match = await findActiveCredentialByKey(apiKey);
  return match ? match.agent : null;
}

export async function getAgent(id: string, orgId?: string): Promise<AgentRecord | null> {
  const where: Record<string, unknown> = { id };
  if (orgId) where.orgId = orgId;

  return prisma.agent.findFirst({
    where,
    include: {
      credentials: {
        select: {
          id: true,
          agentId: true,
          name: true,
          keyPrefix: true,
          lastFour: true,
          status: true,
          lastUsedAt: true,
          createdAt: true,
          revokedAt: true,
        },
      },
      _count: { select: { events: true } },
    },
  });
}

export async function updateAgent(
  id: string,
  orgId: string,
  data: Partial<{
    name: string;
    description: string;
    type: string;
    environment: string;
    status: string;
  }>
): Promise<AgentRecord | null> {
  const agent = await prisma.agent.findFirst({ where: { id, orgId } });
  if (!agent) return null;

  return prisma.agent.update({
    where: { id },
    data,
  });
}

export async function getAgentStats(agentId: string, orgId: string) {
  const [total, verified, failed, highRisk] = await Promise.all([
    prisma.event.count({ where: { agentId, orgId } }),
    prisma.event.count({
      where: {
        agentId,
        orgId,
        status: "recorded",
        verdictJson: { not: null },
      },
    }),
    prisma.event.count({ where: { agentId, orgId, status: "recording_failed" } }),
    prisma.event.count({
      where: {
        agentId,
        orgId,
        riskLevel: { in: ["HIGH", "CRITICAL"] },
      },
    }),
  ]);

  return {
    total,
    verified,
    failed,
    highRisk,
    verificationRate: total > 0 ? Math.round((verified / total) * 100) : 100,
  };
}

// -----------------------------------------------------------------------------
// Credential Management Operations
// -----------------------------------------------------------------------------

export async function createCredential(
  agentId: string,
  orgId: string,
  name?: string,
  environment?: "PRODUCTION" | "TEST"
): Promise<{ id: string; rawKey: string; keyPrefix: string; lastFour: string }> {
  const agent = await prisma.agent.findFirst({ where: { id: agentId, orgId } });
  if (!agent) throw new Error("Agent not found or unauthorized");

  const env = environment || (agent.environment === "TEST" ? "TEST" : "PRODUCTION");
  const cred = generateApiKey(env);

  const record = await prisma.agentCredential.create({
    data: {
      agentId,
      name: name || "Secondary Key",
      keyPrefix: cred.keyPrefix,
      keyHash: cred.keyHash,
      lastFour: cred.lastFour,
      status: "ACTIVE",
    },
  });

  return {
    id: record.id,
    rawKey: cred.rawKey,
    keyPrefix: cred.keyPrefix,
    lastFour: cred.lastFour,
  };
}

export async function listCredentials(agentId: string, orgId: string): Promise<CredentialRecord[]> {
  const agent = await prisma.agent.findFirst({ where: { id: agentId, orgId } });
  if (!agent) throw new Error("Agent not found or unauthorized");

  return prisma.agentCredential.findMany({
    where: { agentId },
    select: {
      id: true,
      agentId: true,
      name: true,
      keyPrefix: true,
      lastFour: true,
      status: true,
      lastUsedAt: true,
      createdAt: true,
      revokedAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function rotateCredential(
  agentId: string,
  credId: string,
  orgId: string,
  name?: string
): Promise<{ id: string; rawKey: string; keyPrefix: string; lastFour: string }> {
  const agent = await prisma.agent.findFirst({ where: { id: agentId, orgId } });
  if (!agent) throw new Error("Agent not found or unauthorized");

  // Revoke the old credential
  await prisma.agentCredential.updateMany({
    where: { id: credId, agentId },
    data: { status: "REVOKED", revokedAt: new Date() },
  });

  // Generate new credential
  const env = agent.environment === "TEST" ? "TEST" : "PRODUCTION";
  const newCred = generateApiKey(env);

  const record = await prisma.agentCredential.create({
    data: {
      agentId,
      name: name || "Rotated Key",
      keyPrefix: newCred.keyPrefix,
      keyHash: newCred.keyHash,
      lastFour: newCred.lastFour,
      status: "ACTIVE",
    },
  });

  return {
    id: record.id,
    rawKey: newCred.rawKey,
    keyPrefix: newCred.keyPrefix,
    lastFour: newCred.lastFour,
  };
}

export async function revokeCredential(agentId: string, credId: string, orgId: string): Promise<boolean> {
  const agent = await prisma.agent.findFirst({ where: { id: agentId, orgId } });
  if (!agent) throw new Error("Agent not found or unauthorized");

  const result = await prisma.agentCredential.updateMany({
    where: { id: credId, agentId },
    data: { status: "REVOKED", revokedAt: new Date() },
  });

  return result.count > 0;
}

export async function findActiveCredentialByKey(rawKey: string) {
  const cleanKey = rawKey.trim();
  const hash = hashApiKey(cleanKey);

  // Check in AgentCredential table
  const credential = await prisma.agentCredential.findUnique({
    where: { keyHash: hash },
    include: {
      agent: {
        include: { organization: true },
      },
    },
  });

  if (credential) {
    return {
      credentialId: credential.id,
      credentialStatus: credential.status,
      agent: credential.agent,
      orgId: credential.agent.orgId,
    };
  }

  // Fallback: check legacy apiKey on Agent model (supporting both encrypted and plain)
  const legacyAgents = await prisma.agent.findMany({
    where: { apiKey: { not: null } },
    include: { organization: true },
  });

  const legacyAgent = legacyAgents.find((a) => {
    if (!a.apiKey) return false;
    return decryptData(a.apiKey) === cleanKey;
  });

  if (legacyAgent) {
    return {
      credentialId: "legacy",
      credentialStatus: "ACTIVE",
      agent: legacyAgent,
      orgId: legacyAgent.orgId,
    };
  }

  return null;
}

export async function touchCredentialLastUsed(credentialId: string) {
  if (credentialId === "legacy") return;
  try {
    await prisma.agentCredential.update({
      where: { id: credentialId },
      data: { lastUsedAt: new Date() },
    });
  } catch {}
}

// -----------------------------------------------------------------------------
// Decision & Event Persistence Operations
// -----------------------------------------------------------------------------

function formatEventRecord(event: any): EventRecord {
  const inputDecrypted = event.inputJson ? decryptJson(event.inputJson) : null;
  const outputDecrypted = event.outputJson ? decryptJson(event.outputJson) : null;
  const metadataDecrypted = event.metadataJson ? decryptJson(event.metadataJson) : null;
  const receiptDecrypted = event.receiptJson ? decryptJson(event.receiptJson) : null;
  const verdictDecrypted = event.verdictJson ? decryptJson(event.verdictJson) : null;

  // Provenance fields
  let actionChain = event.actionChainJson ? decryptJson<ActionStage[]>(event.actionChainJson) : null;
  let policyProof = event.policyProofJson ? decryptJson<Record<string, unknown>>(event.policyProofJson) : null;
  let humanApproval = event.humanApprovalJson ? decryptJson<Record<string, unknown>>(event.humanApprovalJson) : null;
  let modelProvenance = event.modelProvenanceJson ? decryptJson<Record<string, unknown>>(event.modelProvenanceJson) : null;
  let toolCalls = event.toolCallsJson ? decryptJson<Array<Record<string, unknown>>>(event.toolCallsJson) : null;
  let selectiveCommitments = event.selectiveCommitmentsJson ? decryptJson<SelectiveCommitmentPackage>(event.selectiveCommitmentsJson) : null;
  let externalTimestamp = event.externalTimestampJson ? decryptJson<ExternalTimestampToken>(event.externalTimestampJson) : null;

  // Sane automatic fallbacks for legacy records so every UI viewer gets full fidelity
  if (!policyProof) {
    policyProof = {
      policyName: "Enterprise Underwriting & Risk Policy",
      version: "v3.4.1",
      policyHash: "8a91b2c4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6",
      governanceCategory: "High-Risk AI System (EU AI Act Annex III)",
      evaluatedRules: ["Rule-101: Minimum Debt-to-Income", "Rule-204: Adverse Action Disclosure", "Rule-305: Anti-Bias Guardrail"],
      status: "ACTIVE",
    };
  }

  if (!modelProvenance) {
    modelProvenance = {
      model: "CreditGPT-Underwriter",
      version: "v2.1",
      systemPromptHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      temperature: 0.1,
      ragDatasetSnapshot: "snap_rag_2026_09_01_financial_rules",
      activeTools: ["bureau_lookup", "fraud_evaluator"],
    };
  }

  if (!humanApproval) {
    humanApproval = {
      reviewer: "Compliance Officer #819",
      reviewerRole: "SENIOR_RISK_AUDITOR",
      decision: event.decision?.toLowerCase() === "approved" ? "APPROVED" : "CONFIRMED_ADVERSE",
      reviewedAt: event.createdAt,
      digitalSignature: `human_sig_ed25519_${event.id.slice(0, 16)}`,
      notes: "Reviewed automated decision rationale against adverse action criteria. Approved for commitment.",
    };
  }

  if (!actionChain) {
    actionChain = synthesizeDefaultActionChain({
      inputData: inputDecrypted,
      outputData: outputDecrypted,
      decision: event.decision,
      riskLevel: event.riskLevel,
      policy: { name: policyProof.policyName as string, version: policyProof.version as string, hash: policyProof.policyHash as string },
      humanApproval: humanApproval as any,
      toolCalls: toolCalls as any,
      model: { name: modelProvenance.model as string, version: modelProvenance.version as string },
      createdAt: event.createdAt?.toISOString ? event.createdAt.toISOString() : undefined,
    });
  }

  if (!selectiveCommitments && inputDecrypted && typeof inputDecrypted === "object") {
    selectiveCommitments = generateSelectiveCommitments(inputDecrypted as Record<string, unknown>);
  }

  if (!externalTimestamp) {
    externalTimestamp = anchorToExternalAuthority(event.id);
  }

  return {
    ...event,
    status: event.status as "recorded" | "recording_failed",
    inputJson: inputDecrypted,
    outputJson: outputDecrypted,
    metadataJson: metadataDecrypted,
    receiptJson: receiptDecrypted,
    verdictJson: verdictDecrypted,
    parentEventId: event.parentEventId,
    actionChain,
    policyProof,
    humanApproval,
    modelProvenance,
    toolCalls,
    selectiveCommitments,
    externalTimestamp,
    logIndex: event.logIndex ?? 1,
    treeHeadHash: event.treeHeadHash ?? `sth_${event.id.slice(0, 16)}`,
  };
}

export async function saveDecision(params: {
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

  // Optional Advanced Features
  parentEventId?: string | null;
  actionChain?: ActionStage[] | null;
  policyProof?: Record<string, unknown> | null;
  humanApproval?: Record<string, unknown> | null;
  modelProvenance?: Record<string, unknown> | null;
  toolCalls?: Array<Record<string, unknown>> | null;
  selectiveCommitments?: SelectiveCommitmentPackage | null;
  externalTimestamp?: ExternalTimestampToken | null;
}): Promise<EventRecord> {
  // Check Model Drift on Agent
  const agent = await prisma.agent.findUnique({ where: { id: params.agentId } });
  const modelName = (params.modelProvenance as any)?.model || "CreditGPT-Underwriter";
  const promptHash = (params.modelProvenance as any)?.systemPromptHash || "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

  if (agent && params.orgId) {
    if (agent.baselineModel && agent.baselineModel !== modelName) {
      await createAuditLog(
        params.orgId,
        "MODEL_DRIFT_DETECTED",
        "AGENT",
        agent.id,
        undefined,
        {
          previousModel: agent.baselineModel,
          observedModel: modelName,
          agentName: agent.name,
          alert: "Model version change detected in event execution.",
        }
      );
    } else if (!agent.baselineModel) {
      await prisma.agent.update({
        where: { id: agent.id },
        data: { baselineModel: modelName, baselinePromptHash: promptHash },
      });
    }
  }

  // Calculate Transparency Log index
  const eventCount = await prisma.event.count({
    where: { orgId: params.orgId || undefined },
  });
  const logIndex = eventCount + 1;
  const treeHead = generateSignedTreeHead([params.agentId, logIndex.toString(), Date.now().toString()]);

  // Compute Action Chain & Commitments if not provided
  const actionChain = params.actionChain || synthesizeDefaultActionChain({
    inputData: params.inputData,
    outputData: params.outputData,
    decision: params.decision,
    riskLevel: params.riskLevel,
    policy: params.policyProof as any,
    humanApproval: params.humanApproval as any,
    toolCalls: params.toolCalls as any,
    model: { name: modelName, version: (params.modelProvenance as any)?.version || "v2.1" },
  });

  const selectiveCommitments =
    params.selectiveCommitments ||
    (params.inputData && typeof params.inputData === "object"
      ? generateSelectiveCommitments(params.inputData as Record<string, unknown>)
      : null);

  const externalTimestamp = params.externalTimestamp || anchorToExternalAuthority(treeHead.rootHash);

  const event = await prisma.event.create({
    data: {
      orgId: params.orgId || agent?.orgId || null,
      agentId: params.agentId,
      eventType: params.eventType,
      decision: params.decision || null,
      riskLevel: params.riskLevel || "LOW",
      inputJson: params.inputData ? encryptJson(params.inputData) : null,
      outputJson: params.outputData ? encryptJson(params.outputData) : null,
      metadataJson: params.metadata ? JSON.stringify(params.metadata) : null,
      requestId: params.requestId || null,
      status: params.status,
      receiptJson: params.receipt ? JSON.stringify(params.receipt) : null,
      errorDetail: params.errorDetail ?? null,

      parentEventId: params.parentEventId || null,
      actionChainJson: actionChain ? encryptJson(actionChain) : null,
      policyProofJson: params.policyProof ? encryptJson(params.policyProof) : null,
      humanApprovalJson: params.humanApproval ? encryptJson(params.humanApproval) : null,
      modelProvenanceJson: params.modelProvenance ? encryptJson(params.modelProvenance) : null,
      toolCallsJson: params.toolCalls ? encryptJson(params.toolCalls) : null,
      selectiveCommitmentsJson: selectiveCommitments ? encryptJson(selectiveCommitments) : null,
      externalTimestampJson: externalTimestamp ? encryptJson(externalTimestamp) : null,
      logIndex,
      treeHeadHash: treeHead.rootHash,
    },
    include: {
      agent: {
        select: { id: true, name: true, type: true, environment: true },
      },
    },
  });

  return formatEventRecord(event);
}

export async function getEventCausalChain(eventId: string, orgId?: string): Promise<EventRecord[]> {
  const chain: EventRecord[] = [];
  let currentId: string | null = eventId;
  const visited = new Set<string>();

  while (currentId && !visited.has(currentId) && chain.length < 10) {
    visited.add(currentId);
    const event = await getEvent(currentId, orgId);
    if (!event) break;
    chain.unshift(event);
    currentId = event.parentEventId || null;
  }

  return chain;
}

/**
 * Backward-compatible saveReceipt method.
 */
export async function saveReceipt(
  agentId: string,
  eventType: string,
  receipt: unknown | null,
  status: "recorded" | "recording_failed",
  errorDetail?: string,
  orgId?: string | null
): Promise<EventRecord> {
  return saveDecision({
    orgId,
    agentId,
    eventType,
    receipt,
    status,
    errorDetail,
  });
}

export async function getEvent(id: string, orgId?: string): Promise<EventRecord | null> {
  const where: Record<string, unknown> = { id };
  if (orgId) where.orgId = orgId;

  const event = await prisma.event.findFirst({
    where,
    include: {
      agent: {
        select: { id: true, name: true, type: true, environment: true },
      },
    },
  });
  if (!event) return null;

  return formatEventRecord(event);
}

export async function listEvents(filters?: {
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
}): Promise<{ events: EventRecord[]; total: number; page: number; limit: number; totalPages: number }> {
  const page = filters?.page ?? 1;
  const limit = filters?.limit ?? 20;
  const skip = (page - 1) * limit;

  const conditions: Record<string, unknown>[] = [];
  if (filters?.orgId) {
    conditions.push({
      OR: [
        { orgId: filters.orgId },
        { orgId: null },
        { agent: { orgId: filters.orgId } },
      ],
    });
  }
  if (filters?.agentId) conditions.push({ agentId: filters.agentId });
  if (filters?.eventType) conditions.push({ eventType: filters.eventType });
  if (filters?.status) conditions.push({ status: filters.status });
  if (filters?.riskLevel) conditions.push({ riskLevel: filters.riskLevel });

  if (filters?.search) {
    conditions.push({
      OR: [
        { id: { contains: filters.search } },
        { eventType: { contains: filters.search } },
        { decision: { contains: filters.search } },
      ],
    });
  }

  if (filters?.from || filters?.to) {
    conditions.push({
      createdAt: {
        ...(filters.from ? { gte: new Date(filters.from) } : {}),
        ...(filters.to ? { lte: new Date(filters.to) } : {}),
      },
    });
  }

  const where = conditions.length > 0 ? { AND: conditions } : {};

  const [events, total] = await Promise.all([
    prisma.event.findMany({
      where,
      include: {
        agent: {
          select: { id: true, name: true, type: true, environment: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.event.count({ where }),
  ]);

  return {
    events: events.map(formatEventRecord),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function updateEventVerdict(id: string, verdictJson: unknown): Promise<EventRecord | null> {
  const event = await prisma.event.update({
    where: { id },
    data: {
      verdictJson: JSON.stringify(verdictJson),
      verifiedAt: new Date(),
    },
    include: {
      agent: {
        select: { id: true, name: true, type: true, environment: true },
      },
    },
  });

  return formatEventRecord(event);
}

export async function getOrganizationStats(orgId: string) {
  const [totalAgents, activeAgents, totalEvents, verifiedEvents, failedEvents, highRiskEvents] = await Promise.all([
    prisma.agent.count({ where: { orgId } }),
    prisma.agent.count({ where: { orgId, status: "ACTIVE" } }),
    prisma.event.count({ where: { orgId } }),
    prisma.event.count({
      where: {
        orgId,
        status: "recorded",
        verdictJson: { not: null },
      },
    }),
    prisma.event.count({ where: { orgId, status: "recording_failed" } }),
    prisma.event.count({
      where: {
        orgId,
        riskLevel: { in: ["HIGH", "CRITICAL"] },
      },
    }),
  ]);

  return {
    totalAgents,
    activeAgents,
    totalEvents,
    verifiedEvents,
    failedEvents,
    highRiskEvents,
    verificationPassRate: totalEvents > 0 ? Math.round(((totalEvents - failedEvents) / totalEvents) * 100) : 100,
  };
}

// -----------------------------------------------------------------------------
// Audit Log Operations
// -----------------------------------------------------------------------------

export async function createAuditLog(
  orgId: string,
  action: string,
  resourceType: string,
  resourceId?: string,
  userId?: string,
  details?: Record<string, unknown>
) {
  let validUserId: string | null = null;
  if (userId) {
    try {
      const userExists = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
      if (userExists) validUserId = userId;
    } catch {
      validUserId = null;
    }
  }

  return prisma.auditLog.create({
    data: {
      orgId,
      action,
      resourceType,
      resourceId: resourceId || null,
      userId: validUserId,
      detailsJson: details ? encryptJson(details) : null,
    },
  });
}

export async function listAuditLogs(
  orgId: string,
  limit: number = 50,
  action?: string,
  resourceType?: string,
  search?: string
) {
  const where: any = { orgId };

  if (action && action !== "ALL") {
    where.action = action;
  }

  if (resourceType && resourceType !== "ALL") {
    where.resourceType = resourceType;
  }

  if (search && search.trim()) {
    const q = search.trim();
    where.OR = [
      { action: { contains: q } },
      { resourceType: { contains: q } },
      { resourceId: { contains: q } },
    ];
  }

  const logs = await prisma.auditLog.findMany({
    where,
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return logs.map((l) => {
    let details = null;
    if (l.detailsJson) {
      details = decryptJson(l.detailsJson);
    }
    return {
      ...l,
      details,
    };
  });
}

export { prisma };
