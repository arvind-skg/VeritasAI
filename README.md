# VeritasAI

Cryptographic evidence and governance infrastructure for autonomous, consequential AI agent systems,powered by the Northwind Cipher CooL SDK (`cool-nwc`).

---

## 1. What Problem You Are Solving

Autonomous AI agents are increasingly making high-stakes, irreversible decisions: approving loans, rejecting insurance claims, executing capital disbursements, and performing clinical triage. This introduces critical operational and regulatory challenges:

- **Lack of Cryptographic Non-Repudiation**: Standard application and database logs (PostgreSQL rows, CloudWatch, Datadog) are mutable. Privileged users, database administrators, or attackers with root access can modify or delete records after the fact. Traditional logs cannot serve as mathematically undeniable evidence in a court or regulatory audit.
- **The Privacy vs. Auditability Conflict**: Regulations like the EU AI Act (Articles 12 & 14) mandate detailed inspection of algorithmic decisions. At the same time, privacy statutes (GDPR, HIPAA, India DPDP) forbid exposing customer Personally Identifiable Information (PII). Organizations struggle to prove compliance without violating customer privacy.
- **Latency and Fail-Safe Risk**: Synchronous ledger calls during AI inference introduce latency spikes and risk blocking consumer transactions if the attestation network is temporarily unavailable.
- **Post-Quantum Vulnerability**: Mandated compliance records must be preserved for 7 to 10 years. Classical signatures (RSA, ECDSA) will be vulnerable to quantum computing attacks within this retention window.

---

## 2. What You Built

**VeritasAI** is an enterprise cryptographic evidence and observability platform that transforms every consequential AI action into an immutable, verifiable proof receipt.

Key capabilities:
- **9-Stage AI Action Chain**: Cryptographically links the entire execution lifecycle (`INPUT` -> `CONTEXT` -> `POLICY_CHECK` -> `AI_REASONING` -> `RISK_ASSESSMENT` -> `TOOL_CALL` -> `HUMAN_APPROVAL` -> `FINAL_ACTION` -> `OUTCOME`) via SHA-256 micro-blocks.
- **Zero-Knowledge Salted Selective Disclosure**: Uses leaf-salted Merkle tree commitments so claimants or auditors can verify specific decision parameters (e.g., credit score tier, debt ratio) without disclosing sensitive personal identifiers.
- **Cross-Event Causal Lineage (DAG)**: Tracks multi-agent parent-child dependencies across distributed workflows.
- **RFC 6962 Merkle Transparency Log**: Append-only log with Signed Tree Heads (STH) and consistency proofs that detect retroactive record deletion or truncation.
- **Hybrid Post-Quantum Lattice Signatures**: Dual digital signatures combining classical Ed25519 with NIST ML-DSA-65 (FIPS 204).
- **RFC 3161 External Timestamp Anchor**: Independent temporal attestation tokens proving time of existence outside the host system clock.
- **Attack Playground**: In-dashboard security testbed simulating 6 adversary attack vectors (decision tampering, timestamp forgery, model spoofing, policy tampering, record deletion, human signature substitution) with live verification diagnostics.
- **Compliance Pack Generator**: Turnkey export of regulatory compliance dossiers for the EU AI Act, SOC 2 Type II, GDPR Article 22, HIPAA, and India DPDP.

---

## 3. How CooL SDK is Being Used

VeritasAI uses the Northwind Cipher CooL SDK (`cool-nwc` v3.0.0) as its core cryptographic sealing and verification engine:

### A. Non-Blocking Ingestion (`recordEvent`)
When an AI agent executes an action, VeritasAI calls `recordEvent` to generate a cryptographic receipt:
```typescript
import { recordEvent } from "./services/coolClient.js";

const { evidence } = await recordEvent(
  "loan_application",
  { applicationId: "8421", decision: "rejected" },
  { applicantHash: "salt_9f2a...", creditTier: "TIER_3", dtiRatio: 0.48 }
);
```
- The SDK binds canonical hashes of inputs and outputs with hardware attestation primitives.
- If the cryptographic network or ledger experiences degradation, the non-blocking pipeline captures the event with a `recording_failed` status, ensuring AI agent latency is never disrupted.

