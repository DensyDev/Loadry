export async function fetchTextOrNull(
  url: string,
  fetchImplementation: typeof globalThis.fetch = globalThis.fetch
) {
  const response = await fetchImplementation(url);

  if (!response.ok) {
    return null;
  }

  return response.text();
}

function unescapePropertiesValue(value: string) {
  return value
    .replace(/\\:/g, ":")
    .replace(/\\=/g, "=")
    .replace(/\\#/g, "#")
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\\\/g, "\\");
}

export function parseProperties(content: string) {
  return content.split(/\r?\n/).reduce<Record<string, string>>((properties, rawLine) => {
    const line = rawLine.trim();

    if (!line || line.startsWith("#") || line.startsWith("!")) {
      return properties;
    }

    const separatorIndex = line.search(/[:=]/);

    if (separatorIndex === -1) {
      return properties;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();
    properties[key] = unescapePropertiesValue(value);
    return properties;
  }, {});
}

function normalizeGitHubRepositoryUrl(properties: Record<string, string>) {
  const remoteUrl = properties["git.remote.origin.url"]?.replace(/\.git$/, "");

  if (remoteUrl?.startsWith("https://github.com/")) {
    return remoteUrl;
  }

  const githubRepository = properties["github.repo"];

  if (githubRepository) {
    return `https://github.com/${githubRepository}`;
  }

  return null;
}

export function buildSourceFromProperties(properties: Record<string, string>) {
  const commitId = properties["git.commit.id"];
  const repositoryUrl = normalizeGitHubRepositoryUrl(properties);

  if (!commitId || !repositoryUrl) {
    return {
      sourceText: null,
      sourceUrl: null,
    };
  }

  return {
    sourceText:
      properties["git.commit.message.short"] ??
      properties["git.commit.id.abbrev"] ??
      commitId.slice(0, 7),
    sourceUrl: `${repositoryUrl}/commit/${commitId}`,
  };
}
