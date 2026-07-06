import { createAPIFileRoute } from "@/lib/create-api-file-route";
import crypto from "crypto";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";

export const APIRoute = createAPIFileRoute("/api/auth/google")({
  GET: async () => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const appUrl = process.env.APP_URL || "http://localhost:5000";

    if (!clientId) {
      return Response.redirect(`${appUrl}/auth/login?google=unavailable`);
    }

    const state = crypto.randomBytes(16).toString("hex");
    const redirectUri = `${appUrl}/api/auth/google/callback`;
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile",
      state,
      prompt: "select_account",
    });

    const headers = new Headers();
    headers.set(
      "Set-Cookie",
      `prism_oauth_state=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`,
    );
    headers.set("Location", `${GOOGLE_AUTH_URL}?${params.toString()}`);

    return new Response(null, { status: 302, headers });
  },
});
