import { createAPIFileRoute } from "@tanstack/react-start/api";
import { query } from "@/lib/db";

export type DeletionRequest = {
  id: string;
  email: string;
  requested_at: string;
  sla_days_left: number;
  status: string;
};

export const APIRoute = createAPIFileRoute("/api/deletions")({
  GET: async () => {
    try {
      const requests = await query<DeletionRequest>(
        `SELECT id, email, requested_at, sla_days_left, status
         FROM deletion_requests
         ORDER BY requested_at DESC`
      );
      return Response.json({ requests });
    } catch (err) {
      console.error("GET /api/deletions error:", err);
      return Response.json({ error: "Failed to fetch deletion requests" }, { status: 500 });
    }
  },

  POST: async ({ request }) => {
    try {
      const body = await request.json() as any;
      const { email, requested_at, sla_days_left, status } = body;

      const [req] = await query<DeletionRequest>(
        `INSERT INTO deletion_requests (email, requested_at, sla_days_left, status)
         VALUES ($1, $2, $3, $4)
         RETURNING id, email, requested_at, sla_days_left, status`,
        [email, requested_at, sla_days_left ?? 30, status ?? "pending"]
      );

      return Response.json({ request: req }, { status: 201 });
    } catch (err) {
      console.error("POST /api/deletions error:", err);
      return Response.json({ error: "Failed to create deletion request" }, { status: 500 });
    }
  },
});
