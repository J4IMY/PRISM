import { createAPIFileRoute } from "@tanstack/react-start/api";
import crypto from "crypto";
import { query } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { sendVerificationEmail } from "@/lib/email";

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(password: string): { valid: boolean; message?: string } {
  if (!password || password.length < 8) {
    return { valid: false, message: "Password must be at least 8 characters" };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: "Password must contain at least one uppercase letter" };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: "Password must contain at least one lowercase letter" };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: "Password must contain at least one number" };
  }
  return { valid: true };
}

export const APIRoute = createAPIFileRoute("/api/auth/signup")({
  POST: async ({ request }) => {
    try {
      const body = (await request.json()) as {
        email?: string;
        password?: string;
        name?: string;
      };
      const { email, password, name } = body;

      if (!email || !password) {
        return Response.json({ success: false, error: "Email and password are required" }, { status: 400 });
      }
      if (!validateEmail(email)) {
        return Response.json({ success: false, error: "Invalid email format" }, { status: 400 });
      }

      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        return Response.json({ success: false, error: passwordValidation.message }, { status: 400 });
      }

      const existing = await query<{ id: string }>(
        "SELECT id FROM users WHERE email = $1",
        [email.toLowerCase()]
      );
      if (existing.length > 0) {
        return Response.json({ success: false, error: "Email already registered" }, { status: 409 });
      }

      const passwordHash = await hashPassword(password);
      const users = await query<{ id: string; email: string; name: string | null }>(
        `INSERT INTO users (email, password_hash, name, role)
         VALUES ($1, $2, $3, 'user')
         RETURNING id, email, name`,
        [email.toLowerCase(), passwordHash, name || null]
      );
      const user = users[0];

      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await query(
        `INSERT INTO verification_tokens (user_id, token, type, expires_at)
         VALUES ($1, $2, 'email_verification', $3)`,
        [user.id, token, expiresAt]
      );

      const baseUrl = process.env.APP_URL || "http://localhost:5000";
      const verificationUrl = `${baseUrl}/auth/verify?token=${token}`;
      try {
        await sendVerificationEmail(user.email, verificationUrl, user.name ?? undefined);
      } catch (emailError) {
        console.error("Failed to send verification email:", emailError);
      }

      return Response.json(
        {
          success: true,
          message: "Account created! Check your email to verify your address.",
          user: { id: user.id, email: user.email, name: user.name ?? undefined },
        },
        { status: 201 }
      );
    } catch (error) {
      console.error("Signup error:", error);
      return Response.json({ success: false, error: "Failed to create account" }, { status: 500 });
    }
  },
});