### B. 7-Domain Offline Verification (`verifyReceipt`)
Anyone can verify the authenticity of a decision receipt without contacting VeritasAI servers:
```typescript
import { verifyReceipt } from "./services/coolClient.js";

const verdict = await verifyReceipt(event.receiptJson);
```
The CooL SDK verifies across 7 trust domains:
1. Structural Schema Validity
2. Hardware Enclave (TEE) Attestation
3. Cryptographic Hash Chain Integrity
4. Input State Commitment
5. Policy Binding Verification
6. Temporal Anchor Validity
7. Non-Repudiation Key Attribution

---

## 4. Why CooL is Important to Your Solution

- **Hardware-Anchored Non-Repudiation**: Eliminates blind trust in database administrators. Decisions are sealed by cryptographic signatures and hardware enclave primitives, making retrospective tampering mathematically impossible.
- **Zero-Knowledge Data Minimization**: Enables salted hashing of sensitive inputs client-side, proving an evaluation occurred without persisting unencrypted PII in audit stores.
- **Air-Gapped Auditor Verification**: Auditors and regulators can take the standalone receipt JSON and run the verification protocol offline on an air-gapped machine without platform access.
- **Model and Policy Drift Containment**: The receipt anchors exact system prompt hashes, policy versions, and tool invocation parameters, proving whether an unapproved model or modified prompt executed.

---

## 5. Architecture and Workflow

### Architecture Diagram

```mermaid
flowchart TD
    subgraph Agents["AI Agent Layer (Python / TypeScript / REST)"]
        A1[Autonomous Agent / Model]
        A2[LangChain / AutoGen / CrewAI]
        A3[API Client Gateway]
    end

    subgraph VeritasBackend["VeritasAI Ingestion Gateway (Node.js + Express)"]
        B1[Tenant Auth & API Key Validation]
        B2[9-Stage Action Chain Builder]
        B3[Zero-Knowledge Merkle Commitments]
        B4[AES-256-GCM Field-Level Encryption]
    end

    subgraph CooLEngine["CooL SDK (cool-nwc) Cryptographic Core"]
        C1[Hardware TEE Enclave Attestation]
        C2[Hybrid Dual Signatures: Ed25519 + NIST ML-DSA-65]
        C3[RFC 6962 Transparency Log & STH]
        C4[RFC 3161 External Timestamp Authority]
        C5[Cryptographic Evidence Receipt JSON]
    end

    subgraph Persistence["Storage Layer"]
        DB[(PostgreSQL Multi-Tenant Database)]
    end

    subgraph Interface["Operator & Auditor Portal (React + Vite)"]
        UI1[Live Telemetry Feed & Stats]
        UI2[Action Chain Micro-Block Visualizer]
        UI3[ZK Selective Disclosure Verifier]
        UI4[Cross-Event Causal DAG Lineage]
        UI5[Red-Team Attack Playground]
        UI6[Compliance Pack Generator]
    end

    A1 & A2 & A3 -->|Decision Telemetry| B1
    B1 --> B2 --> B3 --> B4
    B4 --> C1
    C1 --> C2 --> C3 --> C4 --> C5
    C5 --> DB
    DB --> UI1 & UI2 & UI3 & UI4 & UI5 & UI6
```

### 9-Stage Action Chain Lifecycle

```
[ 1. INPUT ]           Raw user request parameters
      |
      v
[ 2. CONTEXT ]         Retrieved database/RAG state
      |
      v
[ 3. POLICY_CHECK ]     Governing rule set and policy version hash
      |
      v
[ 4. AI_REASONING ]    Model name, system prompt hash, thought trace
      |
      v
[ 5. RISK_ASSESSMENT ] Dynamic risk tiering and guardrail evaluation
      |
      v
[ 6. TOOL_CALL ]       External API calls, parameters, and results
      |
      v
[ 7. HUMAN_APPROVAL ]  Human-in-the-loop sign-off signature (if high-risk)
      |
      v
[ 8. FINAL_ACTION ]    Executed operation payload
      |
      v
[ 9. OUTCOME ]         System response and terminal status
```

