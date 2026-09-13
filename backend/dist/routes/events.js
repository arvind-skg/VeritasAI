/**
 * Event routes — record, list, get, and verify evidence events with tenant isolation.
 */
import { Router } from "express";
import { recordEvent, verifyReceipt } from "../services/coolClient.js";
import { saveDecision, getEvent, listEvents, updateEventVerdict, ensureDefaultOrganization, createAuditLog, getEventCausalChain, } from "../services/db.js";
import { createSelectiveDisclosureProof, verifySelectiveDisclosureProof, } from "../services/cryptography/index.js";
import { combinedAuth } from "../middleware/tenantAuth.js";
const router = Router();
/**
 * POST /api/v1/events
 * Record a new evidence event with full action chain and provenance support.
 */
router.post("/", combinedAuth, async (req, res) => {
    try {
        const { agentId, eventType, metadata, payloads, decision, riskLevel, parentEventId, actionChain, policyProof, humanApproval, modelProvenance, toolCalls, } = req.body;
        if (!agentId || !eventType) {
            res.status(400).json({
                error: "agentId and eventType are required",
                requestId: req.requestId,
            });
            return;
        }
        const orgId = req.orgId || (await ensureDefaultOrganization()).id;
        const meta = metadata ?? {};
        const pay = payloads ?? {};
        let event;
        try {
            const { evidence } = await recordEvent(eventType, meta, pay);
            event = await saveDecision({
                orgId,
                agentId,
                eventType,
                decision: decision || meta.decision || pay.decision || null,
                riskLevel: riskLevel || "LOW",
                inputData: pay,
                outputData: meta,
                metadata: meta,
                requestId: req.requestId,
                receipt: evidence,
                status: "recorded",
                parentEventId,
                actionChain,
                policyProof,
                humanApproval,
                modelProvenance,
                toolCalls,
            });
        }
        catch (err) {
            // Fail-safe: recording failed, but we still create the event record
            event = await saveDecision({
                orgId,
                agentId,
                eventType,
                decision: decision || null,
                riskLevel: riskLevel || "LOW",
                inputData: pay,
                outputData: meta,
                metadata: meta,
                requestId: req.requestId,
                receipt: null,
                status: "recording_failed",
                errorDetail: String(err),
            });
        }
        res.status(201).json(event);
    }
    catch (err) {
        console.error("[VeritasAI] POST /events error:", err);
        res.status(500).json({ error: "Internal server error", requestId: req.requestId });
    }
});
/**
 * GET /api/v1/events
 * List events with multi-tenant filtering and pagination.
 */
router.get("/", combinedAuth, async (req, res) => {
    try {
        const { agentId, eventType, status, riskLevel, search, page, limit, from, to } = req.query;
        const orgId = req.orgId || (await ensureDefaultOrganization()).id;
        const result = await listEvents({
            orgId,
            agentId: agentId,
            eventType: eventType,
            status: status,
            riskLevel: riskLevel,
            search: search,
            from: from,
            to: to,
            page: page ? parseInt(page, 10) : undefined,
            limit: limit ? parseInt(limit, 10) : undefined,
        });
        res.json(result);
    }
    catch (err) {
        console.error("[VeritasAI] GET /events error:", err);
        res.status(500).json({ error: "Internal server error", requestId: req.requestId });
    }
});
/**
 * GET /api/v1/events/:id
 * Get a single event with full receipt and tenant verification.
 */
router.get("/:id", combinedAuth, async (req, res) => {
    try {
        const orgId = req.orgId;
        const eventId = String(req.params.id);
        const event = await getEvent(eventId, orgId);
        if (!event) {
            res.status(404).json({ error: "Event not found or unauthorized", requestId: req.requestId });
            return;
        }
        res.json(event);
    }
    catch (err) {
        console.error("[VeritasAI] GET /events/:id error:", err);
        res.status(500).json({ error: "Internal server error", requestId: req.requestId });
    }
});
/**
 * POST /api/v1/events/:id/verify
 * Re-run verifyEvidence() against the stored receipt, cache + return the verdict.
 */
