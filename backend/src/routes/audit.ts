/**
 * Audit Trail Routes
 */
import { Router, type Request, type Response } from "express";
import { listAuditLogs } from "../services/db.js";
import { orgAuth } from "../middleware/tenantAuth.js";

const router = Router();

/**
 * GET /api/v1/audit
 * List immutable audit trail logs for the organization.
 */
router.get("/", orgAuth, async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;
    const action = req.query.action as string | undefined;
    const resourceType = req.query.resourceType as string | undefined;
    const search = req.query.search as string | undefined;

    const logs = await listAuditLogs(req.orgId!, limit, action, resourceType, search);
    res.json({ logs, total: logs.length, requestId: req.requestId });
  } catch (err) {
    console.error("[VeritasAI Audit] GET /audit error:", err);
    res.status(500).json({ error: "Internal server error", requestId: req.requestId });
  }
});

export default router;
