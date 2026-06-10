import { createAPIFileRoute } from "@/lib/create-api-file-route";
import jwt from "jsonwebtoken";
import { clearSessionCookie, destroySession, type SessionPayload } from "@/lib/auth";

export const APIRoute = createAPIFileRoute("/api/auth/logout")({
  POST: async ({ request }) => {
    try {
      const auth = request.headers.get("authorization");
      const cookie = request.headers.get("cookie") ?? "";
      const cookieMatch = cookie.match(/prism_session=([^;]+)/);
      const token = auth?.startsWith("Bearer ") ? auth.slice(7) : cookieMatch ? decodeURIComponent(cookieMatch[1]) : null;

      if (token) {
        try {
          const payload = jwt.verify(token, process.env.JWT_SECRET || "dev-secret-change-me") as SessionPayload;
          await destroySession(payload.sid);
        } catch {
          // ignore invalid token
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Set-Cookie": clearSessionCookie(),
        },
      });
    } catch (error) {
      console.error("Logout error:", error);
      return Response.json({ error: "Logout failed" }, { status: 500 });
    }
  },
});
