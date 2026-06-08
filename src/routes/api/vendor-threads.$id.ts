import { createAPIFileRoute } from "@tanstack/react-start/api";
import { query } from "@/lib/db";

export type VendorThread = {
  id: string;
  vendor_id: string;
  subject: string;
  last_message: string;
  unread_count: number;
  updated_at: string;
  created_at: string;
};

export const APIRoute = createAPIFileRoute("/api/vendor-threads/$id")({
  GET: async ({ params }) => {
    try {
      const threads = await query<VendorThread>(
        `SELECT id, vendor_id, subject, last_message, unread_count, updated_at, created_at
         FROM vendor_threads
         WHERE id = $1`,
        [params.id]
      );

      if (threads.length === 0) {
        return Response.json({ error: "Thread not found" }, { status: 404 });
      }

      return Response.json({ thread: threads[0] });
    } catch (err) {
      console.error(`GET /api/vendor-threads/${params.id} error:`, err);
      return Response.json({ error: "Failed to fetch vendor thread" }, { status: 500 });
    }
  },

  PATCH: async ({ params, request }) => {
    try {
      const body = await request.json() as any;
      const { last_message, unread_count } = body;

      let sql = `UPDATE vendor_threads SET updated_at = CURRENT_TIMESTAMP`;
      const params_arr: any[] = [];
      let paramIdx = 1;

      if (last_message !== undefined) {
        sql += `, last_message = $${paramIdx++}`;
        params_arr.push(last_message);
      }
      if (unread_count !== undefined) {
        sql += `, unread_count = $${paramIdx++}`;
        params_arr.push(unread_count);
      }

      sql += ` WHERE id = $${paramIdx}`;
      params_arr.push(params.id);

      sql += ` RETURNING id, vendor_id, subject, last_message, unread_count, updated_at, created_at`;

      const threads = await query<VendorThread>(sql, params_arr);

      if (threads.length === 0) {
        return Response.json({ error: "Thread not found" }, { status: 404 });
      }

      return Response.json({ thread: threads[0] });
    } catch (err) {
      console.error(`PATCH /api/vendor-threads/${params.id} error:`, err);
      return Response.json({ error: "Failed to update vendor thread" }, { status: 500 });
    }
  },
});
