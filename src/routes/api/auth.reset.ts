import { createAPIFileRoute } from "@tanstack/react-start/api";
import { query, queryOne } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

export const APIRoute = createAPIFileRoute("/api/auth/reset")({
  POST: async ({ request }) => {
    try {
      const body = (await request.json()) as { token?: string; password?: string };
      const { token, password } = body;

      if (!token || !password) {
        return Response.json({ error: "Token and password are required" }, { status: 400 });
      }
      if (password.length < 8) {
        return Response.json({ error: "Password must be at least 8 characters" }, { status: 400 });
      }

      const record = await queryOne<{
        id: string;
        user_id: string;
        expires_at: string;
        used_at: string | null;
      }>(
        `SELECT id, user_id, expires_at, used_at FROM verification_tokens
         WHERE token = $1 AND type = 'password_reset'`,
        [token]
      );

      if (!record) {
        return Response.json({ error: "Invalid reset token" }, { status: 404 });
      }
      if (record.used_at) {
        return Response.json({ error: "Reset token already used" }, { status: 400 });
      }
      if (new Date(record.expires_at) < new Date()) {
        return Response.json({ error: "Reset token expired" }, { status: 400 });
      }

      const passwordHash = await hashPassword(password);
      await query("UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2", [
        passwordHash,
        record.user_id,
      ]);
      await query("UPDATE verification_tokens SET used_at = CURRENT_TIMESTAMP WHERE id = $1", [record.id]);
      await query("DELETE FROM sessions WHERE user_id = $1", [record.user_id]);

      return Response.json({ success: true, message: "Password updated. You can now sign in." });
    } catch (error) {
      console.error("Reset password error:", error);
      return Response.json({ error: "Reset failed" }, { status: 500 });
    }
  },
});
