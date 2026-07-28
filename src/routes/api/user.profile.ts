import { createAPIFileRoute } from "@/lib/create-api-file-route";
import { query, queryOne } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export const APIRoute = createAPIFileRoute("/api/user/profile")({
  PATCH: async ({ request }) => {
    const user = await requireAuth(request);
    if (user instanceof Response) return user;

    const body = (await request.json()) as {
      name?: string;
      email?: string;
      username?: string;
    };

    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    const name = (body.name ?? "").trim();
    const email = (body.email ?? "").trim().toLowerCase();
    const username = body.username ? body.username.trim() : undefined;

    if (name) {
      fields.push(`name = $${idx++}`);
      values.push(name);
    }

    if (email) {
      const existing = await queryOne<{ id: string }>(
        "SELECT id FROM users WHERE email = $1 AND id <> $2",
        [email, user.id],
      );
      if (existing) {
        return Response.json({ error: "Email is already in use" }, { status: 409 });
      }
      fields.push(`email = $${idx++}`);
      values.push(email);
    }

    if (username !== undefined) {
      const existing = await queryOne<{ id: string }>(
        "SELECT id FROM users WHERE username = $1 AND id <> $2",
        [username, user.id],
      );
      if (existing) {
        return Response.json({ error: "Username is already taken" }, { status: 409 });
      }
      fields.push(`username = $${idx++}`);
      values.push(username || null);
    }

    if (!fields.length) {
      return Response.json({ error: "No fields to update" }, { status: 400 });
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(user.id);

    const updated = await queryOne(
      `UPDATE users SET ${fields.join(", ")} WHERE id = $${idx} RETURNING id, name, email, username`,
      values,
    );

    return Response.json({ user: updated });
  },
});
