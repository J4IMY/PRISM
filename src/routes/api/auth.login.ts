import { createAPIFileRoute } from "@tanstack/react-start/api";
import {
  createSession,
  getUserByEmail,
  sessionCookie,
  verifyPassword,
  type UserRole,
} from "@/lib/auth";

export const APIRoute = createAPIFileRoute("/api/auth/login")({
  POST: async ({ request }) => {
    try {
      const body = (await request.json()) as { email?: string; password?: string };
      const { email, password } = body;

      if (!email || !password) {
        return Response.json({ error: "Email and password are required" }, { status: 400 });
      }

      const user = await getUserByEmail(email);
      if (!user) {
        return Response.json({ error: "Invalid email or password" }, { status: 401 });
      }

      const valid = await verifyPassword(password, user.password_hash);
      if (!valid) {
        return Response.json({ error: "Invalid email or password" }, { status: 401 });
      }

      if (!user.email_verified) {
        return Response.json({ error: "Please verify your email before signing in" }, { status: 403 });
      }

      const token = await createSession(user.id, user.role as UserRole);
      const authUser = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        email_verified: user.email_verified,
        theme: user.theme,
      };

      const isMobile = request.headers.get("x-client") === "mobile";
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (!isMobile) {
        headers["Set-Cookie"] = sessionCookie(token);
      }

      return new Response(JSON.stringify({ user: authUser, token: isMobile ? token : undefined }), {
        status: 200,
        headers,
      });
    } catch (error) {
      console.error("Login error:", error);
      return Response.json({ error: "Login failed" }, { status: 500 });
    }
  },
});
