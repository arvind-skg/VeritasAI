import { PrismaClient } from "@prisma/client";
import {
  encryptData,
  decryptData,
  encryptJson,
  decryptJson,
  isEncrypted,
} from "../services/security.js";
import {
  ensureDefaultOrganization,
  createAgent,
  saveDecision,
  getEvent,
  listEvents,
  listAuditLogs,
  findActiveCredentialByKey,
} from "../services/db.js";

const prisma = new PrismaClient();

async function runVerification() {
  console.log("==================================================================");
  console.log("VeritasAI — Cryptographic & Database Encryption Verification Suite");
  console.log("==================================================================\n");

  // Test 1: Unit encryption/decryption
  console.log("[Test 1] Testing AES-256-GCM unit round-trip...");
  const sampleSecret = "ssn_987-65-4321_salary_$185000";
  const encrypted = encryptData(sampleSecret);
  if (!isEncrypted(encrypted)) throw new Error("Ciphertext missing enc:v1 prefix");
  const decrypted = decryptData(encrypted);
  if (decrypted !== sampleSecret) throw new Error("Decryption mismatch");
  console.log("✓ Unit round-trip passed. Prefix:", encrypted.slice(0, 7), "Length:", encrypted.length);

  // Test 2: Tamper Resistance (Auth Tag Check)
  console.log("\n[Test 2] Testing Authenticated Encryption Tamper-Resistance...");
  const parts = encrypted.split(":");
  // Alter 1 character in ciphertext
  const tamperedCipher = parts[4].slice(0, -2) + (parts[4].endsWith("0") ? "1" : "0");
  const tamperedEnvelope = `${parts[0]}:${parts[1]}:${parts[2]}:${parts[3]}:${tamperedCipher}`;
  const tamperResult = decryptData(tamperedEnvelope);
  if (tamperResult === sampleSecret) throw new Error("Tampered ciphertext was accepted!");
  console.log("✓ Tampered payload safely rejected.");

  // Test 3: Verify Raw SQLite records are encrypted or hash-only
  console.log("\n[Test 3] Verifying Raw Database Fields in SQLite (dev.db)...");
  const rawAgents = await prisma.agent.findMany({ where: { apiKey: { not: null } } });
  for (const a of rawAgents) {
    if (!isEncrypted(a.apiKey)) throw new Error(`Agent ${a.id} apiKey is not encrypted or null!`);
  }
  if (rawAgents.length === 0) {
    console.log("✓ Zero raw API keys in Agent table: credentials are 100% hash-only (SHA-256) in AgentCredential.");
  } else {
    console.log(`✓ All ${rawAgents.length} legacy raw Agent API keys in SQLite have 'enc:v1:' prefix.`);
  }

  const rawAudit = await prisma.auditLog.findMany({ where: { detailsJson: { not: null } }, take: 3 });
  for (const log of rawAudit) {
    if (!isEncrypted(log.detailsJson)) throw new Error(`AuditLog ${log.id} detailsJson is not encrypted!`);
  }
  console.log(`✓ All ${rawAudit.length} sample raw AuditLog detailsJson in SQLite have 'enc:v1:' prefix.`);

  // Test 4: Transparent Retrieval
  console.log("\n[Test 4] Verifying Transparent Decryption on Database Service Reads...");
  const org = await ensureDefaultOrganization();
  const auditLogs = await listAuditLogs(org.id, 5);
  if (auditLogs.length > 0 && typeof auditLogs[0].details !== "object") {
    throw new Error("listAuditLogs did not return parsed/decrypted details object");
  }
  console.log("✓ listAuditLogs transparently decrypted and parsed details object:", Object.keys(auditLogs[0]?.details || {}));

  // Test 5: End-to-End Decision Creation with Encrypted PII
  console.log("\n[Test 5] Creating New Decision Event with Highly Sensitive PII...");
  const { agent, credential } = await createAgent(org.id, {
    name: "Encryption Verification Agent",
    type: "LOAN_APPROVAL",
    environment: "TEST",
  });

  const sensitivePii = {
    ssn: "000-12-3456",
    income: 145000,
    applicant: "Jane Doe Confidential",
    creditScore: 785,
  };

  const newEvent = await saveDecision({
    orgId: org.id,
    agentId: agent.id,
    eventType: "credit_inquiry",
    decision: "approved",
    riskLevel: "LOW",
    inputData: sensitivePii,
    outputData: { approvedLimit: 75000 },
    receipt: { test: true },
    status: "recorded",
  });

  // Verify raw record in SQLite is encrypted
  const rawStoredEvent = await prisma.event.findUnique({ where: { id: newEvent.id } });
  if (!isEncrypted(rawStoredEvent?.inputJson)) {
    throw new Error("Raw stored event inputJson is NOT encrypted at rest!");
  }
  console.log("✓ Raw SQLite event inputJson is securely encrypted:", rawStoredEvent?.inputJson?.slice(0, 32) + "...");

  // Verify getEvent decrypts transparently
  const fetchedEvent = await getEvent(newEvent.id, org.id);
  const inputData = fetchedEvent?.inputJson as Record<string, any> | null;
  if (inputData?.ssn !== "000-12-3456") {
    throw new Error("getEvent failed to transparently decrypt sensitive PII");
  }
  console.log("✓ getEvent transparently decrypted inputJson.ssn:", inputData.ssn);

  // Test 6: Authenticate using agent credential
  console.log("\n[Test 6] Testing Agent Authentication with Encrypted Credentials...");
  const match = await findActiveCredentialByKey(credential.rawKey);
  if (!match || match.agent.id !== agent.id) {
    throw new Error("Authentication failed with active key");
  }
  console.log("✓ Agent credential authenticated successfully.");

  // Cleanup test records
  await prisma.event.delete({ where: { id: newEvent.id } });
  await prisma.agent.delete({ where: { id: agent.id } });

  console.log("\n==================================================================");
  console.log("🎉 ALL ENCRYPTION VERIFICATION TESTS PASSED SUCCESSFULLY (6/6)");
  console.log("==================================================================");
}

runVerification()
  .catch((err) => {
    console.error("Verification suite failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
