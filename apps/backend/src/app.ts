import express, {
  type ErrorRequestHandler,
  type NextFunction,
  type Request,
  type Response,
} from "express";
import { createApiV1Router } from "./api/v1/router.js";
import { createDownloadRouter } from "./download/download.router.js";
import { ProjectCatalog } from "./project.catalog.js";
import {
  getVersionsPageSize,
  getVersionsPageSizeStep,
} from "./server.config.js";
import { HttpError } from "./shared/http.js";

type ServerEnvironment = Record<string, string | undefined>;

type ServerAppOptions = {
  downloadDeliveryMode?: "redirect" | "stream";
};

function publicReadHeaders(request: Request, response: Response, next: NextFunction) {
  response.setHeader("Access-Control-Allow-Headers", "Accept, Content-Type");
  response.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("X-Content-Type-Options", "nosniff");

  if (request.method === "OPTIONS") {
    response.sendStatus(204);
    return;
  }

  next();
}

export function createServerApp(env: ServerEnvironment, options: ServerAppOptions = {}) {
  const app = express();
  const projectCatalog = new ProjectCatalog(env);
  const versionsPageSize = getVersionsPageSize(env);
  app.disable("x-powered-by");
  app.set("trust proxy", true);

  app.use("/api", publicReadHeaders);
  app.use(
    "/api/v1",
    createApiV1Router(projectCatalog, {
      versionsPageSize,
      versionsPageSizeStep: getVersionsPageSizeStep(env, versionsPageSize),
    })
  );
  app.use("/api", (_request, response) => {
    response.status(404).json({ message: "API endpoint not found" });
  });
  app.use(
    "/download",
    publicReadHeaders,
    createDownloadRouter(projectCatalog, {
      deliveryMode: options.downloadDeliveryMode ?? "stream",
    })
  );

  const errorHandler: ErrorRequestHandler = (error, request, response, _next) => {
    const message = error instanceof Error ? error.message : "Internal server error";

    if (request.originalUrl.startsWith("/api/")) {
      const statusCode = error instanceof HttpError ? error.statusCode : 500;
      response.status(statusCode).json({
        ...(error instanceof HttpError && error.details ? { details: error.details } : {}),
        message,
      });
      return;
    }

    response.status(500).send(message);
  };

  app.use(errorHandler);
  return app;
}
