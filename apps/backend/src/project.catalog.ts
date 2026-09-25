import { createDownloadProjects, loadryConfigSchema } from "./project.config.js";
import { ProjectService } from "./project.service.js";

type ServerEnvironment = Record<string, string | undefined>;

const defaultCacheTtlSeconds = 60;

export class ProjectCatalog {
  private cachedService: ProjectService | null = null;
  private expiresAt = 0;
  private pendingLoad: Promise<ProjectService> | null = null;

  constructor(
    private readonly env: ServerEnvironment,
    private readonly fetchImplementation: typeof globalThis.fetch = globalThis.fetch
  ) {}

  async getService() {
    if (this.cachedService && Date.now() < this.expiresAt) {
      return this.cachedService;
    }

    if (!this.pendingLoad) {
      this.pendingLoad = this.loadService().finally(() => {
        this.pendingLoad = null;
      });
    }

    return this.pendingLoad;
  }

  private async loadService() {
    const rawConfig = await this.loadRawConfig();
    const result = loadryConfigSchema.safeParse(rawConfig);

    if (!result.success) {
      throw new Error(`Invalid Loadry configuration: ${zodErrorMessage(result.error)}`);
    }

    const service = new ProjectService(createDownloadProjects(result.data));
    this.cachedService = service;
    this.expiresAt = Date.now() + this.cacheTtlMilliseconds;
    return service;
  }

  private async loadRawConfig(): Promise<unknown> {
    const inlineConfig = this.env.LOADRY_CONFIG_JSON?.trim();

    if (inlineConfig) {
      return parseJson(inlineConfig, "LOADRY_CONFIG_JSON");
    }

    const configUrl = this.env.LOADRY_CONFIG_URL?.trim();

    if (!configUrl) {
      return { projects: [], version: 1 };
    }

    const headers = new Headers({ Accept: "application/json" });
    const token = this.env.LOADRY_CONFIG_TOKEN?.trim();

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const response = await this.fetchImplementation(configUrl, { headers });

    if (!response.ok) {
      throw new Error(`Failed to load Loadry configuration: HTTP ${response.status}`);
    }

    return parseJson(await response.text(), "LOADRY_CONFIG_URL response");
  }

  private get cacheTtlMilliseconds() {
    const configuredValue = Number(this.env.LOADRY_CONFIG_CACHE_TTL_SECONDS);
    const seconds = Number.isFinite(configuredValue) && configuredValue >= 0
      ? configuredValue
      : defaultCacheTtlSeconds;
    return seconds * 1000;
  }
}

function parseJson(value: string, source: string) {
  try {
    return JSON.parse(value) as unknown;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid JSON in ${source}: ${message}`);
  }
}

function zodErrorMessage(error: { issues: Array<{ message: string; path: PropertyKey[] }> }) {
  return error.issues
    .map(issue => `${issue.path.length ? issue.path.join(".") : "config"}: ${issue.message}`)
    .join("; ");
}
