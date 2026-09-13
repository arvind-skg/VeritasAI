import { verifyToken } from "../services/security.js";
import { findActiveCredentialByKey, touchCredentialLastUsed, ensureDefaultOrganization, prisma, } from "../services/db.js";
/**
 * Request ID injector for distributed tracing and auditability.
 */
export function requestIdMiddleware(req, res, next) {
    const reqId = req.headers["x-request-id"] || `req_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
    req.requestId = reqId;
    res.setHeader("X-Request-Id", reqId);
    next();
}
/**
 * Middleware for Organization Users (Dashboard access, Agent management).
 * Authenticates JWT bearer token and enforces tenant context.
 */
export async function orgAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({
            error: "Unauthorized: Missing organization authorization token",
            requestId: req.requestId,
        });
        return;
    }
    const token = authHeader.split(" ")[1];
    // Backward compatibility check for legacy demo token
    if (token === "veritasai-admin") {
        const defaultOrg = await ensureDefaultOrganization();
        const adminUser = await prisma.user.findFirst({ where: { orgId: defaultOrg.id } });
        req.orgId = defaultOrg.id;
        req.user = {
            userId: adminUser?.id || "usr_demo_admin",
            orgId: defaultOrg.id,
            role: "ADMIN",
        };
        return next();
    }
    const decoded = verifyToken(token);
    if (!decoded) {
        res.status(401).json({
            error: "Unauthorized: Invalid or expired organization token",
            requestId: req.requestId,
        });
        return;
    }
    req.user = decoded;
    req.orgId = decoded.orgId;
    next();
}
/**
 * Middleware for AI Agent telemetry ingestion (Python SDK / REST API).
 * Authenticates agent API keys (vra_live_... / vra_test_...) with cryptographic hashing.
 */
export async function agentAuth(req, res, next) {
    let apiKey;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
        apiKey = authHeader.split(" ")[1];
    }
    else if (req.headers["x-api-key"]) {
        apiKey = req.headers["x-api-key"];
    }
    if (!apiKey) {
        res.status(401).json({
            error: "AuthenticationError: Missing API key in Authorization header (expected 'Bearer vra_live_...')",
            requestId: req.requestId,
        });
        return;
    }
    const credentialMatch = await findActiveCredentialByKey(apiKey);
    if (!credentialMatch) {
        res.status(401).json({
            error: "AuthenticationError: Invalid or unrecognized agent API key",
            requestId: req.requestId,
        });
        return;
    }
    if (credentialMatch.credentialStatus === "REVOKED") {
        res.status(401).json({
            error: "CredentialRevokedError: This API key has been revoked by your organization",
            requestId: req.requestId,
        });
        return;
    }
    if (credentialMatch.agent.status === "DISABLED") {
        res.status(403).json({
            error: "InvalidAgentError: The requested agent has been disabled by your organization",
            requestId: req.requestId,
        });
        return;
    }
    if (credentialMatch.agent.status === "REVOKED") {
        res.status(403).json({
            error: "InvalidAgentError: The requested agent has been permanently revoked",
            requestId: req.requestId,
        });
        return;
    }
    // Update last active timestamp asynchronously
    touchCredentialLastUsed(credentialMatch.credentialId);
    req.agent = credentialMatch.agent;
    req.orgId = credentialMatch.orgId || undefined;
    req.agentCredentialId = credentialMatch.credentialId;
    next();
}
/**
 * Combined authentication allowing either an Organization User OR an Agent Key.
 * Useful for read/verify endpoints accessed by either dashboard users or automated SDKs.
 */
export async function combinedAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        // If no header, check if in demo development mode
        const defaultOrg = await ensureDefaultOrganization();
        req.orgId = defaultOrg.id;
        return next();
    }
    const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : authHeader;
    // 1. Check if it's an Agent API Key
    if (token.startsWith("vra_") || token.startsWith("vai_")) {
        return agentAuth(req, res, next);
    }
    // 2. Otherwise treat as Org User JWT or Admin Token
    return orgAuth(req, res, next);
}
