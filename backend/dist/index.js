/**
 * VeritasAI Backend — Enterprise AI Agent Verification & Audit Platform
 *
 * REST API entrypoint mounted at /api/v1.
 */
import "dotenv/config";
import express from "express";
import cors from "cors";
import authRouter from "./routes/auth.js";
import agentsRouter from "./routes/agents.js";
import decisionsRouter from "./routes/decisions.js";
import eventsRouter from "./routes/events.js";
import auditRouter from "./routes/audit.js";
import demoRouter from "./routes/demo.js";
import playgroundRouter from "./routes/playground.js";
import complianceRouter from "./routes/compliance.js";
import { requestIdMiddleware } from "./middleware/tenantAuth.js";
import { ensureDefaultOrganization } from "./services/db.js";
const app = express();
const PORT = parseInt(process.env.PORT || "4000", 10);
// Global Middlewares
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "15mb" }));
app.use(requestIdMiddleware);
// Health check (public)
app.get("/api/v1/health", (_req, res) => {
    res.json({
        status: "ok",
        service: "veritasai",
        version: "2.0.0",
        timestamp: new Date().toISOString(),
    });
});
// Mounted Routes
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/agents", agentsRouter);
app.use("/api/v1/decisions", decisionsRouter);
app.use("/api/v1/events", eventsRouter);
app.use("/api/v1/audit", auditRouter);
app.use("/api/v1/demo", demoRouter);
app.use("/api/v1/playground", playgroundRouter);
app.use("/api/v1/compliance", complianceRouter);
// Start server and initialize default organization
app.listen(PORT, async () => {
    try {
        await ensureDefaultOrganization();
    }
    catch (err) {
        console.error("[VeritasAI] Startup database sync notice:", err);
    }
    console.log(`
╔═════════════════════════════════════════════════════════════════╗
║                                                                 ║
║   VeritasAI — AI Agent Verification, Audit & Observability     ║
║   Listening on http://localhost:${PORT}                            ║
║                                                                 ║
║   API Endpoints (/api/v1):                                      ║
║     POST /auth/register          Register organization          ║
║     POST /auth/login             Login to organization          ║
║     GET  /auth/me                Get user & org profile         ║
║     GET  /auth/stats             Organization-wide analytics    ║
║     GET  /agents                 List organization agents       ║
║     POST /agents                 Register new agent & API key   ║
║     POST /agents/:id/credentials Generate additional key        ║
║     POST /agents/:id/credentials/:cId/rotate Rotate API key     ║
║     POST /decisions              Ingest AI decision (SDK/API)   ║
║     GET  /events                 List searchable event stream   ║
║     POST /events/:id/verify      Verify 7 cryptographic domains ║
║     GET  /audit                  List immutable audit trails    ║
║                                                                 ║
╚═════════════════════════════════════════════════════════════════╝
  `);
});
export default app;
