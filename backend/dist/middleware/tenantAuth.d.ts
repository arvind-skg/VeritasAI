/**
 * VeritasAI Authentication & Tenant Isolation Middleware
 *
 * Enforces:
 * 1. Organization User Authentication (JWT)
 * 2. Agent API Key Authentication (Hashed vra_live_/vra_test_ keys)
 * 3. Strict multi-tenant isolation
 */
import type { Request, Response, NextFunction } from "express";
import { type UserTokenPayload } from "../services/security.js";
declare global {
    namespace Express {
        interface Request {
            user?: UserTokenPayload;
            orgId?: string;
            agent?: any;
            agentCredentialId?: string;
            requestId?: string;
        }
    }
}
/**
 * Request ID injector for distributed tracing and auditability.
 */
export declare function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void;
/**
 * Middleware for Organization Users (Dashboard access, Agent management).
 * Authenticates JWT bearer token and enforces tenant context.
 */
export declare function orgAuth(req: Request, res: Response, next: NextFunction): Promise<void>;
/**
 * Middleware for AI Agent telemetry ingestion (Python SDK / REST API).
 * Authenticates agent API keys (vra_live_... / vra_test_...) with cryptographic hashing.
 */
export declare function agentAuth(req: Request, res: Response, next: NextFunction): Promise<void>;
/**
 * Combined authentication allowing either an Organization User OR an Agent Key.
 * Useful for read/verify endpoints accessed by either dashboard users or automated SDKs.
 */
export declare function combinedAuth(req: Request, res: Response, next: NextFunction): Promise<void>;
