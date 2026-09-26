import { Router, type Request, type Response } from "express";
import type { VersionEntry } from "../types.js";
import type { ProjectCatalog } from "../project.catalog.js";
import { DownloadService } from "./download.service.js";

type DownloadDeliveryMode = "redirect" | "stream";
type DownloadRouterOptions = {
  deliveryMode: DownloadDeliveryMode;
};

function getRouteParam(value: string | string[]) {
  return Array.isArray(value) ? (value[0] ?? "") : value;
}

function waitForDrain(response: Response) {
  return new Promise<void>(resolve => response.once("drain", resolve));
}

async function pipeUpstreamBody(response: Response, body: ReadableStream<Uint8Array>) {
  const reader = body.getReader();

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      response.end();
      return;
    }

    if (value && !response.write(value)) {
      await waitForDrain(response);
    }
  }
}

async function streamFile(request: Request, response: Response, entry: VersionEntry) {
  const upstream = await fetch(entry.downloadUrl);

  if (!upstream.ok) {
    response.status(upstream.status).send(`Failed to fetch upstream file: ${upstream.status}`);
    return;
  }

  response.status(200);
  response.setHeader(
    "Content-Type",
    upstream.headers.get("content-type") ?? "application/java-archive"
  );
  response.setHeader("Content-Disposition", `attachment; filename="${entry.fileName}"`);

  const contentLength = upstream.headers.get("content-length");

  if (contentLength) {
    response.setHeader("Content-Length", contentLength);
  }

  if (request.method === "HEAD") {
    response.end();
    return;
  }

  if (!upstream.body) {
    response.status(502).send("Upstream response body is empty");
    return;
  }

  await pipeUpstreamBody(response, upstream.body);
}

export function createDownloadRouter(
  projectCatalog: ProjectCatalog,
  options: DownloadRouterOptions
) {
  const router = Router();
  const downloadService = new DownloadService(projectCatalog);

  const handleDownload = async (
    request: Request,
    response: Response,
    projectId: string | null
  ) => {
    try {
      const entry = await downloadService.resolve(
        projectId,
        getRouteParam(request.params.branch),
        getRouteParam(request.params.target)
      );

      if (!entry) {
        response.status(404).send("Download not found");
        return;
      }

      if (options.deliveryMode === "redirect") {
        response.setHeader("Cache-Control", "no-store");
        response.redirect(302, entry.downloadUrl);
        return;
      }

      await streamFile(request, response, entry);
    } catch (error) {
      response
        .status(500)
        .send(error instanceof Error ? error.message : "Failed to resolve download");
    }
  };

  router.get("/:projectId/:branch/:target", (request, response) =>
    handleDownload(request, response, getRouteParam(request.params.projectId))
  );
  router.get("/:branch/:target", (request, response) =>
    handleDownload(request, response, null)
  );
  router.use((_request, response) => {
    response.status(404).send("Download route not found");
  });

  return router;
}
