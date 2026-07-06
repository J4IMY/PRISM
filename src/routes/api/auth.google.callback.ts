import { createAPIFileRoute } from "@/lib/create-api-file-route";
import crypto from "crypto";
import { query } from "@/lib/db";
import { createSession, hashPassword, sessionCookie, type UserRole } from "@/lib/auth";

interface GoogleTokenResponse {
  access_token: string;
  id_token?: string;
}

interface GoogleUserInfo {
  email: string;
  name?: string;
  email_verified?: boolean;
}

export const APIRoute = createAPIFileRoute("/api/auth/google/callback")({
  GET: async ({ request }) => {
    const appUrl = process.env.APP_URL || "http://localhost:5000";
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const error = url.searchParams.get("error");

    if (error || !code) {
      return Response.redirect(`${appUrl}/auth/login?google=error`);
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      return Response.redirect(`${appUrl}/auth/login?google=unavailable`);
    }

    const cookie = request.headers.get("cookie") ?? "";
    const stateMatch = cookie.match(/prism_oauth_state=([^;]+)/);
    const savedState = stateMatch ? decodeURIComponent(stateMatch[1]) : null;
    const returnedState = url.searchParams.get("state");
    if (!savedState || savedState !== returnedState) {
      return Response.redirect(`${appUrl}/auth/login?google=error`);
    }

    const redirectUri = `${appUrl}/api/auth/google/callback`;

    try {
      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      });

      if (!tokenRes.ok) {
        console.error("Google token exchange failed:", await tokenRes.text());
        return Response.redirect(`${appUrl}/auth/login?google=error`);
      }

      const tokens = (await tokenRes.json()) as GoogleTokenResponse;

      const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });

      if (!userRes.ok) {
        return Response.redirect(`${appUrl}/auth/login?google=error`);
      }

      const profile = (await userRes.json()) as GoogleUserInfo;
      if (!profile.email) {
        return Response.redirect(`${appUrl}/auth/login?google=error`);
      }

      const email = profile.email.toLowerCase();
      const existing = await query<{
        id: string;
        role: UserRole;
        email_verified: boolean;
      }>("SELECT id, role, email_verified FROM users WHERE email = $1", [email]);

      let userId: string;
      let role: UserRole;

      if (existing.length > 0) {
        userId = existing[0].id;
        role = existing[0].role;
        if (!existing[0].email_verified) {
          await query(
            "UPDATE users SET email_verified = true, email_verified_at = CURRENT_TIMESTAMP WHERE id = $1",
            [userId],
          );
        }
      } else {
        const placeholderHash = await hashPassword(crypto.randomUUID());
        const created = await query<{ id: string; role: UserRole }>(
          `INSERT INTO users (email, password_hash, name, role, email_verified, email_verified_at)
           VALUES ($1, $2, $3, 'user', true, CURRENT_TIMESTAMP)
           RETURNING id, role`,
          [email, placeholderHash, profile.name ?? null],
        );
        userId = created[0].id;
        role = created[0].role;
      }

      const jwtToken = await createSession(userId, role);
      const clearState = "prism_oauth_state=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0";

      const headers = new Headers();
      headers.set("Location", `${appUrl}/`);
      headers.append("Set-Cookie", sessionCookie(jwtToken));
      headers.append("Set-Cookie", clearState);
      return new Response(null, { status: 302, headers });
    } catch (err) {
      console.error("Google OAuth callback error:", err);
      return Response.redirect(`${appUrl}/auth/login?google=error`);
    }
  },
});
