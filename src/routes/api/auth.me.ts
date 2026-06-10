import { createAPIFileRoute } from "@/lib/create-api-file-route";
import { getAuthUser } from "@/lib/auth";

export const APIRoute = createAPIFileRoute("/api/auth/me")({
  GET: async ({ request }) => {
    const user = await getAuthUser(request);
    if (!user) {
      return Response.json({ user: null }, { status: 200 });
    }
    return Response.json({ user });
  },
});