router.post("/:id/verify", combinedAuth, async (req, res) => {
    try {
        const orgId = req.orgId;
        const eventId = String(req.params.id);
        const event = await getEvent(eventId, orgId);
        if (!event) {
            res.status(404).json({ error: "Event not found or unauthorized", requestId: req.requestId });
            return;
        }
        if (event.status === "recording_failed" || !event.receiptJson) {
            res.status(400).json({
                error: "Cannot verify: this event has no receipt (recording failed)",
                status: event.status,
                errorDetail: event.errorDetail,
                requestId: req.requestId,
            });
            return;
        }
        const verdict = await verifyReceipt(event.receiptJson);
        const updatedEvent = await updateEventVerdict(event.id, verdict);
        // Audit trail record for verification action
        const currentOrgId = orgId || event.orgId || (await ensureDefaultOrganization()).id;
        createAuditLog(currentOrgId, verdict.ok ? "EVIDENCE_VERIFIED" : "VERIFICATION_FAILED", "EVIDENCE", event.id, req.user?.userId, {
            eventType: event.eventType,
            decision: event.decision,
            verdictOk: verdict.ok,
            keyBinding: verdict.checks?.binding?.status,
            signature: verdict.checks?.signature?.status,
            inclusion: verdict.checks?.inclusion?.status,
            hardwareAttestation: verdict.checks?.attestation?.status,
        }).catch((e) => console.warn("[VeritasAI] Verification audit logging skipped:", e));
        res.json({
            eventId: event.id,
            verdict,
            verifiedAt: updatedEvent?.verifiedAt,
            requestId: req.requestId,
        });
    }
    catch (err) {
        console.error("[VeritasAI] POST /events/:id/verify error:", err);
        res.status(500).json({ error: "Internal server error", requestId: req.requestId });
    }
});
/**
 * GET /api/v1/events/:id/causal-chain
 * Returns the DAG of parent and predecessor events leading to this action.
 */
router.get("/:id/causal-chain", combinedAuth, async (req, res) => {
    try {
        const chain = await getEventCausalChain(String(req.params.id), req.orgId);
        res.json({
            eventId: req.params.id,
            causalChainLength: chain.length,
            events: chain,
            requestId: req.requestId,
        });
    }
    catch (err) {
        res.status(500).json({ error: "Failed to fetch causal chain", requestId: req.requestId });
    }
});
/**
 * POST /api/v1/events/:id/selective-disclosure
 * Generates a zero-knowledge style selective disclosure certificate disclosing ONLY selected fields.
 */
router.post("/:id/selective-disclosure", combinedAuth, async (req, res) => {
    try {
        const event = await getEvent(String(req.params.id), req.orgId);
        if (!event) {
            res.status(404).json({ error: "Event not found", requestId: req.requestId });
            return;
        }
        const selectedFields = req.body.selectedFields;
        if (!Array.isArray(selectedFields) || selectedFields.length === 0) {
            res.status(400).json({ error: "selectedFields array is required", requestId: req.requestId });
            return;
        }
        const inputData = event.inputJson || {};
        const commitmentsPackage = event.selectiveCommitments;
        if (!commitmentsPackage) {
            res.status(400).json({ error: "Selective commitments not found for this event", requestId: req.requestId });
            return;
        }
        const proof = createSelectiveDisclosureProof(inputData, commitmentsPackage, selectedFields);
        res.json({
            eventId: event.id,
            proof,
            requestId: req.requestId,
        });
    }
    catch (err) {
        res.status(500).json({ error: "Failed to generate selective disclosure", requestId: req.requestId });
    }
});
/**
 * POST /api/v1/events/verify-selective-proof
 * Verifies any selective disclosure proof offline.
 */
router.post("/verify-selective-proof", async (req, res) => {
    try {
        const { proof } = req.body;
        if (!proof) {
            res.status(400).json({ error: "proof object is required", requestId: req.requestId });
            return;
        }
        const result = verifySelectiveDisclosureProof(proof);
        res.json({
            ...result,
            verifiedAt: new Date().toISOString(),
            requestId: req.requestId,
        });
    }
    catch (err) {
        res.status(500).json({ error: "Failed to verify selective proof", requestId: req.requestId });
    }
});
export default router;
