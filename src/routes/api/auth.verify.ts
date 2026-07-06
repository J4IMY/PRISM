import { createAPIFileRoute } from "@/lib/create-api-file-route";
import { query } from "@/lib/db";

export const APIRoute = createAPIFileRoute("/api/auth/verify")({
  GET: async ({ request }) => {
    try {
      const url = new URL(request.url);
      const token = url.searchParams.get("token");

      if (!token) {
        return Response.json(
          { success: false, error: "Verification token is required" },
          { status: 400 },
        );
      }

      const tokens = await query<{
        id: string;
        user_id: string;
        expires_at: string;
        used_at: string | null;
      }>(
        `SELECT id, user_id, expires_at, used_at FROM verification_tokens
         WHERE token = $1 AND type = 'email_verification'`,
        [token],
      );

      if (tokens.length === 0) {
        return Response.json(
          { success: false, error: "Invalid verification token" },
          { status: 404 },
        );
      }

      const tokenRecord = tokens[0];
      if (tokenRecord.used_at) {
        return Response.json(
          { success: false, error: "This verification token has already been used" },
          { status: 400 },
        );
      }
      if (new Date(tokenRecord.expires_at) < new Date()) {
        return Response.json(
          { success: false, error: "Verification token has expired" },
          { status: 400 },
        );
      }

      await query(`UPDATE verification_tokens SET used_at = CURRENT_TIMESTAMP WHERE id = $1`, [
        tokenRecord.id,
      ]);
      const users = await query<{ id: string; email: string; name: string | null }>(
        `UPDATE users SET email_verified = true, email_verified_at = CURRENT_TIMESTAMP
         WHERE id = $1 RETURNING id, email, name`,
        [tokenRecord.user_id],
      );

      const user = users[0];
      return Response.json({
        success: true,
        message: "Email verified successfully! You can now log in.",
        user: { id: user.id, email: user.email, name: user.name ?? undefined },
      });
    } catch (error) {
      console.error("Verification error:", error);
      return Response.json({ success: false, error: "Failed to verify email" }, { status: 500 });
    }
  },
});
