import { createAPIFileRoute } from "@/lib/create-api-file-route";
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

export const APIRoute = createAPIFileRoute("/api/vendor-threads")({
  GET: async ({ request }) => {
    const url = new URL(request.url);
    const vendorId = url.searchParams.get("vendor_id");

    try {
      let sql = `SELECT id, vendor_id, subject, last_message, unread_count, updated_at, created_at
                 FROM vendor_threads`;
      const params: any[] = [];

      if (vendorId) {
        sql += ` WHERE vendor_id = $1`;
        params.push(vendorId);
      }

      sql += ` ORDER BY updated_at DESC`;

      const threads = await query<VendorThread>(sql, params);
      return Response.json({ threads });
    } catch (err) {
      console.error("GET /api/vendor-threads error:", err);
      return Response.json({ error: "Failed to fetch vendor threads" }, { status: 500 });
    }
  },

  POST: async ({ request }) => {
    try {
      const body = (await request.json()) as any;
      const { vendor_id, subject, last_message } = body;

      const threads = await query<VendorThread>(
        `INSERT INTO vendor_threads (vendor_id, subject, last_message)
         VALUES ($1, $2, $3)
         RETURNING id, vendor_id, subject, last_message, unread_count, updated_at, created_at`,
        [vendor_id, subject, last_message],
      );

      return Response.json({ thread: threads[0] }, { status: 201 });
    } catch (err) {
      console.error("POST /api/vendor-threads error:", err);
      return Response.json({ error: "Failed to create vendor thread" }, { status: 500 });
    }
  },
});
