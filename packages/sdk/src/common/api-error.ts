import { apiErrorSchema } from "@densy/loadry-contracts";

export class DownloadsApiError extends Error {
  readonly details: unknown;
  readonly response: Response;
  readonly status: number;

  constructor(response: Response, payload: unknown) {
    const parsed = apiErrorSchema.safeParse(payload);
    super(parsed.success ? parsed.data.message : `Loadry API request failed with ${response.status}`);
    this.name = "DownloadsApiError";
    this.details = parsed.success ? parsed.data.details ?? parsed.data : payload;
    this.response = response;
    this.status = response.status;
  }
}

export class InvalidApiResponseError extends Error {
  readonly cause: unknown;
  readonly response: Response;

  constructor(response: Response, cause: unknown) {
    super("Loadry API returned an invalid response");
    this.name = "InvalidApiResponseError";
    this.cause = cause;
    this.response = response;
  }
}
