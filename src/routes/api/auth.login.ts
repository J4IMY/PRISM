import { createAPIFileRoute } from "@/lib/create-api-file-route";
import { query } from "@/lib/db";
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

      let redirectTo: string | undefined;
      try {
        const vendorFlags = await query<{ vendor_application: boolean }>(
          "SELECT vendor_application FROM users WHERE id = $1",
          [user.id]
        );
        if (vendorFlags[0]?.vendor_application) {
          redirectTo = "/vendor/company";
          await query("UPDATE users SET vendor_application = false WHERE id = $1", [user.id]);
        }
      } catch (vendorErr) {
        console.warn("vendor_application check skipped (run npm run migrate):", vendorErr);
      }

      const isMobile = request.headers.get("x-client") === "mobile";
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (!isMobile) {
        headers["Set-Cookie"] = sessionCookie(token);
      }

      return new Response(
        JSON.stringify({ user: authUser, token: isMobile ? token : undefined, redirectTo }),
        {
        status: 200,
        headers,
      });
    } catch (error) {
      console.error("Login error:", error);
      return Response.json({ error: "Login failed" }, { status: 500 });
    }
  },
});
