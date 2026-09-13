/**
 * Organization Authentication & Profile Routes
 */
import { Router, type Request, type Response } from "express";
import {
  createOrganization,
  createUser,
  getUserByEmail,
  getUserById,
  getOrganizationStats,
  createAgent,
  createAuditLog,
} from "../services/db.js";
import {
  hashPassword,
  verifyPassword,
  generateToken,
} from "../services/security.js";
import { orgAuth } from "../middleware/tenantAuth.js";

const router = Router();

/**
 * POST /api/v1/auth/register
 * Register a new organization and admin account.
 */
router.post("/register", async (req: Request, res: Response) => {
  try {
    const { orgName, email, password, name } = req.body;

    if (!orgName || !email || !password) {
      res.status(400).json({
        error: "Missing required fields: orgName, email, password are required",
        requestId: req.requestId,
      });
      return;
    }

    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      res.status(409).json({
        error: "User with this email already exists",
        requestId: req.requestId,
      });
      return;
    }

    // 1. Create Organization
    const organization = await createOrganization(orgName.trim());

    // 2. Create Admin User
    const passwordHash = await hashPassword(password);
    const user = await createUser(
      organization.id,
      email,
      passwordHash,
      name?.trim() || "Administrator",
      "ADMIN"
    );

    // 3. Create a Default Starter Agent
    const { agent, credential } = await createAgent(organization.id, {
      name: `${orgName.trim()} Primary Agent`,
      description: "Default AI decision agent created on organization onboarding",
      type: "CUSTOM",
      environment: "PRODUCTION",
    });

    // 4. Audit Log
    await createAuditLog(
      organization.id,
      "ORGANIZATION_REGISTERED",
      "ORGANIZATION",
      organization.id,
      user.id,
      { orgName, email }
    );

    // 5. Issue JWT
    const token = generateToken({
      userId: user.id,
      orgId: organization.id,
      role: user.role,
    });

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      organization: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
      },
      starterAgent: {
        id: agent.id,
        name: agent.name,
        apiKey: credential.rawKey,
      },
      requestId: req.requestId,
    });
  } catch (err) {
    console.error("[VeritasAI Auth] Registration error:", err);
    res.status(500).json({ error: "Internal server error during registration", requestId: req.requestId });
  }
});

/**
 * POST /api/v1/auth/login
 * Log in to an organization account.
 */
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        error: "Email and password are required",
        requestId: req.requestId,
      });
      return;
    }

    const user = await getUserByEmail(email);
    if (!user) {
      res.status(401).json({
        error: "Invalid email or password",
        requestId: req.requestId,
      });
      return;
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      res.status(401).json({
        error: "Invalid email or password",
        requestId: req.requestId,
      });
      return;
    }

    const token = generateToken({
      userId: user.id,
      orgId: user.organization.id,
      role: user.role,
    });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      organization: {
        id: user.organization.id,
        name: user.organization.name,
        slug: user.organization.slug,
      },
      requestId: req.requestId,
    });
  } catch (err) {
    console.error("[VeritasAI Auth] Login error:", err);
    res.status(500).json({ error: "Internal server error during login", requestId: req.requestId });
  }
});

/**
 * GET /api/v1/auth/me
 * Get current authenticated user profile and organization.
 */
router.get("/me", orgAuth, async (req: Request, res: Response) => {
  try {
    const user = await getUserById(req.user!.userId);
    if (!user) {
      res.status(404).json({ error: "User not found", requestId: req.requestId });
      return;
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      organization: {
        id: user.organization.id,
        name: user.organization.name,
        slug: user.organization.slug,
      },
      requestId: req.requestId,
    });
  } catch (err) {
    console.error("[VeritasAI Auth] /me error:", err);
    res.status(500).json({ error: "Internal server error", requestId: req.requestId });
  }
});

/**
 * GET /api/v1/auth/stats
 * Get organization-wide overview statistics.
 */
router.get("/stats", orgAuth, async (req: Request, res: Response) => {
  try {
    const stats = await getOrganizationStats(req.orgId!);
    res.json({ stats, requestId: req.requestId });
  } catch (err) {
    console.error("[VeritasAI Auth] /stats error:", err);
    res.status(500).json({ error: "Internal server error", requestId: req.requestId });
  }
});

export default router;
