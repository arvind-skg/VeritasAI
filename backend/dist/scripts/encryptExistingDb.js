/**
 * Migration Script: Encrypt Existing Database Records at Rest
 *
 * Scans SQLite tables (Agent, Event, AuditLog) for any unencrypted legacy plaintext
 * and encrypts them in-place using AES-256-GCM.
 */
import { PrismaClient } from "@prisma/client";
import { encryptData, isEncrypted } from "../services/security.js";
const prisma = new PrismaClient();
async function runMigration() {
    console.log("==================================================================");
    console.log("VeritasAI — In-Place Database Encryption at Rest Migration");
    console.log("Algorithm: AES-256-GCM (96-bit IV, 128-bit Auth Tag)");
    console.log("==================================================================\n");
    // 1. Migrate Agent API Keys
    console.log("[1/3] Scanning Agents for unencrypted API keys...");
    const agents = await prisma.agent.findMany({
        where: { apiKey: { not: null } },
    });
    let agentsEncrypted = 0;
    for (const agent of agents) {
        if (agent.apiKey && !isEncrypted(agent.apiKey)) {
            await prisma.agent.update({
                where: { id: agent.id },
                data: { apiKey: encryptData(agent.apiKey) },
            });
            agentsEncrypted++;
        }
    }
    console.log(`✓ Agents checked: ${agents.length}, encrypted in-place: ${agentsEncrypted}\n`);
    // 2. Migrate Events (inputJson, outputJson)
    console.log("[2/3] Scanning Decision Events for unencrypted payloads...");
    const events = await prisma.event.findMany();
    let eventsEncrypted = 0;
    for (const event of events) {
        let needsUpdate = false;
        const updateData = {};
        if (event.inputJson && !isEncrypted(event.inputJson)) {
            updateData.inputJson = encryptData(event.inputJson);
            needsUpdate = true;
        }
        if (event.outputJson && !isEncrypted(event.outputJson)) {
            updateData.outputJson = encryptData(event.outputJson);
            needsUpdate = true;
        }
        if (needsUpdate) {
            await prisma.event.update({
                where: { id: event.id },
                data: updateData,
            });
            eventsEncrypted++;
        }
    }
    console.log(`✓ Events checked: ${events.length}, encrypted in-place: ${eventsEncrypted}\n`);
    // 3. Migrate Audit Logs (detailsJson)
    console.log("[3/3] Scanning Audit Logs for unencrypted details...");
    const auditLogs = await prisma.auditLog.findMany();
    let logsEncrypted = 0;
    for (const log of auditLogs) {
        if (log.detailsJson && !isEncrypted(log.detailsJson)) {
            await prisma.auditLog.update({
                where: { id: log.id },
                data: { detailsJson: encryptData(log.detailsJson) },
            });
            logsEncrypted++;
        }
    }
    console.log(`✓ Audit logs checked: ${auditLogs.length}, encrypted in-place: ${logsEncrypted}\n`);
    console.log("==================================================================");
    console.log("🎉 Migration Complete! All database secrets are secured at rest.");
    console.log(`Total encrypted: ${agentsEncrypted} agents, ${eventsEncrypted} events, ${logsEncrypted} audit logs.`);
    console.log("==================================================================");
}
runMigration()
    .catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
