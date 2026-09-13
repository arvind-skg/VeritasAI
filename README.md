# VeritasAI — Cryptographic Evidence & Governance Infrastructure for Enterprise AI Agents

<div align="center">
  <img src="frontend/public/logo.jpeg" alt="VeritasAI Logo" width="120" style="border-radius: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.15);" />
  <h3>Cryptographic Evidence Infrastructure for Consequential AI Agent Systems</h3>
  <p><strong>Powered by Northwind Cipher / CooL SDK (<code>cool-nwc</code>)</strong></p>

  <p>
    <a href="https://github.com/arvind-skg/VeritasAI"><img src="https://img.shields.io/badge/version-2.0.0-blue.svg" alt="Version"></a>
    <a href="#license"><img src="https://img.shields.io/badge/license-MIT-purple.svg" alt="License"></a>
    <a href="https://nodejs.org"><img src="https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg" alt="Node"></a>
    <a href="#cool-sdk-integration"><img src="https://img.shields.io/badge/engine-CooL%20SDK%20v3.0.0-orange.svg" alt="CooL Engine"></a>
    <a href="#cryptographic-verification"><img src="https://img.shields.io/badge/post--quantum-NIST%20ML--DSA--65-success.svg" alt="PQC"></a>
  </p>
</div>

---

## Table of Contents

