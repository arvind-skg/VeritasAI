/**
 * Agent routes — register and list agents.
 */
import { Router, type Request, type Response } from "express";
import { createAgent, listAgents } from "../services/db.js";

const router = Router();

/**
 * POST /api/v1/agents
 * Register a new agent. Returns agentId + apiKey.
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const { name } = req.body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      res.status(400).json({ error: "Agent name is required" });
      return;
    }

    const agent = await createAgent(name.trim());
    res.status(201).json(agent);
  } catch (err) {
    console.error("[VeritasAI] POST /agents error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/v1/agents
 * List all registered agents.
 */
router.get("/", async (_req: Request, res: Response) => {
  try {
    const agents = await listAgents();
    res.json({ agents });
  } catch (err) {
    console.error("[VeritasAI] GET /agents error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
