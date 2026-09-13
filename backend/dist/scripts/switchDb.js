/**
 * Database Provider Switcher for VeritasAI
 * Allows switching between PostgreSQL (Render, Supabase, AWS RDS, Neon, Local PG)
 * and SQLite (Zero-dependency local development).
 *
 * Usage:
 *   npx tsx src/scripts/switchDb.ts postgres
 *   npx tsx src/scripts/switchDb.ts sqlite
 */
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const target = process.argv[2]?.toLowerCase();
if (!["postgres", "postgresql", "sqlite"].includes(target || "")) {
    console.log("Usage: npx tsx src/scripts/switchDb.ts [postgres|sqlite]");
    process.exit(1);
}
const isPostgres = target === "postgres" || target === "postgresql";
const provider = isPostgres ? "postgresql" : "sqlite";
const schemaPath = path.resolve(__dirname, "../../prisma/schema.prisma");
let schema = fs.readFileSync(schemaPath, "utf-8");
// Replace datasource provider
schema = schema.replace(/datasource\s+db\s*\{[^}]*provider\s*=\s*"[^"]*"[^}]*\}/s, `datasource db {\n  provider = "${provider}"\n  url      = env("DATABASE_URL")\n}`);
fs.writeFileSync(schemaPath, schema, "utf-8");
console.log(`\x1b[32m✔ Updated prisma/schema.prisma provider to: ${provider}\x1b[0m`);
try {
    console.log("Generating Prisma client...");
    execSync("npx prisma generate", { stdio: "inherit", cwd: path.resolve(__dirname, "../..") });
    console.log(`\x1b[32m✔ Prisma Client successfully regenerated for ${provider}!\x1b[0m`);
}
catch (err) {
    console.error("Failed to generate Prisma client:", err);
    process.exit(1);
}
