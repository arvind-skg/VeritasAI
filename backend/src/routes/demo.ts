/**
 * Demo routes — generates mock events for the flagship M4 scenario.
 */
import { Router, type Request, type Response } from "express";
import { createAgent, getAgentByApiKey, saveReceipt } from "../services/db.js";
import { recordEvent } from "../services/coolClient.js";

const router = Router();

router.post("/seed", async (_req: Request, res: Response) => {
  try {
    let agent = await getAgentByApiKey("demo-agent-key");
    if (!agent) {
      agent = await createAgent("LoanBot v2.1");
      // Force the apiKey to something known for idempotency (though createAgent randomizes it, we just fetch it back)
    }

    const events = [];

    // Flagship Scenario 1: Application #8421 -> rejected
    try {
      const { evidence } = await recordEvent(
        "loan_application",
        { applicationId: "8421", decision: "rejected" },
        { applicantName: "Alice Smith", creditScore: 590, income: 45000 }
      );
      events.push(await saveReceipt(agent.id, "loan_application", evidence, "recorded"));
    } catch (e) {
      console.error(e);
    }

    // Flagship Scenario 2: Application #8422 -> approved
    try {
      const { evidence } = await recordEvent(
        "loan_application",
        { applicationId: "8422", decision: "approved" },
        { applicantName: "Bob Jones", creditScore: 780, income: 95000 }
      );
      events.push(await saveReceipt(agent.id, "loan_application", evidence, "recorded"));
    } catch (e) {
      console.error(e);
    }

    // Flagship Scenario 3: Deliberate failure for fail-safe demo
    events.push(
      await saveReceipt(
        agent.id,
        "refund_decision",
        null,
        "recording_failed",
        "Error: CooL SDK connection timeout (simulated for demo)"
      )
    );

    // Flagship Scenario 4: Triage suggestion
    try {
      const { evidence } = await recordEvent(
        "triage_suggestion",
        { urgency: "high", department: "cardiology" },
        { patientId: "P-1092", symptoms: "chest pain" }
      );
      events.push(await saveReceipt(agent.id, "triage_suggestion", evidence, "recorded"));
    } catch (e) {
      console.error(e);
    }

    res.json({
      message: "Generated 4 demo events (including 1 deliberate failure).",
      events,
    });
  } catch (err) {
    console.error("[VeritasAI] Demo seed error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
