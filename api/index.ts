import server from "../dist/server/server.js";

export default async (request: Request) => {
  return server.fetch(request, {}, {});
};