---

## 6. How to Run the Project

### Prerequisites
- Node.js >= 20.0.0
- npm >= 10.0.0
- PostgreSQL database (Local or cloud: Render, Supabase, Neon)

### 1. Backend Setup
```bash
cd backend
npm install
```

Configure `backend/.env`:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/veritasai?schema=public"
PORT=4000
COOL_APPLICATION_ID="veritasai"
ADMIN_PASSWORD="veritasai-admin"
JWT_SECRET="veritasai-jwt-secret-change-in-production"
ENCRYPTION_KEY="0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
```

Push database schema and start server:
```bash
npm run db:push
npm run dev
```
Backend runs at `http://localhost:4000/api/v1`.

### 2. Frontend Setup
In a new terminal:
```bash
cd frontend
npm install
npm run dev
```
Frontend runs at `http://localhost:5173`.

Default sign-in credentials:
- Email: `admin@veritasai.io` (or `admin@veritasai.local`)
- Password: `veritasai-admin`

### 3. Run Automated Cryptographic Verification Suite
Verify all 17 enterprise features against the live database:
```bash
cd backend
npx tsx src/scripts/verifyAllFeatures.ts
```

### 4. Deploy to Production
- **Backend on Render**: Uses `render.yaml` to automatically provision a managed PostgreSQL database and Node.js web service.
- **Frontend on Vercel**: Connect repository, set root directory to `frontend`, and configure `VITE_API_URL` pointing to the Render backend.

---

## 7. Any Important Technical Decisions

- **PostgreSQL over SQLite**: Migrated to PostgreSQL to ensure persistent data on containerized cloud hosts (e.g., Render free tier ephemeral disks) and provide multi-tenant concurrency.
- **Database CLI Switcher (`switchDb.ts`)**: Built `npm run db:postgres` and `npm run db:sqlite` so developers can switch between cloud PostgreSQL and zero-dependency local SQLite with one command.
- **Hybrid Post-Quantum Lattice Signatures**: Combined classical Ed25519 with NIST ML-DSA-65 (FIPS 204) to provide immediate compatibility with current verifiers while protecting evidence against future quantum decryption.
- **Field-Level AES-256-GCM Encryption at Rest**: Encrypts sensitive decision inputs, outputs, action chains, and policy proofs using a 32-byte master key. Direct database inspection reveals no plaintext customer data.
- **RFC 6962 Anti-Deletion Consistency Proofs**: Merkle tree accumulator ensures that any unauthorized record deletion breaks the mathematical consistency between consecutive Signed Tree Heads.
- **Non-Blocking Ingestion Pipeline**: Asynchronous dispatch guarantees that cryptographic receipt sealing never introduces latency into the AI agent's inference path.

---

## 8. Limitations and Future Improvements

- **Hardware Enclave Verification**: Currently validates simulated TEE attestation structures via the CooL SDK. Future iterations will integrate direct AWS Nitro Enclaves and Intel SGX remote quote verification.
- **Public Data Availability Anchoring**: Currently uses RFC 3161 timestamps and local RFC 6962 Signed Tree Heads. Future updates will periodically anchor Merkle roots to public decentralized layers (such as Celestia or Ethereum L2s).
- **Zero-Knowledge Inference Proofs (zk-ML)**: Currently commits to prompt hashes, model parameters, and input/output states. Future work will explore compiling neural network inference graphs into verifiable ZK-SNARK proofs.
- **Distributed Auditor Consensus**: Multi-region validator consensus across independent compliance nodes for cross-border regulatory verification.

---

## License

MIT License. Built on [Northwind Cipher CooL SDK (`cool-nwc`)](https://github.com/northwind-cipher).
