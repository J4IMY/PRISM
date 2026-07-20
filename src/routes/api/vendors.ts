import { createAPIFileRoute } from "@/lib/create-api-file-route";
import { query, queryOne } from "@/lib/db";
import { requireAuth, requireRole, logAudit } from "@/lib/auth";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export const APIRoute = createAPIFileRoute("/api/vendors")({
  GET: async ({ request }) => {
    const user = await requireAuth(request);
    if (user instanceof Response) return user;

    try {
      const vendor = await queryOne(
        `SELECT v.* FROM vendors v
         JOIN vendor_members vm ON vm.vendor_id = v.id
         WHERE vm.user_id = $1
         LIMIT 1`,
        [user.id],
      );
      if (!vendor) {
        return Response.json({ vendor: null });
      }

      const technologies = await query(
        `SELECT id, name, color FROM technologies WHERE vendor_id = $1 ORDER BY name`,
        [vendor.id],
      );
      const contacts = await query(
        `SELECT id, name, role, email, avatar_url FROM contacts WHERE vendor_id = $1 ORDER BY name`,
        [vendor.id],
      );

      return Response.json({
        vendor,
        technologies,
        contacts,
      });
    } catch (err) {
      console.error("GET /api/vendors error:", err);
      return Response.json({ error: "Failed to fetch vendor" }, { status: 500 });
    }
  },

  POST: async ({ request }) => {
    const user = await requireAuth(request);
    if (user instanceof Response) return user;

    try {
      const body = (await request.json()) as {
        company_name?: string;
        logo_url?: string;
        website?: string;
        description?: string;
        industry?: string;
        company_size?: string;
        founded_date?: string;
        location?: string;
        location_label?: string;
      };

      if (!body.company_name) {
        return Response.json({ error: "company_name is required" }, { status: 400 });
      }

      const existing = await queryOne(
        "SELECT v.id FROM vendors v JOIN vendor_members vm ON vm.vendor_id = v.id WHERE vm.user_id = $1",
        [user.id],
      );
      if (existing) {
        return Response.json({ error: "You already have a vendor profile" }, { status: 409 });
      }

      let slug = slugify(body.company_name);
      const slugConflict = await queryOne("SELECT id FROM vendors WHERE slug = $1", [slug]);
      if (slugConflict) slug = `${slug}-${Date.now()}`;

      const vendors = await query(
        `INSERT INTO vendors (
           owner_user_id, company_name, slug, logo_url, website, description,
           industry, company_size, founded_date, location, location_label
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING *`,
        [
          user.id,
          body.company_name,
          slug,
          body.logo_url ?? null,
          body.website ?? null,
          body.description ?? null,
          body.industry ?? null,
          body.company_size ?? null,
          body.founded_date ?? null,
          body.location ?? null,
          body.location_label ?? null,
        ],
      );

      await query(
        `INSERT INTO vendor_members (vendor_id, user_id, role, can_manage_systems, can_manage_team, can_respond_messages)
         VALUES ($1, $2, 'dev', true, true, true)`,
        [vendors[0].id, user.id],
      );

      if (user.role === "user") {
        await query("UPDATE users SET role = 'vendor' WHERE id = $1", [user.id]);
      }

      await logAudit(
        user.id,
        user.email,
        "vendor.create",
        vendors[0].id as string,
        body.company_name,
      );
      return Response.json({ vendor: vendors[0] }, { status: 201 });
    } catch (err) {
      console.error("POST /api/vendors error:", err);
      return Response.json({ error: "Failed to create vendor" }, { status: 500 });
    }
  },

  PATCH: async ({ request }) => {
    const user = await requireRole(request, "vendor", "admin");
    if (user instanceof Response) return user;

    try {
      const body = (await request.json()) as Record<string, unknown>;
      const member = await queryOne<{ vendor_id: string; can_manage_team: boolean }>(
        `SELECT vendor_id, can_manage_team FROM vendor_members
         WHERE user_id = $1 AND role IN ('dev', 'sales', 'support')`,
        [user.id],
      );
      if (!member && user.role !== "admin") {
        return Response.json({ error: "Not authorized to update vendor" }, { status: 403 });
      }

      const vendorId = member?.vendor_id ?? (body.vendor_id as string);
      if (!vendorId) {
        return Response.json({ error: "No vendor profile found" }, { status: 404 });
      }

      const fields: string[] = [];
      const params: unknown[] = [];
      let idx = 1;
      const allowed = [
        "company_name",
        "logo_url",
        "website",
        "description",
        "industry",
        "company_size",
        "founded_date",
        "location",
        "location_label",
        "social_links",
        "video_links",
      ];
      for (const key of allowed) {
        if (body[key] !== undefined) {
          fields.push(`${key} = $${idx++}`);
          params.push(
            key === "social_links" || key === "video_links" ? JSON.stringify(body[key]) : body[key],
          );
        }
      }
      if (fields.length === 0) {
        return Response.json({ error: "No fields to update" }, { status: 400 });
      }
      fields.push("updated_at = CURRENT_TIMESTAMP");
      params.push(vendorId);

      const vendors = await query(
        `UPDATE vendors SET ${fields.join(", ")} WHERE id = $${idx} RETURNING *`,
        params,
      );
      return Response.json({ vendor: vendors[0] });
    } catch (err) {
      console.error("PATCH /api/vendors error:", err);
      return Response.json({ error: "Failed to update vendor" }, { status: 500 });
    }
  },
});
