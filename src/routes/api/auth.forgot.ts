import { createAPIFileRoute } from "@/lib/create-api-file-route";
import crypto from "crypto";
import { query, queryOne } from "@/lib/db";
import { isDevEnvironment, sendEmail, isConsoleMailer } from "@/lib/email";

export const APIRoute = createAPIFileRoute("/api/auth/forgot")({
  POST: async ({ request }) => {
    try {
      const body = (await request.json()) as { email?: string };
      const email = body.email?.toLowerCase().trim();

      if (!email) {
        return Response.json({ error: "Email is required" }, { status: 400 });
      }

      const user = await queryOne<{ id: string; email: string }>(
        "SELECT id, email FROM users WHERE email = $1",
        [email],
      );

      let devResetUrl: string | undefined;

      // Always return success to prevent email enumeration
      if (user) {
        const token = crypto.randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
        await query(
          `INSERT INTO verification_tokens (user_id, token, type, expires_at)
           VALUES ($1, $2, 'password_reset', $3)`,
          [user.id, token, expiresAt],
        );

        const baseUrl = process.env.APP_URL || "http://localhost:5000";
        const resetUrl = `${baseUrl}/auth/reset?token=${token}`;
        await sendEmail(
          {
            to: user.email,
            subject: "Reset your PRISM password",
            text: `Reset your password: ${resetUrl}\n\nThis link expires in 1 hour.`,
          },
          "password reset",
        );
        if (isDevEnvironment() && isConsoleMailer()) {
          devResetUrl = resetUrl;
        }
      }

      const response: Record<string, unknown> = {
        success: true,
        message: "If an account exists with that email, a reset link has been sent.",
      };
      if (devResetUrl) {
        response.devResetUrl = devResetUrl;
      }

      return Response.json(response);
    } catch (error) {
      console.error("Forgot password error:", error);
      return Response.json({ error: "Request failed" }, { status: 500 });
    }
  },
});
