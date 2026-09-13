/**
 * Agent Management Routes — Multi-Tenant Agent & Credential Lifecycle
 */
import { Router } from "express";
import { createAgent, listAgents, getAgent, updateAgent, getAgentStats, createCredential, listCredentials, rotateCredential, revokeCredential, createAuditLog, ensureDefaultOrganization, } from "../services/db.js";
import { orgAuth, combinedAuth } from "../middleware/tenantAuth.js";
const router = Router();
/**
 * GET /api/v1/agents
 * List all agents belonging to the authenticated organization.
 */
router.get("/", combinedAuth, async (req, res) => {
    try {
        const orgId = req.orgId || (await ensureDefaultOrganization()).id;
        const agents = await listAgents(orgId);
        res.json({ agents, requestId: req.requestId });
    }
    catch (err) {
        console.error("[VeritasAI Agents] GET /agents error:", err);
        res.status(500).json({ error: "Internal server error", requestId: req.requestId });
    }
});
/**
 * POST /api/v1/agents
 * Register a new agent under the organization. Returns the agent and the newly generated API key.
 */
router.post("/", combinedAuth, async (req, res) => {
    try {
        const orgId = req.orgId || (await ensureDefaultOrganization()).id;
        const { name, description, type, environment } = req.body;
        if (!name || typeof name !== "string" || name.trim().length === 0) {
            res.status(400).json({ error: "Agent name is required", requestId: req.requestId });
            return;
        }
        const { agent, credential } = await createAgent(orgId, {
            name: name.trim(),
            description,
            type: type || "CUSTOM",
            environment: environment || "PRODUCTION",
        });
        await createAuditLog(orgId, "AGENT_CREATED", "AGENT", agent.id, req.user?.userId, { name: agent.name, environment: agent.environment });
        res.status(201).json({
            agent,
            credential,
            apiKey: credential.rawKey, // returned once upon creation
            requestId: req.requestId,
        });
    }
    catch (err) {
        console.error("[VeritasAI Agents] POST /agents error:", err);
        res.status(500).json({ error: "Internal server error", requestId: req.requestId });
    }
});
/**
 * GET /api/v1/agents/:id
 * Retrieve agent details, analytics, and credential metadata.
 */
router.get("/:id", combinedAuth, async (req, res) => {
    try {
        const orgId = req.orgId || (await ensureDefaultOrganization()).id;
        const agentId = String(req.params.id);
        const agent = await getAgent(agentId, orgId);
        if (!agent) {
            res.status(404).json({ error: "Agent not found or unauthorized", requestId: req.requestId });
            return;
        }
        const stats = await getAgentStats(agent.id, orgId);
        res.json({
            agent,
            stats,
            requestId: req.requestId,
        });
    }
    catch (err) {
        console.error("[VeritasAI Agents] GET /agents/:id error:", err);
        res.status(500).json({ error: "Internal server error", requestId: req.requestId });
    }
});
/**
 * PATCH /api/v1/agents/:id
 * Update agent status (ACTIVE, DISABLED), name, environment, or description.
 */
router.patch("/:id", orgAuth, async (req, res) => {
    try {
        const orgId = req.orgId;
        const agentId = String(req.params.id);
        const { name, description, type, environment, status } = req.body;
        const updated = await updateAgent(agentId, orgId, {
            name,
            description,
            type,
            environment,
            status,
        });
        if (!updated) {
            res.status(404).json({ error: "Agent not found or unauthorized", requestId: req.requestId });
            return;
        }
        await createAuditLog(orgId, "AGENT_UPDATED", "AGENT", updated.id, req.user?.userId, { changes: req.body });
        res.json({ agent: updated, requestId: req.requestId });
    }
    catch (err) {
        console.error("[VeritasAI Agents] PATCH /agents/:id error:", err);
        res.status(500).json({ error: "Internal server error", requestId: req.requestId });
    }
});
// -----------------------------------------------------------------------------
// Credential Management Subroutes
// -----------------------------------------------------------------------------
/**
 * GET /api/v1/agents/:id/credentials
 * List safe credential metadata for an agent.
 */
router.get("/:id/credentials", orgAuth, async (req, res) => {
    try {
        const agentId = String(req.params.id);
        const credentials = await listCredentials(agentId, req.orgId);
        res.json({ credentials, requestId: req.requestId });
    }
    catch (err) {
        res.status(400).json({ error: err.message, requestId: req.requestId });
    }
});
/**
 * POST /api/v1/agents/:id/credentials
 * Generate a new credential for an agent.
 */
router.post("/:id/credentials", orgAuth, async (req, res) => {
    try {
        const agentId = String(req.params.id);
        const { name, environment } = req.body;
        const credential = await createCredential(agentId, req.orgId, name, environment);
        await createAuditLog(req.orgId, "CREDENTIAL_CREATED", "CREDENTIAL", credential.id, req.user?.userId, { agentId, keyPrefix: credential.keyPrefix });
        res.status(201).json({
            credential,
            apiKey: credential.rawKey,
            requestId: req.requestId,
        });
    }
    catch (err) {
        res.status(400).json({ error: err.message, requestId: req.requestId });
    }
});
/**
 * POST /api/v1/agents/:id/credentials/:credId/rotate
 * Rotate a credential: marks old one REVOKED and returns a newly generated active key.
 */
router.post("/:id/credentials/:credId/rotate", orgAuth, async (req, res) => {
    try {
        const agentId = String(req.params.id);
        const credId = String(req.params.credId);
        const credential = await rotateCredential(agentId, credId, req.orgId, req.body?.name);
        await createAuditLog(req.orgId, "CREDENTIAL_ROTATED", "CREDENTIAL", credential.id, req.user?.userId, { agentId, rotatedCredId: credId });
        res.json({
            message: "Credential rotated successfully. The previous key is revoked.",
            credential,
            apiKey: credential.rawKey,
            requestId: req.requestId,
        });
    }
    catch (err) {
        res.status(400).json({ error: err.message, requestId: req.requestId });
    }
});
/**
 * DELETE /api/v1/agents/:id/credentials/:credId
 * Revoke an API key.
 */
router.delete("/:id/credentials/:credId", orgAuth, async (req, res) => {
    try {
        const agentId = String(req.params.id);
        const credId = String(req.params.credId);
        const success = await revokeCredential(agentId, credId, req.orgId);
        if (!success) {
            res.status(404).json({ error: "Credential not found or already revoked", requestId: req.requestId });
            return;
        }
        await createAuditLog(req.orgId, "CREDENTIAL_REVOKED", "CREDENTIAL", credId, req.user?.userId, { agentId });
        res.json({ message: "Credential revoked successfully", requestId: req.requestId });
    }
    catch (err) {
        res.status(400).json({ error: err.message, requestId: req.requestId });
    }
});
export default router;
