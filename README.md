# VeritasAI: Cryptographic Evidence and Governance Infrastructure for Enterprise AI Systems

VeritasAI is an enterprise-grade cryptographic evidence infrastructure and observability platform for autonomous, consequential artificial intelligence agents. Built on the Northwind Cipher CooL SDK (`cool-nwc`), VeritasAI captures, cryptographically seals, and mathematically verifies AI agent decision lifecycles across seven independent trust domains, ensuring post-quantum resilience, multi-tenant data isolation, and regulatory compliance.

---

## Table of Contents

1. [Problem Statement](#1-problem-statement)
2. [Solution Overview: What Was Built](#2-solution-overview-what-was-built)
3. [CooL SDK Integration Architecture](#3-cool-sdk-integration-architecture)
4. [Why CooL SDK is Fundamental to the Solution](#4-why-cool-sdk-is-fundamental-to-the-solution)
5. [Organizational Deployment and Industry Use Cases](#5-organizational-deployment-and-industry-use-cases)
   - [Banking and Financial Services](#banking-and-financial-services)
   - [Healthcare and Clinical Triage](#healthcare-and-clinical-triage)
   - [Insurance Underwriting and Claims](#insurance-underwriting-and-claims)
   - [Customer Operations and High-Value Disbursements](#customer-operations-and-high-value-disbursements)
   - [Organizational Onboarding and Integration Patterns](#organizational-onboarding-and-integration-patterns)
6. [System Architecture and Decision Lifecycle](#6-system-architecture-and-decision-lifecycle)
   - [The Nine-Stage AI Action Chain](#the-nine-stage-ai-action-chain)
   - [End-to-End Attestation Flow](#end-to-end-attestation-flow)
7. [Key Technical Decisions and Rationale](#7-key-technical-decisions-and-rationale)
8. [Installation and Local Execution](#8-installation-and-local-execution)
   - [Prerequisites](#prerequisites)
   - [Backend Configuration and Database Initialization](#backend-configuration-and-database-initialization)
   - [Frontend Configuration and Execution](#frontend-configuration-and-execution)
   - [Running the Automated 17-Feature Verification Suite](#running-the-automated-17-feature-verification-suite)
   - [Production Cloud Deployment (Render and Vercel)](#production-cloud-deployment-render-and-vercel)
9. [Limitations and Future Engineering Roadmap](#9-limitations-and-future-engineering-roadmap)
10. [Regulatory Alignment Matrix and Specifications](#10-regulatory-alignment-matrix-and-specifications)

---

## 1. Problem Statement

Enterprises are shifting autonomous artificial intelligence from advisory conversational interfaces to consequential execution pipelines. AI agents now approve credit facilities, adjudicate health insurance claims, execute capital disbursements, and configure clinical workflows. 

This operational shift introduces the AI Governance and Black-Box Trilemma:

### A. Non-Repudiation Deficit in Standard Infrastructure
Conventional logging frameworks (such as CloudWatch, Datadog, Elasticsearch, or relational databases) store plaintext records that can be modified, truncated, or dropped by privileged database administrators, root infrastructure operators, or compromised cloud environments. In the event of litigation or regulatory investigation, conventional database rows fail the standard of legal non-repudiation because they lack mathematical immutability.

### B. The Privacy Versus Auditability Paradox
Regulatory frameworks—including the European Union Artificial Intelligence Act (Articles 12 and 14), the United States Equal Credit Opportunity Act (ECOA), and the Health Insurance Portability and Accountability Act (HIPAA)—mandate granular visibility into algorithmic decision logic. Conversely, global privacy statutes (such as the General Data Protection Regulation and the India Digital Personal Data Protection Act) prohibit disclosing customer Personally Identifiable Information (PII) to internal staff or external auditors. Organizations are caught between unlawful data exposure and non-compliant opaque operations.

### C. The Latency and Fail-Safe Barrier
Synchronous audit mechanisms that block AI execution during ledger consensus introduce unacceptable latency penalties. Furthermore, if the audit infrastructure experiences intermittent network degradation, mission-critical consumer transactions risk unexpected interruption.

### D. The Post-Quantum Retention Threat
Compliance records in regulated sectors require mandatory retention periods spanning seven to ten years. Classical digital signature schemes (such as RSA-2048 and standard ECDSA) will become insecure during this retention window due to advances in quantum computing and Shor's algorithm. High-consequence decisions recorded today must incorporate post-quantum cryptography to remain verifiable throughout their statutory lifecycle.

---

## 2. Solution Overview: What Was Built

VeritasAI provides a verifiable evidence platform that converts every consequential AI event into a cryptographically sealed receipt. The platform consists of the following core engines:

1. **Nine-Stage AI Action Chain**: Instead of capturing only the final output, VeritasAI records each discrete phase of execution (`INPUT`, `CONTEXT`, `POLICY_CHECK`, `AI_REASONING`, `RISK_ASSESSMENT`, `TOOL_CALL`, `HUMAN_APPROVAL`, `FINAL_ACTION`, `OUTCOME`) as a cryptographically linked micro-block.
2. **Zero-Knowledge Salted Selective Disclosure**: Built on leaf-salted Merkle commitments, this mechanism allows organizations to prove specific factual attributes (e.g., verifying that income exceeded a threshold) to external auditors while keeping sensitive identity fields completely redacted.
3. **Cross-Event Causal Directed Acyclic Graph (DAG)**: Maintains parent-to-child lineage relationships across complex multi-agent execution networks, tracing systemic root causes across distributed agents.
4. **Append-Only Transparency Log (RFC 6962)**: Incorporates a Merkle tree accumulator that produces Signed Tree Heads (STH) and mathematical consistency proofs, instantly detecting retroactive database deletions or history truncation.
5. **Hybrid Post-Quantum Lattice Signatures**: Implements dual cryptographic signing combining classical Ed25519 with NIST ML-DSA-65 (FIPS 204), securing audit receipts against both present-day and future quantum decryption adversaries.
6. **External Timestamp Authority Anchoring (RFC 3161)**: Binds event hashes to external time-stamping authorities, establishing objective temporal existence independent of host server system clocks.
7. **Attack Playground**: An integrated red-team simulation suite supporting six active adversary attack scenarios (decision tampering, timestamp manipulation, model identity spoofing, policy tampering, record pruning, and human signature substitution) with live diagnostic verification failure outputs.
8. **Compliance Dossier Generator**: Compiles cryptographically attested evidence packages aligned with the EU AI Act, SOC 2 Type II, GDPR Article 22, HIPAA, and India DPDP with export capabilities in JSON and Markdown formats.

---

## 3. CooL SDK Integration Architecture

VeritasAI uses the Northwind Cipher CooL SDK (`cool-nwc` v3.0.0) as its primary cryptographic sealing engine. The integration operates across two functional pathways:

### A. Asynchronous Evidence Capture (`recordEvent`)
When an AI agent executes within the enterprise perimeter, the backend ingestion pipeline dispatches evidence to the CooL SDK client:

```typescript
import { recordEvent } from "./services/coolClient.js";

// Non-blocking invocation
const { evidence } = await recordEvent(
  "loan_application",
  { applicationId: "8421", decision: "rejected" },
  { applicantHash: "salt_9f2a8c1...", creditTier: "TIER_3", dtiRatio: 0.48 }
);
```

The evidence generation lifecycle:
1. Calculates deterministic canonical hashes of input payloads and output evaluations.
2. Binds the event to active agent credentials and organization tenant identifiers.
3. Obtains hardware-level Trusted Execution Environment (TEE) attestation primitives.
4. Emits a tamper-evident CooL receipt JSON containing cryptographic proofs and cryptographic signatures.

### B. Seven-Domain Independent Verification (`verifyReceipt`)
Audit verification evaluates seven distinct cryptographic trust domains offline:

```typescript
import { verifyReceipt } from "./services/coolClient.js";

const verdict = await verifyReceipt(event.receiptJson);
```

The seven evaluated trust domains are:
1. **Domain 1 (Structural Schema Integrity)**: Validates canonical receipt encoding, cryptographic field structures, and schema conformance.
2. **Domain 2 (Hardware Enclave Attestation)**: Verifies cryptographic signatures issued from attested Trusted Execution Environments.
3. **Domain 3 (Hash Chain Micro-Block Continuity)**: Confirms that consecutive execution stages maintain valid SHA-256 parent-linkage proofs.
4. **Domain 4 (Input Commitment Verification)**: Validates that inputs committed at execution start match the recorded leaf commitment.
5. **Domain 5 (Policy Binding Verification)**: Verifies that the decision strictly adheres to the SHA-256 hash of the governing policy version.
6. **Domain 6 (Temporal Trust Anchor)**: Validates external RFC 3161 tokens and Signed Tree Head sequence progression.
7. **Domain 7 (Non-Repudiation Key Attribution)**: Verifies that signatures match authorized, unrevoked agent credential hashes.

---

## 4. Why CooL SDK is Fundamental to the Solution

Traditional enterprise software relies on relational database management systems and access control policies to maintain audit trails. In adversarial or high-consequence scenarios, this foundation is inadequate:

1. **Elimination of Privileged Access Vulnerabilities**: Standard database tables are subject to alteration by database administrators or host operating system operators. CooL SDK receipts are self-authenticating cryptographic objects; any modification to an event payload invalidates the digital signature chain regardless of database privileges.
2. **Client-Side Data Minimization**: CooL SDK enables client-side salting and hashing. Organizations record zero-knowledge cryptographic commitments on the evidence network without transmitting raw customer PII across network perimeters.
3. **Air-Gapped Auditor Replay**: Regulators and independent accounting firms do not require direct network access to VeritasAI production infrastructure. Auditors can execute the open CooL verification protocol on isolated, air-gapped workstations against standalone receipt files.
4. **Model and Prompt Drift Containment**: CooL receipt payloads bind the exact SHA-256 system prompt hash, tool execution parameters, and model identifier. If an autonomous model deviates from approved baseline parameters, the discrepancy is mathematically proven upon inspection.

---

## 5. Organizational Deployment and Industry Use Cases

VeritasAI is structured for deployment across regulated commercial and public sector organizations.

### Banking and Financial Services
- **Automated Underwriting**: Autonomous lending models evaluate applicant credit risk and approve or reject capital requests. VeritasAI records the nine-stage action chain, proving that credit rules (such as debt-to-income ceilings) were systematically applied without disparate demographic impact.
- **Adverse Action Defense**: When challenged by regulators under the Equal Credit Opportunity Act (ECOA) or Fair Housing Act, the institution produces a tamper-proof selective disclosure certificate demonstrating the exact mathematical basis of denial while masking personal identifiers.

### Healthcare and Clinical Triage
- **Clinical Decision Support (CDS)**: Autonomous systems analyzing patient telemetry to prioritize intensive care resources or suggest medication adjustments.
- **HIPAA-Compliant Auditing**: Under HIPAA security and privacy rules, raw patient diagnostic details must not be stored in general compliance logs. VeritasAI maintains salted cryptographic commitments that prove clinical protocol adherence without storing protected health information (PHI) in audit indices.

### Insurance Underwriting and Claims
- **Automated Adjudication**: Processing property, casualty, or health claims via multi-agent pipelines.
- **Fraud and Lineage Defense**: Traces the complete causal DAG from initial claim upload through third-party damage assessment tool invocations to the final payment authorization, guarding against unauthorized automated payments.

### Customer Operations and High-Value Disbursements
- **Refund and Treasury Bots**: AI agents empowered to process refunds, issue vendor credits, or execute contract renegotiations.
- **Human-in-the-Loop Governance**: For transactions exceeding specified threshold amounts, VeritasAI binds the digital signature and approval identity of human supervisors directly into the cryptographic action chain, satisfying EU AI Act Article 14 mandates.

---

### Organizational Onboarding and Integration Patterns

Organizations deploy VeritasAI through four standardized operational patterns:

```
[ Autonomous AI Agent ]  <--->  [ VeritasAI Client Layer ]
                                          |
                        +-----------------+-----------------+
                        |                                   |
              (Pattern 1: Python SDK)             (Pattern 2: Node.js SDK)
              @audit decorator                    Express / TS Client
                        |                                   |
                        +-----------------+-----------------+
                                          |
                               (Pattern 3: REST API)
                               POST /api/v1/decisions
                                          |
                                          v
                           [ VeritasAI Core Platform ]
                                          |
                                          v
                      [ Multi-Tenant PostgreSQL + CooL Engine ]
                                          |
                                          v
                     (Pattern 4: Auditor & Operator Portal)
                     Dashboard, Lineage DAG, Compliance Packs
```

#### Pattern 1: Python SDK with Automated Decorator
For research and production AI agents built with frameworks such as LangChain, LlamaIndex, AutoGen, or CrewAI:

```python
from veritasai import VeritasClient, audit

client = VeritasClient(
    api_key="vra_live_9f8e7d6c5b4a...",
    endpoint="https://veritasai-backend.onrender.com/api/v1"
)

@audit(client=client, event_type="loan_underwriting", policy_id="FIN-2026-04")
def evaluate_loan(applicant_data: dict) -> dict:
    # Autonomous agent inference logic
    score = calculate_risk(applicant_data)
    decision = "approved" if score > 700 else "rejected"
    return {"decision": decision, "risk_score": score}
```

#### Pattern 2: Node.js and TypeScript Middleware
For enterprise service meshes, API gateways, and web application controllers:

```typescript
import { VeritasSDK } from "./sdk/veritasai.js";

const veritas = new VeritasSDK({
  apiKey: process.env.VERITASAI_API_KEY!,
  baseUrl: process.env.VERITASAI_URL!
});

// Non-blocking telemetry ingestion
await veritas.recordDecision({
  agentId: "agent_underwriter_v2",
  eventType: "mortgage_adjudication",
  decision: "rejected",
  riskLevel: "HIGH",
  input: { dti: 0.52, creditScore: 580 },
  output: { rationale: "DTI threshold exceeded" }
});
```

#### Pattern 3: Enterprise Ingestion REST API
For polyglot systems, legacy banking monoliths, or serverless functions (AWS Lambda, Google Cloud Functions):
- Endpoint: `POST /api/v1/decisions`
- Authentication: `Authorization: Bearer vra_live_<key>`
- Payload: Standardized JSON specifying input context, active policy identifiers, tool execution parameters, and model metadata.

#### Pattern 4: Embedded Auditor and Claimant Verification Widget
Organizations integrate the standalone verification client into consumer-facing portals, allowing customers receiving adverse decisions to independently verify that their evaluation was processed under approved, untampered governance policies.

---

## 6. System Architecture and Decision Lifecycle

### The Nine-Stage AI Action Chain
VeritasAI records the complete lifecycle of consequential actions through nine cryptographically bound stages:

```
[ 1. INPUT ] 
      |  canonical hash (H_0)
      v
[ 2. CONTEXT ] 
      |  H_1 = SHA-256(H_0 + context_payload)
      v
[ 3. POLICY_CHECK ] 
      |  H_2 = SHA-256(H_1 + policy_version + policy_rules_hash)
      v
[ 4. AI_REASONING ] 
      |  H_3 = SHA-256(H_2 + model_name + prompt_hash + rationale)
      v
[ 5. RISK_ASSESSMENT ] 
      |  H_4 = SHA-256(H_3 + risk_tier + guardrail_scores)
      v
[ 6. TOOL_CALL ] 
      |  H_5 = SHA-256(H_4 + tool_name + tool_args_hash + output_hash)
      v
[ 7. HUMAN_APPROVAL ] 
      |  H_6 = SHA-256(H_5 + reviewer_id + signature + notes)
      v
[ 8. FINAL_ACTION ] 
      |  H_7 = SHA-256(H_6 + action_payload + target_system)
      v
[ 9. OUTCOME ] 
         H_final = SHA-256(H_7 + final_state + system_metrics)
```

Each stage contains its canonical payload, execution timestamp, stage hash, and parent stage hash. If an attacker tampers with reasoning text in stage 4 or changes human approval flags in stage 7, the hash chain breaks from that point forward, signaling mathematical invalidity upon verification.

---

### End-to-End Attestation Flow

```
[ AI Agent Execution ]
         |
         v
[ VeritasAI Gateway ] ---> [ Validate Tenant & Agent API Key ]
         |
         +---> [ Compute 9-Stage Action Chain & Stage Hashes ]
         |
         +---> [ Generate Salted Merkle Tree Commitments ]
         |
         +---> [ AES-256-GCM Field-Level Encryption at Rest ]
         |
         v
[ CooL Engine (cool-nwc) ]
         |
         +---> [ Hardware Enclave (TEE) Binding ]
         |
         +---> [ Dual Signatures: Ed25519 + NIST ML-DSA-65 (PQC) ]
         |
         +---> [ Append to RFC 6962 Transparency Log & Emit STH ]
         |
         +---> [ Anchor to RFC 3161 External Timestamp Authority ]
         |
         v
[ Multi-Tenant PostgreSQL Database ]
         |
         v
[ React Operator & Auditor Dashboard ]
         |
         +---> [ Real-Time Telemetry Feed & Metrics ]
         |
         +---> [ Interactive Zero-Knowledge Disclosure Verifier ]
         |
         +---> [ Visual Cross-Event Causal DAG Lineage ]
         |
         +---> [ 6-Vector Red-Team Attack Playground ]
         |
         +---> [ Automated Regulatory Compliance Pack Generator ]
```

---

## 7. Key Technical Decisions and Rationale

| Architecture Domain | Decision Taken | Technical Rationale |
| :--- | :--- | :--- |
| **Persistence Layer** | **PostgreSQL via Prisma ORM** | Replaced local SQLite to eliminate container disk wipeouts on cloud platforms (such as Render free tier) and support high-throughput, concurrent multi-tenant isolation. |
| **Database Flexibility** | **CLI Switcher (`switchDb.ts`)** | Added `npm run db:postgres` and `npm run db:sqlite` to allow seamless toggling between cloud PostgreSQL and zero-dependency local development. |
| **Post-Quantum Cryptography** | **Hybrid Ed25519 + NIST ML-DSA-65** | Implemented dual-signing to maintain full compatibility with classical cryptographic verifiers today while rendering evidence impervious to future quantum computing decryption attacks. |
| **Data Privacy at Rest** | **AES-256-GCM Field Encryption** | Critical decision fields (inputs, outputs, action chains, policy proofs) are encrypted using a 32-byte master key before database insertion. SQL database dumps contain zero unencrypted business data. |
| **Anti-Deletion Guarantees** | **RFC 6962 Consistency Proofs** | Used Merkle tree accumulators where each Signed Tree Head commits to all historical events. Any unauthorized record removal breaks the consistency path between successive tree states. |
| **Zero-Knowledge Disclosure** | **Salted Leaf Merkle Trees** | Permitted selective redaction of individual attributes during audits while preserving the mathematical validity of the root commitment hash. |
| **Fail-Safe Processing** | **Non-Blocking Capture Dispatch** | AI agent inference is never held up waiting for external ledger confirmations. Network timeouts transition receipts to structured diagnostic failure records without impacting user latency. |

---

## 8. Installation and Local Execution

### Prerequisites
- **Node.js**: Version 20.0.0 or higher (Tested on Node.js v22.16.0).
- **npm**: Version 10.0.0 or higher.
- **PostgreSQL**: Local PostgreSQL 17 server or hosted PostgreSQL connection string (Render, Supabase, Neon, AWS RDS).

---

### Backend Configuration and Database Initialization

1. Navigate to the backend directory and install dependencies:
```powershell
cd "backend"
npm install
```

2. Configure environment variables in `backend/.env`:
```env
# PostgreSQL Connection URL
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/veritasai?schema=public"
PORT=4000
COOL_APPLICATION_ID="veritasai"
ADMIN_PASSWORD="veritasai-admin"
JWT_SECRET="veritasai-jwt-secret-change-in-production"

# AES-256-GCM Master Encryption Key (32-byte hex string)
ENCRYPTION_KEY="0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
```

3. Synchronize schema and generate Prisma client:
```powershell
npm run db:push
```

4. Launch backend API server:
```powershell
npm run dev
```
*The server initializes on `http://localhost:4000/api/v1` and verifies database connectivity.*

---

### Frontend Configuration and Execution

1. In a separate terminal, navigate to the frontend directory:
```powershell
cd "frontend"
npm install
```

2. Launch Vite development server:
```powershell
npm run dev
```
*The user interface becomes available on `http://localhost:5173`.*

3. Log in to the administrator portal:
- **URL**: `http://localhost:5173`
- **Email**: `admin@veritasai.io` (or `admin@veritasai.local`)
- **Password**: `veritasai-admin`

*(Direct access is also available via the Quick Demo Access option on the sign-in modal).*

---

### Running the Automated 17-Feature Verification Suite

VeritasAI includes a comprehensive cryptographic test suite that verifies all seventeen enterprise components against the live PostgreSQL database:

```powershell
cd backend
npx tsx src/scripts/verifyAllFeatures.ts
```

**Verification Results Summary**:
- **Test 1**: 9-Stage AI Action Chain micro-block linkage and stage-tampering detection.
- **Test 2**: Zero-Knowledge Salted Selective Disclosure verification and field mutation rejection.
- **Test 3**: RFC 6962 Merkle Transparency Log Signed Tree Head generation and anti-deletion detection.
- **Test 4**: Hybrid Classical (Ed25519) and Post-Quantum (NIST ML-DSA-65) dual-signature validity.
- **Test 5**: RFC 3161 External Timestamp Authority token attestation.
- **Test 6**: Multi-agent cross-event causal DAG reconstruction.
- **Test 7**: Transparent field-level AES-256-GCM decryption at rest.

---

### Production Cloud Deployment (Render and Vercel)

#### Backend and Managed PostgreSQL on Render:
1. Open the [Render Dashboard](https://dashboard.render.com).
2. Select **New +** > **Blueprint** and connect the GitHub repository.
3. Render reads `render.yaml` and automatically provisions:
   - Managed PostgreSQL database (`veritasai-db`).
   - Web service (`veritasai-backend`) with runtime environment variables.
4. Render executes the build command:
   ```bash
   npm install && (chmod -R +x node_modules/.bin 2>/dev/null || true) && npx prisma generate && npx prisma db push && npx tsc
   ```
5. Note your backend URL (e.g., `https://veritasai-backend.onrender.com`).

#### Frontend Application on Vercel:
1. Open the [Vercel Dashboard](https://vercel.com/new) and import the repository.
2. Select **Root Directory**: `frontend`.
3. Add Environment Variable:
   - `VITE_API_URL`: `https://veritasai-backend.onrender.com`
4. Click **Deploy**. Vercel uses `frontend/vercel.json` for client-side route rewrites.

---

## 9. Limitations and Future Engineering Roadmap

1. **Hardware Enclave Remote Attestation Validation**:
   - *Current Implementation*: Generates and evaluates cryptographic TEE tokens using the CooL SDK attestation structures.
   - *Roadmap*: Native integration with cloud-provider hardware attestation services (such as AWS Nitro Enclave attestation documents and Intel SGX DCAP quote verification).
2. **Public Data Availability Network Anchoring**:
   - *Current Implementation*: Incorporates RFC 3161 timestamping and local RFC 6962 Signed Tree Heads.
   - *Roadmap*: Periodic batch anchoring of Merkle tree roots to public decentralized data availability layers (such as Celestia or Ethereum L2 rollups).
3. **ZK-SNARK Neural Network Weight Execution Proofs**:
   - *Current Implementation*: Mathematical commitments over prompt hashes, model versions, input contexts, and decision outputs.
   - *Roadmap*: Compilation of model execution graphs into zero-knowledge verifiable inference proofs (zk-ML).
4. **Multi-Region Distributed Consensus**:
   - *Current Implementation*: Highly resilient multi-tenant PostgreSQL clustering.
   - *Roadmap*: Distributed consensus protocols running across external auditor nodes for decentralized regulatory verification.

---

## 10. Regulatory Alignment Matrix and Specifications

| Regulation / Standard | Mandated Requirement | VeritasAI Technical Enforcement |
| :--- | :--- | :--- |
| **EU AI Act — Article 12** | Automatic recording of consequential events throughout the high-risk AI lifecycle. | Nine-stage micro-block action chain anchored with SHA-256 parent linkages. |
| **EU AI Act — Article 14** | Verifiable human oversight mechanisms for high-risk autonomous workflows. | Dedicated `HUMAN_APPROVAL` stage binding human digital signatures, decisions, and review notes into the receipt. |
| **SOC 2 Type II (CC6.1 - CC6.8)** | Non-repudiation, tamper detection, and change management auditing. | RFC 6962 Merkle tree transparency logs with Signed Tree Heads and consistency proofs. |
| **GDPR — Article 22** | Safeguards for automated individual decision-making, including right to explanation. | Explainability evidence cards synthesized directly from verified inputs, policy rules, and models. |
| **GDPR / India DPDP** | Data minimization and confidentiality in audit record retention. | Salted zero-knowledge selective disclosure allowing verification of facts without exposing customer PII. |
| **HIPAA Security Rule** | Integrity controls and audit trails for electronic protected health information. | Field-level AES-256-GCM encryption at rest with client-side zero-knowledge hash commitments. |
| **NIST Post-Quantum (FIPS 204)** | Preparation for quantum computing cryptographic migration. | Dual hybrid signing with Ed25519 and NIST ML-DSA-65 (Module-Lattice Digital Signatures). |
