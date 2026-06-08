import { redirect } from "@tanstack/react-router";
import type { AuthUser, UserRole } from "./auth";

export function requireUser(user: AuthUser | null | undefined, redirectTo = "/auth/login") {
  if (!user) throw redirect({ to: redirectTo });
  return user;
}

export function requireRoles(user: AuthUser | null | undefined, roles: UserRole[], redirectTo = "/") {
  const u = requireUser(user);
  if (!roles.includes(u.role)) throw redirect({ to: redirectTo });
  return u;
}
