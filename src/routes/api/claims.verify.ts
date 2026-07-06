import { createAPIFileRoute } from "@/lib/create-api-file-route";
import { query, queryOne } from "@/lib/db";
import { requireAuth, logAudit } from "@/lib/auth";

export const APIRoute = createAPIFileRoute("/api/claims/verify")({
  POST: async ({ request }) => {
    const user = await requireAuth(request);
    if (user instanceof Response) return user;

    const body = (await request.json()) as { token?: string };
    if (!body.token) return Response.json({ error: "token required" }, { status: 400 });

    const record = await queryOne<{
      id: string;
      user_id: string;
      expires_at: string;
      used_at: string | null;
      metadata: { claim_id?: string; system_id?: string };
    }>(
      `SELECT id, user_id, expires_at, used_at, metadata FROM verification_tokens
       WHERE token = $1 AND type = 'vendor_claim'`,
      [body.token],
    );

    if (!record) return Response.json({ error: "Invalid token" }, { status: 404 });
    if (record.used_at) return Response.json({ error: "Token already used" }, { status: 400 });
    if (new Date(record.expires_at) < new Date()) {
      return Response.json({ error: "Token expired" }, { status: 400 });
    }

    const claimId = record.metadata?.claim_id;
    const systemId = record.metadata?.system_id;
    if (!claimId || !systemId)
      return Response.json({ error: "Invalid claim data" }, { status: 400 });

    const claim = await queryOne<{ vendor_id: string }>(
      "SELECT vendor_id FROM system_claims WHERE id = $1",
      [claimId],
    );
    if (!claim) return Response.json({ error: "Claim not found" }, { status: 404 });

    await query(
      `UPDATE system_claims SET domain_verified = true, status = 'verified', verified_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [claimId],
    );
    await query(
      `UPDATE systems SET vendor_id = $1, is_claimed = true, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [claim.vendor_id, systemId],
    );
    await query(`UPDATE vendor_threads SET messaging_blocked = false WHERE system_id = $1`, [
      systemId,
    ]);
    await query(`UPDATE verification_tokens SET used_at = CURRENT_TIMESTAMP WHERE id = $1`, [
      record.id,
    ]);

    await logAudit(user.id, user.email, "claim.verified", systemId);

    return Response.json({ success: true });
  },
});
