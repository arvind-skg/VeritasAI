/**
 * VeritasAI Backend — Express server entry point.
 *
 * Mounts the REST API at /api/v1 and starts listening.
 */
import "dotenv/config";
import express from "express";
import cors from "cors";
import eventsRouter from "./routes/events.js";
import agentsRouter from "./routes/agents.js";
import demoRouter from "./routes/demo.js";
import { authMiddleware } from "./middleware/auth.js";

const app = express();
const PORT = parseInt(process.env.PORT || "4000", 10);

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Health check (public)
app.get("/api/v1/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "veritasai",
    timestamp: new Date().toISOString(),
  });
});

// Protect all other routes
app.use(authMiddleware);

// Routes
app.use("/api/v1/events", eventsRouter);
app.use("/api/v1/agents", agentsRouter);
app.use("/api/v1/demo", demoRouter);

// Start server
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════╗
║                                                  ║
║   VeritasAI Backend — M2 Persistence             ║
║   Listening on http://localhost:${PORT}             ║
║                                                  ║
║   Routes:                                        ║
║     POST /api/v1/agents          Register agent  ║
║     GET  /api/v1/agents          List agents     ║
║     POST /api/v1/events          Record event    ║
║     GET  /api/v1/events          List events     ║
║     GET  /api/v1/events/:id      Get event       ║
║     POST /api/v1/events/:id/verify  Verify       ║
║                                                  ║
╚══════════════════════════════════════════════════╝
  `);
});

export default app;
