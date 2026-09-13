/**
 * Demo routes — generates mock events for the flagship M4 scenario.
 */
import { Router } from "express";
import { createAgent, getAgentByApiKey, saveReceipt, ensureDefaultOrganization, createAuditLog } from "../services/db.js";
import { recordEvent } from "../services/coolClient.js";
const router = Router();
router.post("/seed", async (_req, res) => {
    try {
        const org = await ensureDefaultOrganization();
        let agent = await getAgentByApiKey("demo-agent-key");
        if (!agent) {
            const res = await createAgent(org.id, { name: "LoanBot v2.1", type: "LOAN_APPROVAL" });
            agent = res.agent;
        }
        const events = [];
        // Flagship Scenario 1: Application #8421 -> rejected
        try {
            const { evidence } = await recordEvent("loan_application", { applicationId: "8421", decision: "rejected" }, { applicantName: "Alice Smith", creditScore: 590, income: 45000 });
            events.push(await saveReceipt(agent.id, "loan_application", evidence, "recorded"));
        }
        catch (e) {
            console.error(e);
        }
        // Flagship Scenario 2: Application #8422 -> approved
        try {
            const { evidence } = await recordEvent("loan_application", { applicationId: "8422", decision: "approved" }, { applicantName: "Bob Jones", creditScore: 780, income: 95000 });
            events.push(await saveReceipt(agent.id, "loan_application", evidence, "recorded"));
        }
        catch (e) {
            console.error(e);
        }
        // Flagship Scenario 3: Deliberate failure for fail-safe demo
        events.push(await saveReceipt(agent.id, "refund_decision", null, "recording_failed", "Error: CooL SDK connection timeout (simulated for demo)"));
        // Flagship Scenario 4: Triage suggestion
        try {
            const { evidence } = await recordEvent("triage_suggestion", { urgency: "high", department: "cardiology" }, { patientId: "P-1092", symptoms: "chest pain" });
            events.push(await saveReceipt(agent.id, "triage_suggestion", evidence, "recorded"));
        }
        catch (e) {
            console.error(e);
        }
        // Record audit log for demo simulation
        await createAuditLog(org.id, "DEMO_SIMULATION_SEEDED", "ORGANIZATION", org.id, undefined, {
            scenarioCount: events.length,
            scenarios: ["Loan #8421 (Rejected)", "Loan #8422 (Approved)", "Refund Timeout (Fail-Safe)", "Cardiology Triage"],
        }).catch((e) => console.warn("[VeritasAI] Demo audit log skipped:", e));
        res.json({
            message: "Generated 4 demo events (including 1 deliberate failure).",
            events,
        });
    }
    catch (err) {
        console.error("[VeritasAI] Demo seed error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
export default router;
