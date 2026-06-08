import { createAPIFileRoute } from "@tanstack/react-start/api";
import { query } from "@/lib/db";

export type DeletionRequest = {
  id: string;
  email: string;
  requested_at: string;
  sla_days_left: number;
  status: string;
};

export const APIRoute = createAPIFileRoute("/api/deletions/$id")({
  PATCH: async ({ params, request }) => {
    try {
      const body = await request.json() as any;
      const { status } = body;

      const requests = await query<DeletionRequest>(
        `UPDATE deletion_requests
         SET status = $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2
         RETURNING id, email, requested_at, sla_days_left, status`,
        [status, params.id]
      );

      if (requests.length === 0) {
        return Response.json({ error: "Request not found" }, { status: 404 });
      }

      return Response.json({ request: requests[0] });
    } catch (err) {
      console.error(`PATCH /api/deletions/${params.id} error:`, err);
      return Response.json({ error: "Failed to update deletion request" }, { status: 500 });
    }
  },
});
