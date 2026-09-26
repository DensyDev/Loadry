import type { IncomingMessage, ServerResponse } from "node:http";
import { createServerApp } from "../apps/backend/src/app.js";

declare const process: {
  env: Record<string, string | undefined>;
};

const app = createServerApp(process.env, {
  downloadDeliveryMode: "redirect",
});

type VercelRequest = IncomingMessage & {
  query?: unknown;
};

export default function server(request: VercelRequest, response: ServerResponse) {
  const url = new URL(request.url ?? "/", "https://loadry.invalid");
  const path = url.searchParams.get("path");

  if (path) {
    url.searchParams.delete("path");
    const query = url.searchParams.toString();
    request.url = `${path}${query ? `?${query}` : ""}`;
  }

  Reflect.deleteProperty(request, "query");
  app(request, response);
}
