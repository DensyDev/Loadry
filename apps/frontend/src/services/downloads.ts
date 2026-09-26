import { DownloadsClient } from "@densy/loadry-sdk/v1";

export const downloads = new DownloadsClient({
  baseUrl: import.meta.env.VITE_LOADRY_API_URL || window.location.origin,
});