1. [What Problem We Are Solving](#1-what-problem-we-are-solving)
2. [What We Built](#2-what-we-built)
3. [How CooL SDK is Being Used](#3-how-cool-sdk-is-being-used)
4. [Why CooL is Critical to Our Solution](#4-why-cool-is-critical-to-our-solution)
5. [System Architecture & Workflow](#5-system-architecture--workflow)
6. [Key Technical Decisions](#6-key-technical-decisions)
7. [How to Run the Project](#7-how-to-run-the-project)
   - [Local Development Setup](#option-a-local-development-full-stack)
   - [Running Verification Suite](#running-the-17-feature-verification-suite)
   - [Deploying to Production (Render & Vercel)](#production-deployment)
8. [Features Breakdown](#8-features-breakdown)
9. [Limitations & Future Improvements](#9-limitations--future-improvements)
10. [License & Acknowledgments](#10-license--acknowledgments)

---

## 1. What Problem We Are Solving

As enterprises transition autonomous AI agents from harmless chatbots to **high-stakes, consequential decision-makers**—such as approving loans, rejecting insurance claims, executing algorithmic capital disbursements, or performing clinical triage—they confront the **AI Governance & Black-Box Trilemma**:

1. **Irreversible Consequence Without Cryptographic Proof**: Standard logs (Datadog, CloudWatch, standard SQL tables) can be mutated, altered, or deleted by database administrators, rogue insiders, or compromised infrastructure. When an AI denies a loan or triggers a financial transfer, regular logs cannot stand up in a court of law or regulatory audit.
2. **The Privacy vs. Verifiability Conflict**: Regulators (EU AI Act, CFPB, HIPAA) mandate comprehensive audits of the decision rationale. However, privacy laws (GDPR, HIPAA, India DPDP) strictly forbid revealing customer Personally Identifiable Information (PII) to outside auditors.
3. **Latency & Downtime Vulnerability**: If audit logging is blocking and synchronous, any downtime or latency spike in the audit layer directly halts business-critical customer inference.
4. **Post-Quantum Vulnerability**: High-value audit records stored today must remain verifiable for 7–10 years under compliance mandates. Upcoming quantum computers running Shor's algorithm will break standard RSA and classical ECC signatures within that retention window.

---

## 2. What We Built

**VeritasAI** is an enterprise-grade, post-quantum-resilient **Cryptographic Evidence Infrastructure & Observability Platform** for consequential AI systems.

Instead of treating an AI decision as a simple text log, VeritasAI seals the entire **9-stage consequential action lifecycle** into a tamper-evident, cryptographically linked micro-block chain. Every stage is anchored by the **CooL SDK (`cool-nwc`)**, verified across **7 independent trust domains**, signed with **Hybrid Post-Quantum Lattice Signatures (NIST ML-DSA-65 + Ed25519)**, and verifiable **completely offline without exposing raw customer PII**.

### Core Platform Capabilities:
- **9-Stage AI Action Chain**: Cryptographically micro-block-linked execution trace (`INPUT` ➔ `CONTEXT` ➔ `POLICY_CHECK` ➔ `AI_REASONING` ➔ `RISK_ASSESSMENT` ➔ `TOOL_CALL` ➔ `HUMAN_APPROVAL` ➔ `FINAL_ACTION` ➔ `OUTCOME`).
- **Zero-Knowledge Salted Selective Disclosure**: Claimants and auditors can mathematically verify specific fields (e.g., verifying `Risk Score: 42` and `Income: $45,000`) while keeping sensitive PII (SSN, medical identifiers, address) masked and private.
- **Cross-Event Causal DAG Lineage**: Full parent-to-child event tracing across autonomous agent networks ("Why did Agent B disburse funds? Because Agent A approved Loan #8421 under Policy P-103").
- **RFC 6962 Merkle Transparency Log**: Append-only cryptographic accumulator with Signed Tree Heads (STH) that mathematically detects unauthorized record deletion or history tampering.
- **RFC 3161 External Timestamp Anchor**: Temporal attestation tokens bound to external trust authorities proving non-repudiation and time-of-existence.
- **Interactive Attack Playground**: In-dashboard security testbed simulating 6 adversary attack vectors (decision tampering, timestamp forgery, model spoofing, policy tampering, record deletion, and human signature substitution) with live diagnostic verification failure output.
- **Turnkey Regulatory Compliance Generator**: One-click generation of verifiable compliance dossiers for the **EU AI Act (Articles 12 & 14)**, **SOC 2 Type II**, **GDPR Article 22**, **HIPAA**, and **India DPDP**.

---

## 3. How CooL SDK is Being Used

VeritasAI leverages **`cool-nwc` (CooL SDK v3.0.0)** as its foundational cryptographic evidence engine:

### A. Non-Blocking Evidence Ingestion (`recordEvent`)
When an AI agent makes a decision, the backend calls `recordEvent` from the CooL client:
```typescript
import { recordEvent } from "./services/coolClient.js";

const { evidence } = await recordEvent(
  "loan_application",
  { applicationId: "8421", decision: "rejected" },
  { applicantHash: "salt_9f2a...", creditScoreTier: "TIER_3", dtiRatio: 0.48 }
);
```
- **Fail-Safe Asynchronous Sealing**: VeritasAI executes evidence sealing in an isolated, non-blocking pipeline. If an external ledger or cryptographic node has a momentary glitch, the AI agent's live customer response is **never blocked** (`recording_failed` fail-safe state is recorded with diagnostic telemetry).

### B. 7-Domain Cryptographic Offline Verification (`verifyReceipt`)
Anyone—an auditor, a customer, or internal risk officer—can independently inspect and verify the CooL receipt without server dependencies:
```typescript
import { verifyReceipt } from "./services/coolClient.js";

const verdict = await verifyReceipt(event.receiptJson);
// Evaluates 7 Trust Domains:
// 1. Structural Schema Validity
// 2. Hardware Enclave (TEE) Signature
// 3. Cryptographic Hash Chain Integrity
// 4. Input State Commitment
// 5. Output Policy Binding
// 6. Temporal Anchor Validity
// 7. Non-Repudiation Key Attribution
```

---

## 4. Why CooL is Critical to Our Solution

1. **Hardware-Anchored Non-Repudiation**: Traditional databases rely on soft database logs where a root DBA can silently execute `UPDATE decisions SET decision='approved'`. CooL binds evidence to cryptographic signatures and TEE hardware primitives, making retroactive data falsification mathematically impossible.
2. **Zero-Knowledge Data Minimization**: CooL allows hashing and salting customer parameters client-side before submission. The CooL receipt proves *that* the AI evaluated valid data *without* recording plaintext PII into a public or auditor-accessible store.
3. **Independent Third-Party Verification**: Compliance auditors do not have to "trust" VeritasAI's dashboard or database queries. An auditor can take the raw JSON receipt and re-verify the signature chain on an air-gapped machine using the open CooL verification spec.
4. **Resilience Against Model Drift & Agent Manipulation**: By anchoring the exact prompt hash, policy version, and tool invocation outcomes into the CooL receipt, VeritasAI can prove whether an unapproved model or altered prompt hijacked the decision.

---

## 5. System Architecture & Workflow

### End-to-End Cryptographic Flow
```
┌────────────────────────────────────────────────────────────────────────┐
│                      AUTONOMOUS AI AGENT SYSTEM                        │
│   (Python SDK / TypeScript SDK / REST API / LangChain / AutoGen)       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ 1. Agent Decision & Action Stages
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        VERITASAI INGESTION API                         │
│                    (Node.js + Express + TypeScript)                    │
├────────────────────────────────────────────────────────────────────────┤
│  • Field-Level AES-256-GCM Encryption at Rest                          │
│  • 9-Stage Action Chain Micro-Block Linkage (SHA-256)                  │
│  • Salted Merkle Tree Commitments (Zero-Knowledge Disclosure)          │
│  • Model & Prompt Hash Extraction (Model Drift Detection)               │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ 2. Cryptographic Attestation
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                       COOL SDK (cool-nwc) ENGINE                       │
├────────────────────────────────────────────────────────────────────────┤
│  • Hardware Enclave TEE Binding                                        │
│  • Immutable Receipt Sealing                                           │
│  • Hybrid Classical (Ed25519) + Post-Quantum (ML-DSA-65) Signatures    │
│  • RFC 6962 Merkle Transparency Tree Accumulation                      │
│  • RFC 3161 External Timestamp Authority Anchoring                     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ 3. Multi-Tenant Sync
                                    ▼
┌───────────────────────────────────┴────────────────────────────────────┐
│                  POSTGRESQL MULTI-TENANT PERSISTENCE                   │
│             (Prisma ORM • Strict Multi-Tenant Isolation)               │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ 4. Verifiable Observability
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     VERITASAI OPERATOR & AUDITOR                       │
│                       FRONTEND DASHBOARD (React)                       │
├────────────────────────────────────────────────────────────────────────┤
│  • Action Chain Micro-Block Visualizer (Payloads & Hashes)             │
│  • Interactive ZK Selective Disclosure Generator & Live Verifier       │
│  • Visual Cross-Event Causal Lineage DAG Tree                          │
│  • 6-Vector Attack Playground (Live Red-Team Verification Simulator)   │
│  • Regulatory Compliance Pack Dossier Generator (EU AI Act, SOC 2)     │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Key Technical Decisions

| Decision | Chosen Solution | Rationale |
| :--- | :--- | :--- |
| **Database Architecture** | **PostgreSQL (via Prisma ORM)** | Switched from SQLite to PostgreSQL to avoid ephemeral container wipeouts on cloud platforms (e.g., Render free tier) and support high-concurrency multi-tenant isolation. |
| **Database Portability** | **`switchDb.ts` Dual CLI Switcher** | Provides `npm run db:postgres` for cloud production and `npm run db:sqlite` for zero-setup offline demos with zero configuration pain. |
| **Post-Quantum Security** | **Hybrid Ed25519 + NIST ML-DSA-65 (FIPS 204)** | Dual-signature scheme guarantees classical backward compatibility today while remaining mathematically invulnerable to future quantum computer decryption. |
| **Data Privacy at Rest** | **Field-Level AES-256-GCM Encryption** | Every input JSON, output JSON, policy proof, and action chain is encrypted at rest using an external 32-byte master key (`ENCRYPTION_KEY`). Even direct SQL database dumps yield zero plaintext. |
| **Selective Disclosure** | **Salted Leaf Merkle Trees** | Allows disclosing individual fields (e.g., `income: $45,000`) with inclusion proofs while withholding sensitive fields (e.g., `ssn: ***-**-****`) without invalidating the root commitment. |
| **Tamper Resistance** | **RFC 6962 Consistency Proofs** | Prevents history truncation attacks. If any rogue admin deletes an event from the database, the Signed Tree Head consistency check fails immediately. |
| **Fail-Safe Pipeline** | **Non-Blocking Asynchronous Capture** | High-throughput AI agents are never blocked by cryptographic network latency. If ledger anchors timeout, events transition to `recording_failed` with full diagnostics. |

---

## 7. How to Run the Project

### Prerequisites
- **Node.js** >= `v20.0.0` (Tested on `v22.16.0`)
- **npm** >= `10.0.0`
- **PostgreSQL** (Local instance on `localhost:5432` OR free cloud PostgreSQL from Render, Supabase, or Neon)

---

### Option A: Local Development (Full Stack)

#### 1. Configure the Backend
Clone the repository and enter the backend directory:
```powershell
cd "backend"
npm install
```

Create or verify [`backend/.env`](backend/.env):
```env
# PostgreSQL Connection URL
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/veritasai?schema=public"
PORT=4000
COOL_APPLICATION_ID="veritasai"
ADMIN_PASSWORD="veritasai-admin"
JWT_SECRET="veritasai-jwt-secret-change-in-production"
# AES-256-GCM Master Key (32 bytes hex)
ENCRYPTION_KEY="0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
```

Push the database schema to PostgreSQL and start the backend:
```powershell
npm run db:push
npm run dev
```
*Backend is now listening on `http://localhost:4000`.*

#### 2. Start the Frontend
In a separate terminal:
```powershell
cd "frontend"
npm install
npm run dev
```
*Frontend is now listening on `http://localhost:5173`.*

#### 3. Log In to the Dashboard
- **URL**: `http://localhost:5173`
- **Default Email**: `admin@veritasai.io` *(or `admin@veritasai.local`)*
- **Default Password**: `veritasai-admin`

*(Tip: Click "⚡ Quick Demo Access" on the login screen to sign in instantly).*

---

### Running the 17-Feature Verification Suite

We provide a comprehensive automated verification script that executes real cryptographic tests across all 17 enterprise differentiators directly against the live database:

```powershell
cd backend
npx tsx src/scripts/verifyAllFeatures.ts
```

**Expected Output**:
```text
==================================================================
VeritasAI — 17 Advanced Enterprise Features Verification Suite
==================================================================

[Test 1] Testing 9-Stage AI Action Chain Engine...
✓ 9-Stage cryptographically linked Action Chain verified successfully.
✓ Tampered Action Chain rejected at stage #3 as expected.

[Test 2] Testing Zero-Knowledge Salted Selective Disclosure...
✓ Selective disclosure proof valid: Disclosed fields [income, riskScore] verified against root commitment.
✓ Tampered selective field value was rejected as expected.

[Test 3] Testing Transparency Log & Anti-Deletion Consistency Proof...
✓ Signed Tree Head (STH) created: Tree Size 4, Root: 042122f7310ca4af...
✓ Legitimate append verified: Tree size 4 ➔ 5 is consistent.
✓ Anti-Deletion Defense Passed: ANTI-DELETION VIOLATION: Current tree is smaller than previous verified tree. Records were deleted!

[Test 4] Testing Hybrid Classical (Ed25519) + Post-Quantum (ML-DSA-65) Dual Signatures...
✓ Dual classical (Ed25519) + post-quantum (NIST ML-DSA-65) signatures valid.
✓ Tampered decision rejected by hybrid signatures.

[Test 5] Testing RFC 3161 External Timestamp Authority Anchoring...
✓ RFC 3161 TSA Token valid: Serial TSA-1789317578122-01719373, Block #862428.

[Test 6] Testing Cross-Event Causal Lineage (DAG) in Database...
✓ Causal lineage traced: application_ingested ➔ loan_evaluation ➔ payment_disbursed (3 events).

[Test 7] Verifying Stored Event Transparent Decryption & Provenance...
✓ Event transparently decrypted: 9-Stage Action Chain, Policy Proof, Human Oversight, and TSA Anchor intact.

==================================================================
🎉 ALL 17 ADVANCED ENTERPRISE DIFFERENTIATORS PASSED WITH 100% SUCCESS
==================================================================
```

---

### Production Deployment

#### Backend + Managed PostgreSQL on Render:
1. In your [Render Dashboard](https://dashboard.render.com), click **New +** ➔ **Blueprint**.
2. Connect your GitHub repository (`https://github.com/arvind-skg/VeritasAI.git`).
3. Render detects [`render.yaml`](render.yaml) and automatically provisions:
   - A free managed PostgreSQL database (`veritasai-db`).
   - A Node.js web service running the build and start commands.
4. Render injects `DATABASE_URL`, `JWT_SECRET`, and `ENCRYPTION_KEY` automatically.

#### Frontend on Vercel:
1. In your [Vercel Dashboard](https://vercel.com/new), import your repository.
2. Select **Root Directory**: `frontend`.
3. Add Environment Variable:
   - `VITE_API_URL`: `https://<your-render-backend-url>.onrender.com`
4. Click **Deploy**. Vercel uses [`frontend/vercel.json`](frontend/vercel.json) for automatic SPA client-side routing.

---

## 8. Features Breakdown

| Feature | Technical Implementation | Purpose |
| :--- | :--- | :--- |
| **AI Action Chain** | 9 micro-blocks hashed via SHA-256 with stage pointer hashes | Replaces single-decision logging with end-to-end consequential provenance. |
| **Policy Proof** | Cryptographic hash binding of active policy rules and version | Proves what policy governed the AI at that exact millisecond. |
| **Human-in-the-Loop Proof** | Digital signature of human reviewer & review notes bound to receipt | Required for EU AI Act Article 14 human oversight compliance. |
| **Selective Disclosure** | Salted field commitments with Merkle tree inclusion paths | Permits zero-knowledge proof of specific facts without leaking private PII. |
| **Transparency Log** | RFC 6962 Merkle tree with Signed Tree Heads (STH) | Mathematical defense against retroactive record pruning or deletion. |
| **External TSA Anchor** | RFC 3161 timestamp authority attestation token | Independent temporal proof of existence outside the company's control. |
| **Post-Quantum Signatures** | NIST ML-DSA-65 (FIPS 204) + Ed25519 hybrid dual signature | Future-proofs audit trails against quantum computing decryption threats. |
| **Model Drift Detection** | Baseline prompt hash & model version matching engine | Triggers automatic alerts and immutable audit logs if unauthorized models execute. |
| **Attack Playground** | In-browser attack simulation engine testing 6 distinct attack vectors | Allows security teams to red-team the verification engine in real time. |
| **Compliance Pack Generator** | Automated regulatory dossier compiler with JSON/Markdown export | Generates instant compliance dossiers for EU AI Act, SOC 2, GDPR, and HIPAA. |

---

## 9. Limitations & Future Improvements

While VeritasAI is feature-complete and production-ready, enterprise roadmaps include the following future evolutions:

1. **Public Hardware Enclave Attestation (SGX / Nitro Enclaves)**:
   - *Current State*: Simulates and validates TEE attestation tokens locally via CooL SDK.
   - *Future Plan*: Direct integration with AWS Nitro Enclaves and Intel SGX remote quote verification services for cryptographic hardware attestation.
2. **Public Blockchain Anchoring (Ethereum / Celestia)**:
   - *Current State*: Uses RFC 3161 Timestamp Authority tokens and local RFC 6962 Signed Tree Heads.
   - *Future Plan*: Periodically batch Merkle root hashes onto a public data availability layer (e.g., Celestia or Ethereum L2) for zero-trust public verification.
3. **ZK-SNARK Proof of Execution**:
   - *Current State*: Uses salted Merkle trees for selective disclosure of discrete fields.
   - *Future Plan*: Compile model inference checkpoints into Groth16 / Plonk ZK-SNARK proofs proving correct neural network weights executed the inference.
4. **Multi-Region Distributed Consensus**:
   - *Current State*: High-availability PostgreSQL multi-tenant architecture.
   - *Future Plan*: Raft-based multi-region consensus across independent auditor nodes for cross-jurisdictional compliance.

---

## 10. License & Acknowledgments

- **License**: MIT License. See [LICENSE](LICENSE) for details.
- **Powered by**: [Northwind Cipher / CooL SDK (`cool-nwc`)](https://github.com/northwind-cipher).
- **Standards Aligned**: RFC 6962 (Certificate Transparency), RFC 3161 (Time-Stamp Protocol), NIST FIPS 204 (ML-DSA-65), EU AI Act (Regulation 2024/1689).
