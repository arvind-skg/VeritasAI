# VeritasAI — MVP

Cryptographic evidence infrastructure for AI systems — an audit-trail & compliance dashboard for AI agents, built on `cool-nwc` (the CooL SDK).

## Overview

VeritasAI wraps every AI agent action in a cryptographically verifiable receipt and gives compliance teams a dashboard where they — or an outside auditor — can re-verify any decision offline, without ever seeing the underlying customer data.

## Features

1. **Agent Registration**: Register agents and generate API keys.
2. **Fail-Safe Recording**: Agents continue working even if evidence recording fails.
3. **Evidence Dashboard**: Real-time monitoring of agent decisions.
4. **Offline Verification**: 7-domain cryptographically verifiable proofs using CooL SDK (`cool-nwc`).

## Tech Stack

- **Backend**: Node.js, Express, TypeScript, Prisma (SQLite), `cool-nwc`.
- **Frontend**: React, Vite, TailwindCSS (v4), React Router.
- **Deployment**: Docker Compose.

## Getting Started

### Prerequisites

- Node.js >= 20
- npm

### Local Development

1. **Start the Backend**:
   ```bash
   cd backend
   npm install
   npx prisma generate
   npx prisma migrate dev
   npm run dev
   ```

2. **Start the Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. **Run Python AI Agent Simulations (Optional)**:
   ```bash
   cd sdk/python
   pip install -e .
   python examples/loan_approval_agent.py
   ```

### Docker Deployment

To run the entire stack using Docker Compose:

```bash
docker-compose up --build
```
- Frontend will be available at `http://localhost:8080`
- Backend API will be available at `http://localhost:4000/api/v1`

## Demo / Usage

1. Open the dashboard (Default login: `veritasai-admin`).
2. Navigate to **Run Demo**.
3. Click **Simulate Agent Activity** to generate the flagship loan-approval scenarios (including #8421).
4. Go to **Dashboard**, select an event, and click **Run Verification** to cryptographically verify the 7 domains.

## Integration & Architecture Guide

For the full whitepaper, architectural diagrams, integration patterns (Python, TypeScript, REST API), zero-knowledge privacy architecture, and regulatory compliance mapping, see [VERITASAI_INTEGRATION_GUIDE.md](file:///d:/reverse%20hackathon%201/veritasai/VERITASAI_INTEGRATION_GUIDE.md).
