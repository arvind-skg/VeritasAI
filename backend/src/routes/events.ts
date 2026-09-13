/**
 * Event routes — record, list, get, and verify evidence events.
 */
import { Router, type Request, type Response } from "express";
import { recordEvent, verifyReceipt } from "../services/coolClient.js";
import {
  saveReceipt,
  getEvent,
  listEvents,
  updateEventVerdict,
} from "../services/db.js";

const router = Router();

/**
 * POST /api/v1/events
 * Record a new evidence event.
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const { agentId, eventType, metadata, payloads } = req.body;

    if (!agentId || !eventType) {
      res.status(400).json({
        error: "agentId and eventType are required",
      });
      return;
    }

    const meta = metadata ?? {};
    const pay = payloads ?? {};

    let event;
    try {
      const { evidence } = await recordEvent(eventType, meta, pay);
      event = await saveReceipt(agentId, eventType, evidence, "recorded");
    } catch (err) {
      // Fail-safe: recording failed, but we still create the event record
      event = await saveReceipt(
        agentId,
        eventType,
        null,
        "recording_failed",
        String(err)
      );
    }

    res.status(201).json(event);
  } catch (err) {
    console.error("[VeritasAI] POST /events error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/v1/events
 * List events with optional filters and pagination.
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const { agentId, eventType, page, limit, from, to } = req.query;

    const result = await listEvents({
      agentId: agentId as string | undefined,
      eventType: eventType as string | undefined,
      from: from as string | undefined,
      to: to as string | undefined,
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
    });

    res.json(result);
  } catch (err) {
    console.error("[VeritasAI] GET /events error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/v1/events/:id
 * Get a single event with its full receipt.
 */
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const event = await getEvent(req.params.id);
    if (!event) {
      res.status(404).json({ error: "Event not found" });
      return;
    }
    res.json(event);
  } catch (err) {
    console.error("[VeritasAI] GET /events/:id error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/v1/events/:id/verify
 * Re-run verifyEvidence() against the stored receipt, cache + return the verdict.
 */
router.post("/:id/verify", async (req: Request, res: Response) => {
  try {
    const event = await getEvent(req.params.id);
    if (!event) {
      res.status(404).json({ error: "Event not found" });
      return;
    }

    if (event.status === "recording_failed" || !event.receiptJson) {
      res.status(400).json({
        error:
          "Cannot verify: this event has no receipt (recording failed)",
        status: event.status,
        errorDetail: event.errorDetail,
      });
      return;
    }

    const verdict = await verifyReceipt(event.receiptJson);
    const updatedEvent = await updateEventVerdict(event.id, verdict);

    res.json({
      eventId: event.id,
      verdict,
      verifiedAt: updatedEvent?.verifiedAt,
    });
  } catch (err) {
    console.error("[VeritasAI] POST /events/:id/verify error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
