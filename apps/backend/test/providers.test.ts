import assert from "node:assert/strict";
import test from "node:test";
import { MavenVersionProviderSource } from "../src/providers/maven.ts";
import { extractClassifier } from "../src/providers/reposilite.ts";
import { StaticVersionProviderSource } from "../src/providers/static.ts";

test("static provider normalizes manually configured entries", async () => {
  const provider = new StaticVersionProviderSource({
    branch: "stable",
    entries: [
      {
        downloadUrl: "https://downloads.example.com/example-1.4.0.jar",
        fileName: "example-1.4.0.jar",
        modifiedAt: "2026-09-27T12:00:00.000Z",
        properties: { "git.commit.id": "abc123" },
        tags: [{ group: "operating-system", value: "linux" }],
        version: "1.4.0",
      },
    ],
    id: "manual-releases",
    label: "Manual releases",
    type: "static",
  });

  const entries = await provider.loadEntries();

  assert.equal(entries.length, 1);
  assert.deepEqual(entries[0], {
    branch: "stable",
    branchLabel: "branches.stable",
    checksumUrl: null,
    downloadUrl: "https://downloads.example.com/example-1.4.0.jar",
    fileName: "example-1.4.0.jar",
    id: "manual-releases:1.4.0:example-1.4.0.jar",
    logicalVersion: "1.4.0",
    maven: null,
    modifiedAt: Date.parse("2026-09-27T12:00:00.000Z"),
    properties: { "git.commit.id": "abc123" },
    providerId: "manual-releases",
    providerLabel: "Manual releases",
    series: "1.4",
    showInAllBranches: true,
    sourceText: null,
    sourceUrl: null,
    tags: [{ group: "operating-system", value: "linux" }],
    version: "1.4.0",
  });

  entries[0]!.properties!["git.commit.id"] = "changed";
  entries[0]!.tags[0]!.value = "changed";
  assert.equal((await provider.loadEntries())[0]?.properties?.["git.commit.id"], "abc123");
  assert.equal((await provider.loadEntries())[0]?.tags[0]?.value, "linux");
});

test("maven provider loads releases and timestamped snapshots from metadata", async () => {
  const requestedUrls: string[] = [];
  const fetchImplementation: typeof fetch = async (input, init) => {
    const url = String(input);
    requestedUrls.push(`${init?.method ?? "GET"} ${url}`);

    if (url.endsWith("/example/maven-metadata.xml")) {
      return new Response(`
        <metadata>
          <versioning>
            <versions>
              <version>1.0.0</version>
              <version>1.1.0-SNAPSHOT</version>
            </versions>
          </versioning>
        </metadata>
      `);
    }

    if (url.endsWith("/1.1.0-SNAPSHOT/maven-metadata.xml")) {
      return new Response(`
        <metadata>
          <versioning>
            <snapshotVersions>
              <snapshotVersion>
                <extension>jar</extension>
                <value>1.1.0-20260927.120000-2</value>
                <updated>20260927120000</updated>
              </snapshotVersion>
            </snapshotVersions>
          </versioning>
        </metadata>
      `);
    }

    if (init?.method === "HEAD" && url.endsWith(".jar.sha1")) {
      return new Response(null, { status: 200 });
    }

    if (init?.method === "HEAD" && url.endsWith(".jar")) {
      return new Response(null, {
        headers: url.includes("/1.0.0/")
          ? { "Last-Modified": "Sat, 26 Sep 2026 12:00:00 GMT" }
          : {},
        status: 200,
      });
    }

    if (url.endsWith(".properties")) {
      return new Response([
        "git.commit.id=abcdef123456",
        "github.repo=example/project",
        "git.commit.message.short=Test build",
      ].join("\n"));
    }

    return new Response(null, { status: 404 });
  };
  const provider = new MavenVersionProviderSource(
    {
      artifactId: "example",
      baseUrl: "https://repo.example.com/releases",
      branch: "stable",
      checksumAlgorithm: "sha1",
      classifier: null,
      extension: "jar",
      groupId: "com.example",
      id: "maven-releases",
      includeProperties: true,
      label: "Maven releases",
      type: "maven",
    },
    fetchImplementation
  );

  const entries = await provider.loadEntries();

  assert.equal(entries.length, 2);
  assert.equal(entries[0]?.fileName, "example-1.0.0.jar");
  assert.equal(entries[0]?.modifiedAt, Date.parse("Sat, 26 Sep 2026 12:00:00 GMT"));
  assert.equal(entries[0]?.sourceText, "Test build");
  assert.equal(entries[0]?.sourceUrl, "https://github.com/example/project/commit/abcdef123456");
  assert.equal(entries[1]?.logicalVersion, "1.1.0-SNAPSHOT");
  assert.equal(entries[1]?.version, "1.1.0-20260927.120000-2");
  assert.equal(entries[1]?.fileName, "example-1.1.0-20260927.120000-2.jar");
  assert.equal(entries[1]?.modifiedAt, Date.UTC(2026, 8, 27, 12));
  assert.deepEqual(entries[1]?.maven, {
    artifactId: "example",
    classifier: null,
    extension: "jar",
    groupId: "com.example",
    repository: {
      id: "maven-releases",
      name: "Maven releases",
      url: "https://repo.example.com/releases",
    },
    version: "1.1.0-SNAPSHOT",
  });
  assert.equal(
    entries[1]?.checksumUrl,
    "https://repo.example.com/releases/com/example/example/1.1.0-SNAPSHOT/example-1.1.0-20260927.120000-2.jar.sha1"
  );
  assert.ok(
    requestedUrls.includes(
      "GET https://repo.example.com/releases/com/example/example/1.1.0-SNAPSHOT/maven-metadata.xml"
    )
  );
});

test("reposilite classifier extraction supports releases and snapshots", () => {
  assert.equal(extractClassifier("3.6.3", "3.6.3"), null);
  assert.equal(extractClassifier("3.6.3", "3.6.3-all"), "all");
  assert.equal(
    extractClassifier("3.6.4-SNAPSHOT", "3.6.4-20260927.120000-2-all"),
    "all"
  );
  assert.equal(
    extractClassifier("3.6.4-SNAPSHOT", "3.6.4-20260927.120000-2"),
    null
  );
});
