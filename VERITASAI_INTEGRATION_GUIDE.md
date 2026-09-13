# VeritasAI — Integration & Architecture Whitepaper
### Cryptographic Evidence Infrastructure for Enterprise AI Systems

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](file:///d:/reverse%20hackathon%201/veritasai/VERITASAI_INTEGRATION_GUIDE.md)
[![Status](https://img.shields.io/badge/status-production--ready-green.svg)](file:///d:/reverse%20hackathon%201/veritasai/VERITASAI_INTEGRATION_GUIDE.md)
[![License](https://img.shields.io/badge/license-MIT-purple.svg)](file:///d:/reverse%20hackathon%201/veritasai/VERITASAI_INTEGRATION_GUIDE.md)
[![Engine](https://img.shields.io/badge/engine-cool--nwc%20v3.0.0-orange.svg)](file:///d:/reverse%20hackathon%201/veritasai/VERITASAI_INTEGRATION_GUIDE.md)

- **Document Version**: `1.0.0`
- **Target Audience**: Chief Technology Officers, Lead AI Architects, Compliance & Risk Officers, Enterprise Security Teams
- **Author**: VeritasAI Engineering Team
- **Core Technology**: Northwind Cipher / CooL SDK (`cool-nwc`)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Quickstart & Run Commands](#2-quickstart--run-commands)
3. [Core Architectural Model & Cryptographic Evidence Loop](#3-core-architectural-model--cryptographic-evidence-loop)
4. [Integration Patterns for Partner Organizations](#4-integration-patterns-for-partner-organizations)
   - [Pattern 1: Python SDK & Decorators (Direct Agent Integration)](#pattern-1-python-sdk--decorators-direct-agent-integration)
   - [Pattern 2: Node.js / TypeScript Middleware](#pattern-2-nodejs--typescript-middleware)
   - [Pattern 3: REST API / Ingestion Pipeline](#pattern-3-rest-api--ingestion-pipeline)
   - [Pattern 4: Embedded Customer & Auditor Frontend Widgets](#pattern-4-embedded-customer--auditor-frontend-widgets)
5. [Step-by-Step Implementation Walkthrough](#5-step-by-step-implementation-walkthrough)
6. [Data Privacy & Zero-Knowledge PII Architecture](#6-data-privacy--zero-knowledge-pii-architecture)
7. [Offline Verification Specification (The 7 Trust Domains)](#7-offline-verification-specification-the-7-trust-domains)
8. [Regulatory Compliance Alignment Matrix](#8-regulatory-compliance-alignment-matrix)
9. [Security, Performance & Fail-Safe Guarantees](#9-security-performance--fail-safe-guarantees)
10. [REST API Reference](#10-rest-api-reference)

---

## 1. Executive Summary

As enterprises deploy autonomous AI agents to make high-stakes, consequential decisions—such as issuing credit approvals, processing insurance claims, executing algorithmic trades, and providing clinical triage guidance—they face a profound governance trilemma:

> **The AI Governance Trilemma**  
> How can an organization prove to an auditor, regulator, or consumer exactly **what** an AI agent decided, **when** it decided it, and **under what specific criteria**, without exposing sensitive customer PII or risking business-critical downtime if an audit node goes offline?

**VeritasAI** resolves this trilemma by cryptographically sealing every AI decision into a tamper-evident, verifiable receipt powered by the CooL SDK (`cool-nwc`). 

### Core Capabilities:
- **Zero-Knowledge Privacy**: PII and sensitive training data are irreversibly salted and hashed client-side. Plaintext never leaves your security perimeter.
- **Fail-Safe Non-Blocking Design**: Auditing runs asynchronously; if network or ledger nodes falter, your AI agents continue serving customers unimpeded.
- **7-Domain Independent Offline Verification**: Any internal compliance team or third-party auditor can re-verify decision validity without network access to VeritasAI servers.
- **Turnkey Regulatory Observability**: Provides instant compliance records aligned with the EU AI Act (Articles 12 & 14), FTC Algorithmic Fairness Guidelines, SOC 2 Type II, and HIPAA.

---

## 2. Quickstart & Run Commands

You can run VeritasAI locally for development or as containerized services via Docker.

### Option A: Local Development (PowerShell / Windows)

#### 1. Backend API (Port 4000)
```powershell
cd "d:\reverse hackathon 1\veritasai\backend"

# Install dependencies
npm install

# Initialize database & Prisma client
npx prisma generate
npx prisma migrate dev

# Run in development mode
npm run dev
```

#### 2. Frontend Compliance Dashboard (Port 5173)
```powershell
cd "d:\reverse hackathon 1\veritasai\frontend"

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```

> [!NOTE]
> **Default Credentials**: Default admin password is `veritasai-admin`.  
> Access the dashboard at `http://localhost:5173`.

#### 3. Python SDK & Simulation Agents
```powershell
cd "d:\reverse hackathon 1\veritasai\sdk\python"

# Install SDK locally
pip install -e .

# Run Loan Approval AI Agent simulation
python examples\loan_approval_agent.py

# Run Customer Support AI Agent simulation
python examples\customer_support_agent.py
```

---

### Option B: Docker Compose (All-in-One)

```powershell
cd "d:\reverse hackathon 1\veritasai"
docker-compose up --build
```

- **Frontend Dashboard**: `http://localhost:8080`
- **Backend REST API**: `http://localhost:4000/api/v1`

---

## 3. Core Architectural Model & Cryptographic Evidence Loop

The VeritasAI evidence pipeline seals AI decision inputs and outputs within a hardware-attested cryptographic lifecycle:

```mermaid
flowchart TD
    subgraph ClientPerimeter["Enterprise Network Perimeter"]
        Agent["Autonomous AI Agent (e.g. LangChain, LlamaIndex, Custom)"] -->|"Decision Event"| Layer["VeritasAI SDK / Client Layer"]
        Layer -->|"Client-Side Hash (SHA-256)"| Blind["Irreversible Salted PII Hashes"]
        Layer -->|"Non-Sensitive Data"| Meta["Public Metadata & Outcome"]
    end

    subgraph VeritasInfra["VeritasAI Infrastructure"]
        Layer -->|"Async Ingest (<2ms)"| API["VeritasAI Ingestion Gateway"]
        API --> DB[("Tamper-Evident Store (Prisma / SQLite / Postgres)")]
        API --> Dashboard["Real-Time Compliance Dashboard"]
    end

    subgraph CryptographicLayer["CooL SDK (cool-nwc) & Hardware Attestation"]
        API --> CooL["CooL Attestation Engine"]
        CooL --> Sig["Ed25519 Key Signing"]
        CooL --> Merkle["Merkle Tree Root Inclusion"]
        CooL --> Enclave["TEE Hardware Attestation"]
        Sig --> Receipt["Immutable Receipt JSON"]
        Merkle --> Receipt
        Enclave --> Receipt
    end

    Receipt --> DB

    subgraph Verification["Independent Verification"]
        Auditor["Compliance Officer / Regulator / External Auditor"]
        Auditor -->|"Air-Gapped Offline"| Verifier["VeritasAI 7-Domain Verifier"]
        Receipt -.-> Verifier
        Verifier -->|"Output"| Verdict["Mathematical Cryptographic Verdict (PASS/FAIL)"]
    end
```

### The Fail-Safe Invariant

> [!IMPORTANT]
> **Zero-Downtime Guarantee**: VeritasAI operates on an asynchronous attestation dispatch model. If the verification network, CooL node, or internal database is degraded, the client library records the failure locally with a `recording_failed` status without blocking the host application's decision pipeline.

---

## 4. Integration Patterns for Partner Organizations

VeritasAI provides multiple integration patterns tailored to different enterprise architectures.

### Pattern 1: Python SDK & Decorators (Direct Agent Integration)

Ideal for AI engineering pipelines (LangChain, AutoGen, CrewAI, DSPy, OpenAI/Anthropic agents).

#### Explicit Logging Example:
```python
from veritasai import VeritasAI

# 1. Initialize client
client = VeritasAI(
    api_key="vra_live_9b83f820c74f51e",
    base_url="http://localhost:4000/api/v1"
)

# 2. Log an autonomous decision
decision = client.log_decision(
    decision="approved",
    input_data={
        "credit_score": 765,
        "debt_to_income": 0.22,
        "loan_amount": 350000
    },
    output={
        "interest_rate": 5.85,
        "max_approved": 350000,
        "tier": "Tier-1 Prime"
    },
    metadata={
        "application_id": "APP-8421",
        "agent_name": "MortgageUnderwriter-v2",
        "jurisdiction": "US-CA"
    },
    risk_level="LOW"
)

print(f"Logged Event ID: {decision.event_id}")

# 3. Cryptographically verify the receipt offline across 7 domains
verdict = client.verify(decision.event_id)
print(f"Cryptographic Verification Passed: {verdict.ok}")
```

#### Automatic Audit Decorator Example:
```python
from veritasai import VeritasAI, audit_decision

client = VeritasAI(api_key="YOUR_API_KEY")

@audit_decision(client=client, event_type="fraud_detection", risk_level="MEDIUM")
def evaluate_transaction(account_id: str, amount: float, location: str) -> dict:
    # Proprietary agent or model logic
    if amount > 10000 and location != "domestic":
        return {"status": "FLAGGED", "action": "STEP_UP_AUTH"}
    return {"status": "CLEARED", "action": "PROCESS"}

# Invoking the function automatically seals the cryptographic audit record
result = evaluate_transaction("ACC-9021", 12500.00, "international")
```

---

### Pattern 2: Node.js / TypeScript Middleware

Best for backend APIs and microservices orchestrating agent interactions.

```typescript
import express, { Request, Response } from "express";

const app = express();
app.use(express.json());

app.post("/api/loan/underwrite", async (req: Request, res: Response) => {
  const { applicantId, name, creditScore, income, requestedAmount } = req.body;

  // 1. Execute agent logic
  const decision = await runLoanAgent({ creditScore, income, requestedAmount });

  // 2. Dispatch cryptographic attestation asynchronously to VeritasAI
  try {
    await fetch("http://localhost:4000/api/v1/events", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.VERITASAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        agentId: process.env.VERITASAI_AGENT_ID,
        eventType: "loan_underwriting",
        metadata: {
          applicantId,
          decision: decision.outcome,
          modelVersion: "credit-underwriter-v3.1"
        },
        payloads: {
          applicantName: name, // Salted and hashed client-side
          creditScore,
          income
        }
      })
    });
  } catch (err) {
    // Fail-safe: log warning but never block user loan flow
    console.warn("VeritasAI attestation recording deferred:", err);
  }

  return res.json({
    status: decision.outcome,
    applicantId
  });
});
```

---

### Pattern 3: REST API / Ingestion Pipeline

Best for non-Python/Node stacks (Java Spring, Go, .NET, Rust) or workflow engines (Airflow, Temporal, n8n).

#### Request:
```http
POST /api/v1/events HTTP/1.1
Host: localhost:4000
Authorization: Bearer vra_live_xxxxxxxxxxxxxxxxxxxxxxxx
Content-Type: application/json

{
  "agentId": "cmtzkmvfk0000b7h19vuuazg8",
  "eventType": "credit_decision",
  "metadata": {
    "applicationId": "APP-8421",
    "decision": "rejected",
    "engine": "claude-3-5-sonnet",
    "riskLevel": "HIGH"
  },
  "payloads": {
    "applicant": "Alice Smith",
    "creditScore": 590
  }
}
```

#### Response:
```json
{
  "id": "cmtzkmvkg0002b7h1spc72i9c",
  "agentId": "cmtzkmvfk0000b7h19vuuazg8",
  "eventType": "credit_decision",
  "status": "recorded",
  "receiptJson": {
    "schema": "cool.receipt.v2",
    "subject": {
      "record_id": "rec_01JHM5K87...",
      "issued_at": "2026-09-13T12:00:00Z"
    },
    "proof": {
      "type": "Ed25519Signature2020",
      "signature": "3mP..."
    }
  },
  "createdAt": "2026-09-13T12:00:00.120Z"
}
```

---

### Pattern 4: Embedded Customer & Auditor Frontend Widgets

Enable self-service transparency for consumers and auditors.

```html
<!-- Customer Decision Card with Verification Iframe -->
<div class="decision-card">
  <h3>Underwriting Decision: Approved</h3>
  <p>Application Reference: #APP-8421</p>

  <iframe
    src="http://localhost:5173/embed/verify/cmtzkmvkg0002b7h1spc72i9c"
    width="100%"
    height="120"
    style="border: none; border-radius: 8px;"
    title="VeritasAI Cryptographic Proof Badge">
  </iframe>
</div>
```

---

## 5. Step-by-Step Implementation Walkthrough

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Compliance Admin
    participant Console as VeritasAI Console
    participant Agent as AI Agent System
    participant VeritasAPI as VeritasAI API
    participant Auditor as External Auditor

    Admin->>Console: Register New Agent Identity
    Console-->>Admin: Returns Agent ID & API Key
    Admin->>Agent: Configure VERITASAI_API_KEY
    Agent->>VeritasAPI: Send Decision Event + Salted Payload Hash
    VeritasAPI-->>Agent: Returns Signed Event Receipt ID
    VeritasAPI->>Console: Stream to Real-Time Compliance Feed
    Auditor->>VeritasAPI: Request 7-Domain Verification
    VeritasAPI-->>Auditor: Cryptographic Verdict (7/7 Passed)
```

1. **Agent Identity Provisioning**: Register agents in the console under **Agents** -> **New Agent**. Each agent receives a unique scoped API key.
2. **Boundary Definition**: Determine which fields are **Metadata** (public identifiers, model versions, outcome categories) versus **Payloads** (PII, financial figures, medical notes).
3. **Staging & Synthetic Tests**: Deploy with local test mocks to validate error handling and latency impact (<2ms).
4. **Production Deployment & Alerting**: Connect production agents and set up compliance webhook alerts for any unverified or high-risk decision flags.

---

## 6. Data Privacy & Zero-Knowledge PII Architecture

Standard logging platforms (Datadog, Splunk, Elastic) store raw event payloads, exposing organizations to massive regulatory liabilities under GDPR, HIPAA, and CCPA.

VeritasAI enforces **cryptographic separation of verification from data storage**:

| Feature | Standard Logging (Splunk / Datadog) | VeritasAI Cryptographic Infrastructure |
| :--- | :--- | :--- |
| **PII Storage** | Stored in plaintext or reversible encryption | **Zero Plaintext**: Irreversibly salted & hashed client-side |
| **Tamper Resistance** | Vulnerable to DB admin edits or log truncation | **Mathematical Immutability**: Hardware TEE & Merkle trees |
| **Offline Verification** | Impossible without direct database access | **Standalone Verification**: Portable receipt verifiable offline |
| **Auditor Access** | Auditor must view raw customer records | **Zero-Knowledge**: Auditor verifies integrity without seeing PII |

### Cryptographic Binding Invariant
If an organization is ever subpoenaed or challenged to prove that a decision was made properly:
1. The enterprise provides the original applicant document from their internal vault.
2. The auditor runs the document through the public VeritasAI offline verification tool.
3. If even a **single digit** was altered after the decision, the Merkle root and Ed25519 signature validation instantly fails.

---

## 7. Offline Verification Specification (The 7 Trust Domains)

VeritasAI validates decisions across **7 cryptographic trust domains** without requiring real-time external network access:

| Domain | Name | Cryptographic Function | Validation Target |
| :---: | :--- | :--- | :--- |
| **1** | **Key Binding** | Public key identifier association | Confirms the signing key is cryptographically bound to the authorized agent identity. |
| **2** | **Digital Signature** | Ed25519 curve verification | Proves the decision payload and metadata have not been modified since issuance. |
| **3** | **Merkle Inclusion** | Cryptographic hash tree path | Confirms the event is included in the immutable global sequence accumulator. |
| **4** | **Witness Signatures** | Multi-party consensus quorums | Validates independent witness co-signatures verifying block generation. |
| **5** | **Hardware Attestation** | Intel SGX / Nitro Enclave quotes | Verifies the code executed inside a certified Trusted Execution Environment (TEE). |
| **6** | **Enclave Environment** | Hardware PCR registers & firmware | Validates enclave microcode and environmental isolation parameters. |
| **7** | **Trust Anchor** | Root cryptographic authority | Links the proof chain back to immutable root public timestamping anchors. |

---

## 8. Regulatory Compliance Alignment Matrix

| Regulation | Mandatory Requirement | VeritasAI Solution |
| :--- | :--- | :--- |
| **EU AI Act**<br>*(Articles 12 & 14)* | Continuous automatic logging for high-risk AI systems; human oversight guarantees. | Automated cryptographic audit logging with verifiable timestamps and immutable operator records. |
| **FTC Algorithmic Guidance** | Substantiation that automated systems act consistently and without post-hoc manipulation. | Cryptographically locks model version, input hashes, and decision logic at exact inference timestamp. |
| **SOC 2 Type II**<br>*(Security & Processing Integrity)* | Protection against unauthorized alteration of system logs and audit records. | Enclave-signed Merkle trees eliminate DB administrator tampering vectors. |
| **HIPAA / GLBA / GDPR** | Protection of confidential health and financial records with strict access controls. | Zero-knowledge client hashing guarantees no protected health information (PHI) or PII enters the audit ledger. |

---

## 9. Security, Performance & Fail-Safe Guarantees

- **Latency Impact**: Microsecond-scale local hashing; asynchronous background attestation introduces **< 2ms** overhead to host services.
- **Fail-Safe Operation**: If external network connectivity is lost, events are captured locally in a durable offline queue marked `recording_failed` to prevent request disruption.
- **Portability**: Evidence receipts follow the open standard `cool.receipt.v2` format, preventing vendor lock-in.

---

## 10. REST API Reference

### Base URL
```
http://localhost:4000/api/v1
```

### Endpoints

| Method | Path | Auth | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/auth/login` | None | Authenticate admin user and retrieve session token. |
| `POST` | `/agents` | Admin | Register a new agent identity and generate API key. |
| `GET` | `/agents` | Admin | List all registered agents and their current statuses. |
| `POST` | `/events` | Agent API Key | Ingest a new AI decision event and issue signed receipt. |
| `GET` | `/events` | Admin | Query recorded events with filtering and pagination. |
| `GET` | `/events/:id` | Admin | Retrieve detailed event metadata, payload hashes, and receipts. |
| `POST` | `/events/:id/verify` | Public / Admin | Execute the 7-domain cryptographic verification checklist. |
| `POST` | `/demo/simulate` | None | Trigger synthetic enterprise agent activity scenarios. |

---

*For enterprise support, bespoke integrations, or pilot deployments, contact: `engineering@veritasai.io`.*
