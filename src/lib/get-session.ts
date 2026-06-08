import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { getAuthUser } from "./auth";

export const getSessionUser = createServerFn({ method: "GET" }).handler(async () => {
  const request = getRequest();
  return getAuthUser(request);
});
