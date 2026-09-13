/**
 * Database service — Prisma + SQLite persistence layer.
 *
 * Replaces the M1 in-memory store. Same interface so routes don't change.
 */
import { PrismaClient } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();

export interface EventRecord {
  id: string;
  agentId: string;
  eventType: string;
  status: "recorded" | "recording_failed";
  receiptJson: unknown | null;
  errorDetail: string | null;
  verdictJson: unknown | null;
  verifiedAt: Date | null;
  createdAt: Date;
}

export interface AgentRecord {
  id: string;
  name: string;
  apiKey: string;
  createdAt: Date;
}

/**
 * Save an evidence receipt (or a recording failure) to the database.
 */
export async function saveReceipt(
  agentId: string,
  eventType: string,
  receipt: unknown | null,
  status: "recorded" | "recording_failed",
  errorDetail?: string
): Promise<EventRecord> {
  const event = await prisma.event.create({
    data: {
      agentId,
      eventType,
      status,
      receiptJson: receipt ? JSON.stringify(receipt) : null,
      errorDetail: errorDetail ?? null,
    },
  });

  return {
    ...event,
    status: event.status as "recorded" | "recording_failed",
    receiptJson: event.receiptJson ? JSON.parse(event.receiptJson) : null,
    verdictJson: event.verdictJson ? JSON.parse(event.verdictJson) : null,
  };
}

/**
 * Get a single event by ID.
 */
export async function getEvent(id: string): Promise<EventRecord | null> {
  const event = await prisma.event.findUnique({
    where: { id },
    include: { agent: true },
  });
  if (!event) return null;

  return {
    ...event,
    status: event.status as "recorded" | "recording_failed",
    receiptJson: event.receiptJson ? JSON.parse(event.receiptJson) : null,
    verdictJson: event.verdictJson ? JSON.parse(event.verdictJson) : null,
  };
}

/**
 * List events with optional filters and pagination.
 */
export async function listEvents(filters?: {
  agentId?: string;
  eventType?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}): Promise<{ events: EventRecord[]; total: number; page: number; limit: number; totalPages: number }> {
  const page = filters?.page ?? 1;
  const limit = filters?.limit ?? 20;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (filters?.agentId) where.agentId = filters.agentId;
  if (filters?.eventType) where.eventType = filters.eventType;
  if (filters?.from || filters?.to) {
    where.createdAt = {
      ...(filters.from ? { gte: new Date(filters.from) } : {}),
      ...(filters.to ? { lte: new Date(filters.to) } : {}),
    };
  }

  const [events, total] = await Promise.all([
    prisma.event.findMany({
      where,
      include: { agent: true },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.event.count({ where }),
  ]);

  return {
    events: events.map((e) => ({
      ...e,
      status: e.status as "recorded" | "recording_failed",
      receiptJson: e.receiptJson ? JSON.parse(e.receiptJson) : null,
      verdictJson: e.verdictJson ? JSON.parse(e.verdictJson) : null,
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Update an event's verdict after verification.
 */
export async function updateEventVerdict(
  id: string,
  verdictJson: unknown
): Promise<EventRecord | null> {
  const event = await prisma.event.update({
    where: { id },
    data: {
      verdictJson: JSON.stringify(verdictJson),
      verifiedAt: new Date(),
    },
  });

  return {
    ...event,
    status: event.status as "recorded" | "recording_failed",
    receiptJson: event.receiptJson ? JSON.parse(event.receiptJson) : null,
    verdictJson: event.verdictJson ? JSON.parse(event.verdictJson) : null,
  };
}

/**
 * Create a new agent.
 */
export async function createAgent(name: string): Promise<AgentRecord> {
  return prisma.agent.create({
    data: {
      name,
      apiKey: `vai_${uuidv4().replace(/-/g, "")}`,
    },
  });
}

/**
 * List all agents.
 */
export async function listAgents(): Promise<AgentRecord[]> {
  return prisma.agent.findMany({
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Get agent by ID.
 */
export async function getAgent(id: string): Promise<AgentRecord | null> {
  return prisma.agent.findUnique({ where: { id } });
}

/**
 * Get agent by API key.
 */
export async function getAgentByApiKey(apiKey: string): Promise<AgentRecord | null> {
  return prisma.agent.findUnique({ where: { apiKey } });
}

export { prisma };
