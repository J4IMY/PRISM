import { createAPIFileRoute } from "@tanstack/react-start/api";
import crypto from "crypto";
import { query, queryOne } from "@/lib/db";
import { requireRole, logAudit } from "@/lib/auth";
import { sendEmail } from "@/lib/email";

function extractDomain(urlOrEmail: string): string | null {
  try {
    if (urlOrEmail.includes("@")) {
      return urlOrEmail.split("@")[1]?.toLowerCase() ?? null;
    }
    const url = urlOrEmail.startsWith("http") ? urlOrEmail : `https://${urlOrEmail}`;
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

export const APIRoute = createAPIFileRoute("/api/claims")({
  POST: async ({ request }) => {
    const user = await requireRole(request, "vendor", "admin");
    if (user instanceof Response) return user;

    const body = (await request.json()) as { system_id?: string; claim_email?: string };
    if (!body.system_id || !body.claim_email) {
      return Response.json({ error: "system_id and claim_email required" }, { status: 400 });
    }

    const system = await queryOne<{
      id: string;
      is_scraped: boolean;
      is_claimed: boolean;
      website_url: string | null;
      name: string;
    }>("SELECT id, is_scraped, is_claimed, website_url, name FROM systems WHERE id = $1", [body.system_id]);

    if (!system) return Response.json({ error: "System not found" }, { status: 404 });
    if (!system.is_scraped) return Response.json({ error: "System is not a scraped listing" }, { status: 400 });
    if (system.is_claimed) return Response.json({ error: "System already claimed" }, { status: 409 });

    const vendor = await queryOne<{ id: string; website: string | null }>(
      `SELECT v.id, v.website FROM vendors v
       JOIN vendor_members vm ON vm.vendor_id = v.id
       WHERE vm.user_id = $1 LIMIT 1`,
      [user.id]
    );
    if (!vendor) return Response.json({ error: "Create a vendor profile first" }, { status: 400 });

    const claimDomain = extractDomain(body.claim_email);
    const vendorDomain = extractDomain(vendor.website ?? body.claim_email);
    const systemDomain = system.website_url ? extractDomain(system.website_url) : null;

    if (!claimDomain || !vendorDomain) {
      return Response.json({ error: "Could not verify email domain" }, { status: 400 });
    }

    const domainMatch =
      claimDomain === vendorDomain || (systemDomain && claimDomain === systemDomain);

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const claims = await query(
      `INSERT INTO system_claims (system_id, vendor_id, user_id, claim_email, domain_verified, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [body.system_id, vendor.id, user.id, body.claim_email.toLowerCase(), domainMatch, domainMatch ? "verified" : "pending"]
    );

    if (domainMatch) {
      await query(
        `UPDATE systems SET vendor_id = $1, is_claimed = true, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
        [vendor.id, body.system_id]
      );
      await query(
        `UPDATE vendor_threads SET messaging_blocked = false WHERE system_id = $1`,
        [body.system_id]
      );
      await logAudit(user.id, user.email, "claim.verified", body.system_id, system.name);
      return Response.json({ claim: claims[0], verified: true });
    }

    await query(
      `INSERT INTO verification_tokens (user_id, token, type, expires_at, metadata)
       VALUES ($1, $2, 'vendor_claim', $3, $4)`,
      [user.id, token, expiresAt, JSON.stringify({ claim_id: claims[0].id, system_id: body.system_id })]
    );

    const baseUrl = process.env.APP_URL || "http://localhost:5000";
    try {
      await sendEmail({
        to: body.claim_email,
        subject: `Verify your claim for ${system.name}`,
        text: `Verify domain ownership: ${baseUrl}/vendor/claims/verify?token=${token}`,
      });
    } catch (err) {
      console.error("Claim email failed:", err);
    }

    return Response.json({ claim: claims[0], verified: false, message: "Verification email sent" });
  },
});
