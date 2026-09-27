import assert from "node:assert/strict";
import test from "node:test";
import { ProjectCatalog } from "../src/project.catalog.ts";

const projectConfig = {
  version: 1,
  projects: [
    {
      id: "example",
      name: "Example",
      description: "Example downloads",
      domains: ["downloads.example.com"],
      providers: [
        {
          type: "reposilite",
          id: "releases",
          label: "Releases",
          branch: "stable",
          baseUrl: "https://repo.example.com",
          repository: "releases",
          groupId: "com.example",
          artifactId: "Example",
        },
      ],
    },
  ],
};

test("an unconfigured catalog is empty", async () => {
  const catalog = new ProjectCatalog({});
  const service = await catalog.getService();

  assert.deepEqual(service.projects, []);
});

test("inline JSON creates projects and provider instances", async () => {
  const catalog = new ProjectCatalog({
    LOADRY_CONFIG_JSON: JSON.stringify(projectConfig),
  });
  const service = await catalog.getService();
  const project = service.findById("example");

  assert.equal(project?.name, "Example");
  assert.equal(project?.providers[0]?.id, "releases");
  assert.equal(project?.providers[0]?.branchLabel, "branches.stable");
  assert.equal(project?.providers[0]?.showInAllBranches, true);
});

test("provider registry creates static providers", async () => {
  const config = {
    projects: [
      {
        description: "Manual downloads",
        domains: [],
        id: "manual",
        name: "Manual",
        providers: [
          {
            branch: "stable",
            entries: [
              {
                downloadUrl: "https://downloads.example.com/example.jar",
                fileName: "example.jar",
                version: "1.0.0",
              },
            ],
            id: "manual-releases",
            label: "Manual releases",
            type: "static",
          },
        ],
      },
    ],
    version: 1,
  };
  const catalog = new ProjectCatalog({ LOADRY_CONFIG_JSON: JSON.stringify(config) });
  const project = (await catalog.getService()).findById("manual");

  assert.equal(project?.providers[0]?.constructor.name, "StaticVersionProviderSource");
  assert.equal((await project?.providers[0]?.loadEntries())?.[0]?.version, "1.0.0");
});

test("remote JSON uses bearer authentication and is cached", async () => {
  let calls = 0;
  const fetchImplementation: typeof fetch = async (input, init) => {
    calls += 1;
    assert.equal(String(input), "https://config.example.com/loadry.json");
    assert.equal(new Headers(init?.headers).get("Authorization"), "Bearer secret");
    return Response.json(projectConfig);
  };
  const catalog = new ProjectCatalog(
    {
      LOADRY_CONFIG_TOKEN: "secret",
      LOADRY_CONFIG_URL: "https://config.example.com/loadry.json",
    },
    fetchImplementation
  );

  const first = await catalog.getService();
  const second = await catalog.getService();

  assert.equal(first, second);
  assert.equal(calls, 1);
});

test("invalid and duplicate configuration is rejected", async () => {
  const duplicateConfig = {
    ...projectConfig,
    projects: [projectConfig.projects[0], projectConfig.projects[0]],
  };
  const catalog = new ProjectCatalog({
    LOADRY_CONFIG_JSON: JSON.stringify(duplicateConfig),
  });

  await assert.rejects(
    catalog.getService(),
    /Project IDs must be unique: example/
  );
});

test("unregistered provider types are rejected with their config path", async () => {
  const config = structuredClone(projectConfig);
  config.projects[0]!.providers[0]!.type = "unknown";
  const catalog = new ProjectCatalog({ LOADRY_CONFIG_JSON: JSON.stringify(config) });

  await assert.rejects(
    catalog.getService(),
    /projects\.0\.providers\.0\.type: Unsupported provider type: unknown/
  );
});
