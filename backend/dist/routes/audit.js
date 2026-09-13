/**
 * Audit Trail Routes
 */
import { Router } from "express";
import { listAuditLogs } from "../services/db.js";
import { orgAuth } from "../middleware/tenantAuth.js";
const router = Router();
/**
 * GET /api/v1/audit
 * List immutable audit trail logs for the organization.
 */
router.get("/", orgAuth, async (req, res) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit, 10) : 100;
        const action = req.query.action;
        const resourceType = req.query.resourceType;
        const search = req.query.search;
        const logs = await listAuditLogs(req.orgId, limit, action, resourceType, search);
        res.json({ logs, total: logs.length, requestId: req.requestId });
    }
    catch (err) {
        console.error("[VeritasAI Audit] GET /audit error:", err);
        res.status(500).json({ error: "Internal server error", requestId: req.requestId });
    }
});
export default router;
