import crypto from "crypto";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { query, queryOne } from "./db";

export type UserRole = "user" | "vendor" | "moderator" | "admin";

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  email_verified: boolean;
  theme: string;
}

export interface SessionPayload {
  sub: string;
  sid: string;
  role: UserRole;
}

const COOKIE_NAME = "prism_session";
const JWT_SECRET = () => process.env.JWT_SECRET || "dev-secret-change-me";
const JWT_EXPIRES = () => process.env.JWT_EXPIRES_IN || "7d";

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string, role: UserRole): Promise<string> {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const session = await queryOne<{ id: string }>(
    `INSERT INTO sessions (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)
     RETURNING id`,
    [userId, tokenHash, expiresAt]
  );

  if (!session) throw new Error("Failed to create session");

  const jwtToken = jwt.sign(
    { sub: userId, sid: session.id, role } satisfies SessionPayload,
    JWT_SECRET(),
    { expiresIn: JWT_EXPIRES() }
  );

  return jwtToken;
}

export async function destroySession(sessionId: string): Promise<void> {
  await query("DELETE FROM sessions WHERE id = $1", [sessionId]);
}

export async function getUserById(id: string): Promise<AuthUser | null> {
  return queryOne<AuthUser>(
    `SELECT id, email, name, role, email_verified, theme FROM users WHERE id = $1`,
    [id]
  );
}

export async function getUserByEmail(email: string): Promise<
  (AuthUser & { password_hash: string }) | null
> {
  return queryOne<AuthUser & { password_hash: string }>(
    `SELECT id, email, name, role, email_verified, theme, password_hash
     FROM users WHERE email = $1`,
    [email.toLowerCase()]
  );
}

export async function verifySessionToken(token: string): Promise<AuthUser | null> {
  try {
    const payload = jwt.verify(token, JWT_SECRET()) as SessionPayload;
    const session = await queryOne<{ id: string; expires_at: string }>(
      `SELECT id, expires_at FROM sessions WHERE id = $1`,
      [payload.sid]
    );
    if (!session || new Date(session.expires_at) < new Date()) return null;
    return getUserById(payload.sub);
  } catch {
    return null;
  }
}

export function getTokenFromRequest(request: Request): string | null {
  const auth = request.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7);

  const cookie = request.headers.get("cookie") ?? "";
  const match = cookie.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export async function getAuthUser(request: Request): Promise<AuthUser | null> {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  return verifySessionToken(token);
}

export function sessionCookie(token: string): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  const maxAge = 7 * 24 * 60 * 60;
  return `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

export function clearSessionCookie(): string {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export function hasRole(user: AuthUser | null, ...roles: UserRole[]): boolean {
  return !!user && roles.includes(user.role);
}

export function unauthorized(message = "Unauthorized"): Response {
  return Response.json({ error: message }, { status: 401 });
}

export function forbidden(message = "Forbidden"): Response {
  return Response.json({ error: message }, { status: 403 });
}

export async function requireAuth(request: Request): Promise<AuthUser | Response> {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  return user;
}

export async function requireRole(
  request: Request,
  ...roles: UserRole[]
): Promise<AuthUser | Response> {
  const user = await requireAuth(request);
  if (user instanceof Response) return user;
  if (!hasRole(user, ...roles)) return forbidden();
  return user;
}

export async function logAudit(
  actorId: string | null,
  actor: string,
  action: string,
  target: string,
  details?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await query(
    `INSERT INTO audit_log (actor_id, actor, action, target, details, metadata)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [actorId, actor, action, target, details ?? null, metadata ? JSON.stringify(metadata) : null]
  );
}
