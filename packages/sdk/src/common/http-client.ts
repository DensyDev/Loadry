import type { z } from "zod";
import { DownloadsApiError, InvalidApiResponseError } from "./api-error.js";

export type DownloadsClientOptions = {
  baseUrl?: string;
  fetch?: typeof globalThis.fetch;
  headers?: HeadersInit;
};

export class HttpClient {
  private readonly baseUrl: string;
  private readonly fetchImplementation: typeof globalThis.fetch;
  private readonly headers: Headers;

  constructor(options: DownloadsClientOptions = {}) {
    const fetchImplementation = options.fetch ?? globalThis.fetch;

    if (!fetchImplementation) {
      throw new Error("A fetch implementation is required");
    }

    this.baseUrl = options.baseUrl?.replace(/\/+$/, "") ?? "";
    this.fetchImplementation = fetchImplementation.bind(globalThis);
    this.headers = new Headers(options.headers);
  }

  createUrl(path: string) {
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;

    if (this.baseUrl) {
      return new URL(normalizedPath, `${this.baseUrl}/`).toString();
    }

    return normalizedPath;
  }

  async get<T>(path: string, schema: z.ZodType<T>, init: RequestInit = {}) {
    const headers = new Headers(this.headers);
    new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    headers.set("Accept", "application/json");

    const response = await this.fetchImplementation(this.createUrl(path), {
      ...init,
      headers,
      method: "GET",
    });
    const payload = await readPayload(response);

    if (!response.ok) {
      throw new DownloadsApiError(response, payload);
    }

    const parsed = schema.safeParse(payload);

    if (!parsed.success) {
      throw new InvalidApiResponseError(response, parsed.error);
    }

    return parsed.data;
  }

  fetch(path: string, init: RequestInit = {}) {
    return this.fetchImplementation(this.createUrl(path), init);
  }
}

async function readPayload(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  return text ? { message: text } : null;
}
