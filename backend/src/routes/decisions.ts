/**
 * AI Decision Telemetry & Ingestion Routes
 *
 * Dedicated ingestion pipeline for the VeritasAI Python SDK and partner AI applications.
 */
import { Router, type Request, type Response } from "express";
import { defaultProvider } from "../services/providers/index.js";
import { saveDecision, getEvent } from "../services/db.js";
import { agentAuth, combinedAuth } from "../middleware/tenantAuth.js";

const router = Router();

/**
 * POST /api/v1/decisions
 * Ingest an AI decision event. Authenticated via Agent API Key.
 */
router.post("/", agentAuth, async (req: Request, res: Response) => {
  const agent = req.agent;
  const orgId = req.orgId || agent.orgId;
  const requestId = req.requestId || `req_${Date.now().toString(36)}`;

  try {
    const {
      decision,
      event_type,
      eventType,
      input_data,
      inputData,
      output,
      metadata,
      risk_level,
      riskLevel,
      model_info,
      modelInfo,
    } = req.body;

    if (!decision) {
      res.status(400).json({
        error: "ValidationError: 'decision' field is required (e.g. 'approved', 'rejected')",
        requestId,
      });
      return;
    }

    const resolvedEventType = event_type || eventType || `${agent.type.toLowerCase()}_decision`;
    const resolvedRisk = (risk_level || riskLevel || "LOW").toUpperCase();
    const resolvedInput = input_data || inputData || {};
    const resolvedOutput = output || {};
    const resolvedMetadata = {
      ...(metadata || {}),
      agentId: agent.id,
      agentName: agent.name,
      environment: agent.environment,
      decision,
      modelInfo: model_info || modelInfo || null,
      timestamp: new Date().toISOString(),
    };

    // Sensitive context payloads for client-side cryptographic hashing:
    const payloads = {
      inputContext: resolvedInput,
      outputDecision: resolvedOutput,
    };

    let receipt: unknown = null;
    let status: "recorded" | "recording_failed" = "recorded";
    let errorDetail: string | null = null;

    // Fail-safe cryptographic commitment
    try {
      const recordResult = await defaultProvider.record(
        resolvedEventType,
        resolvedMetadata,
        payloads
      );
      receipt = recordResult.evidence;
    } catch (err: any) {
      status = "recording_failed";
      errorDetail = String(err?.message || err);
      console.warn(`[VeritasAI Ingestion] Provider attestation failed (fail-safe active):`, errorDetail);
    }

    // Persist to relational store under organization boundary
    const event = await saveDecision({
      orgId,
      agentId: agent.id,
      eventType: resolvedEventType,
      decision,
      riskLevel: resolvedRisk,
      inputData: resolvedInput,
      outputData: resolvedOutput,
      metadata: resolvedMetadata,
      requestId,
      receipt,
      status,
      errorDetail,
    });

    res.status(201).json({
      success: true,
      event_id: event.id,
      verification_status: status,
      decision,
      risk_level: resolvedRisk,
      receipt: event.receiptJson,
      request_id: requestId,
    });
  } catch (err) {
    console.error("[VeritasAI Ingestion] POST /decisions error:", err);
    res.status(500).json({
      error: "ServerError: Failed to process decision telemetry",
      requestId,
    });
  }
});

/**
 * GET /api/v1/decisions/:id
 * Retrieve a single decision by ID. Accessible by organization users or agent keys.
 */
router.get("/:id", combinedAuth, async (req: Request, res: Response) => {
  try {
    const event = await getEvent(String(req.params.id), req.orgId);
    if (!event) {
      res.status(404).json({ error: "Decision event not found", requestId: req.requestId });
      return;
    }

    res.json({
      decision: event,
      requestId: req.requestId,
    });
  } catch (err) {
    console.error("[VeritasAI Ingestion] GET /decisions/:id error:", err);
    res.status(500).json({ error: "Internal server error", requestId: req.requestId });
  }
});

export default router;
