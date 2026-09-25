import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { ZodType } from "zod";

export class HttpError extends Error {
  constructor(
    readonly statusCode: number,
    message: string,
    readonly details?: unknown
  ) {
    super(message);
  }
}

export function asyncHandler(
  handler: (request: Request, response: Response, next: NextFunction) => Promise<void>
): RequestHandler {
  return (request, response, next) => {
    void handler(request, response, next).catch(next);
  };
}

export function parseQuery<T>(schema: ZodType<T>, query: unknown) {
  const result = schema.safeParse(query);

  if (!result.success) {
    throw new HttpError(400, "Invalid query parameters", result.error.flatten());
  }

  return result.data;
}

export function routeParam(value: string | string[]) {
  return Array.isArray(value) ? (value[0] ?? "") : value;
}
