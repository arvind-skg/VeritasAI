/**
 * Migration Script: Migrate all legacy Agent.apiKey records to one-way SHA-256 AgentCredential records
 * and nullify Agent.apiKey so zero recoverable/raw API keys remain in the database.
 */
import { PrismaClient } from "@prisma/client";
import { hashApiKey, isEncrypted, decryptData } from "../services/security.js";

const prisma = new PrismaClient();

async function main() {
  console.log("==================================================================");
  console.log("VeritasAI — Hash-Only API Key Credential Migration");
  console.log("==================================================================");

  const agentsWithKeys = await prisma.agent.findMany({
    where: { apiKey: { not: null } },
    include: { credentials: true },
  });

  console.log(`Found ${agentsWithKeys.length} agents with legacy apiKey field populated.`);

  let migratedCount = 0;

  for (const agent of agentsWithKeys) {
    if (!agent.apiKey) continue;

    // Decrypt if encrypted, otherwise take plain
    let rawKey = agent.apiKey;
    if (isEncrypted(rawKey)) {
      rawKey = decryptData(rawKey);
    }
    const cleanKey = rawKey.trim();
    const hash = hashApiKey(cleanKey);

    // Check if an AgentCredential already exists with this hash
    const existingCred = agent.credentials.find((c) => c.keyHash === hash);

    if (!existingCred) {
      const keyPrefix = cleanKey.startsWith("vra_") ? cleanKey.substring(0, 9) : "vra_live_";
      const lastFour = cleanKey.length >= 4 ? cleanKey.slice(-4) : "0000";

      await prisma.agentCredential.create({
        data: {
          agentId: agent.id,
          name: "Migrated Key",
          keyPrefix,
          keyHash: hash,
          lastFour,
          status: "ACTIVE",
        },
      });
      console.log(`  ✓ Created hashed AgentCredential (SHA-256) for Agent "${agent.name}" (${agent.id})`);
    } else {
      console.log(`  ✓ Agent "${agent.name}" already has matching hashed AgentCredential (${existingCred.id})`);
    }

    // Safely nullify the legacy apiKey in Agent table
    await prisma.agent.update({
      where: { id: agent.id },
      data: { apiKey: null },
    });
    migratedCount++;
  }

  console.log(`\nSuccessfully migrated ${migratedCount} agents.`);
  console.log("All raw API keys in Agent.apiKey have been purged to null.");
  console.log("All credentials now reside strictly as one-way SHA-256 hashes in AgentCredential.");
  console.log("==================================================================");
}

main()
  .catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
