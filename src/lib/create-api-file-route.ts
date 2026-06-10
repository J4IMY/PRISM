export type APIHandlerContext = {
  request: Request;
  params: Record<string, string>;
};

export type APIHandlers = Record<
  string,
  (ctx: APIHandlerContext) => Promise<Response> | Response
>;

type RegisteredRoute = {
  pattern: string;
  handlers: APIHandlers;
};

const routes: RegisteredRoute[] = [];

function matchPath(
  pathname: string,
  pattern: string,
): Record<string, string> | null {
  const patternParts = pattern.split("/").filter(Boolean);
  const pathParts = pathname.split("/").filter(Boolean);
  if (patternParts.length !== pathParts.length) return null;

  const params: Record<string, string> = {};
  for (let i = 0; i < patternParts.length; i++) {
    const segment = patternParts[i];
    if (segment.startsWith("$")) {
      params[segment.slice(1)] = decodeURIComponent(pathParts[i]);
    } else if (segment !== pathParts[i]) {
      return null;
    }
  }
  return params;
}

export function createAPIFileRoute(path: string) {
  return (handlers: APIHandlers) => {
    routes.push({ pattern: path, handlers });
    return { path, handlers };
  };
}

export async function handleApiRequest(
  request: Request,
): Promise<Response | null> {
  const url = new URL(request.url);
  if (!url.pathname.startsWith("/api/")) return null;

  for (const route of routes) {
    const params = matchPath(url.pathname, route.pattern);
    if (!params) continue;

    const handler = route.handlers[request.method];
    if (!handler) {
      return Response.json(
        { error: `Method ${request.method} not allowed` },
        { status: 405 },
      );
    }

    return handler({ request, params });
  }

  return Response.json({ error: "Not found" }, { status: 404 });
}
