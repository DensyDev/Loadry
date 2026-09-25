import { Router } from "express";
import { createProjectsRouter } from "./routes/index.js";

type ServerEnvironment = Record<string, string | undefined>;

export function createApiV1Router(env: ServerEnvironment) {
  const router = Router();

  router.get("/health", (_request, response) => {
    response.json({ status: "ok", version: "v1" });
  });

  router.use("/projects", createProjectsRouter(env));

  return router;
}
