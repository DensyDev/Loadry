import assert from "node:assert/strict";
import test from "node:test";
import { DownloadsApiError } from "../dist/index.js";
import { DownloadsClient } from "../dist/v1/index.js";

function jsonResponse(payload, init = {}) {
  return new Response(JSON.stringify(payload), {
    headers: {
      "content-type": "application/json",
      ...init.headers,
    },
    status: init.status ?? 200,
  });
}

function projectFixture() {
  return {
    branches: [
      {
        id: "stable",
        labelKey: "branches.stable",
        showInAllBranches: true,
      },
    ],
    description: "Example project",
    domains: ["downloads.example.com"],
    id: "example",
    links: {
      self: "https://downloads.example.com/api/v1/projects/example",
      versions: "https://downloads.example.com/api/v1/projects/example/versions",
      website: "https://downloads.example.com/project/example",
    },
    name: "Example",
    providers: [
      {
        branch: "stable",
        branchLabelKey: "branches.stable",
        id: "releases",
        label: "Releases",
      },
    ],
  };
}

test("projects.list returns validated projects", async () => {
  const requests = [];
  let requestCache;
  const client = new DownloadsClient({
    baseUrl: "https://downloads.example.com",
    fetch: async (input, init) => {
      requests.push(String(input));
      requestCache = init?.cache;
      return jsonResponse([projectFixture()]);
    },
  });

  const projects = await client.projects.list();

  assert.equal(projects[0].id, "example");
  assert.deepEqual(requests, ["https://downloads.example.com/api/v1/projects"]);
  assert.equal(requestCache, "no-store");
});

test("client invokes fetch with the global receiver", async () => {
  const client = new DownloadsClient({
    baseUrl: "https://downloads.example.com",
    fetch: async function () {
      assert.equal(this, globalThis);
      return jsonResponse([projectFixture()]);
    },
  });

  await client.projects.list();
});

test("versions.list serializes filters", async () => {
  let requestedUrl = "";
  const client = new DownloadsClient({
    baseUrl: "https://downloads.example.com/",
    fetch: async input => {
      requestedUrl = String(input);
      return jsonResponse([]);
    },
  });

  await client.versions.list("example project", {
    branches: ["stable", "dev"],
    limit: 1,
    versions: ["1.6"],
  });

  const url = new URL(requestedUrl);
  assert.equal(url.pathname, "/api/v1/projects/example%20project/versions");
  assert.equal(url.searchParams.get("branches"), "stable,dev");
  assert.equal(url.searchParams.get("versions"), "1.6");
  assert.equal(url.searchParams.get("limit"), "1");
});

test("versions.lookup preserves property field names", async () => {
  let requestedUrl = "";
  const client = new DownloadsClient({
    baseUrl: "https://downloads.example.com",
    fetch: async input => {
      requestedUrl = String(input);
      return jsonResponse(
        {
          message: "Version not found",
        },
        { status: 404 }
      );
    },
  });

  await assert.rejects(
    client.versions.lookup("example", {
      branch: "dev",
      fields: {
        "properties.git.commit.id": "abc123",
      },
    }),
    DownloadsApiError
  );

  const url = new URL(requestedUrl);
  assert.equal(url.searchParams.get("branch"), "dev");
  assert.equal(url.searchParams.get("properties.git.commit.id"), "abc123");
});

test("download resources create encoded project-scoped URLs", () => {
  const client = new DownloadsClient({
    baseUrl: "https://downloads.example.com",
    fetch: async () => new Response(),
  });

  assert.equal(
    client.downloads.getFileUrl("example project", "dev", "Example 1.0.jar"),
    "https://downloads.example.com/download/example%20project/dev/Example%201.0.jar"
  );
  assert.equal(
    client.downloads.getLatestUrl("example", "stable"),
    "https://downloads.example.com/download/example/stable/latest"
  );
});
