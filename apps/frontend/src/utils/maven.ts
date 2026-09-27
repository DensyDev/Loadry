import type { MavenArtifact } from "@densy/loadry-contracts";

export type MavenSnippetFormat = "maven" | "gradle-kotlin" | "gradle-groovy" | "sbt";

export function createMavenSnippets(artifact: MavenArtifact) {
  const repositoryUrl = artifact.repository.url.replace(/\/$/, "");
  const coordinate = [
    artifact.groupId,
    artifact.artifactId,
    artifact.version,
    artifact.classifier,
  ].filter((value): value is string => Boolean(value)).join(":");
  const gradleCoordinate = artifact.extension === "jar"
    ? coordinate
    : `${coordinate}@${artifact.extension}`;
  const mavenClassifier = artifact.classifier
    ? `\n  <classifier>${escapeXml(artifact.classifier)}</classifier>`
    : "";
  const mavenType = artifact.extension === "jar"
    ? ""
    : `\n  <type>${escapeXml(artifact.extension)}</type>`;
  const sbtBase = `${scalaString(artifact.groupId)} % ${scalaString(artifact.artifactId)} % ${scalaString(artifact.version)}`;
  const sbtDependency = artifact.extension === "jar"
    ? `${sbtBase}${artifact.classifier ? ` classifier ${scalaString(artifact.classifier)}` : ""}`
    : `(${sbtBase}).artifacts(Artifact(${scalaString(artifact.artifactId)}, ${scalaString(artifact.extension)}, ${scalaString(artifact.extension)}${artifact.classifier ? `, classifier = Some(${scalaString(artifact.classifier)})` : ""}))`;

  return {
    artifact: {
      maven: `<dependency>\n  <groupId>${escapeXml(artifact.groupId)}</groupId>\n  <artifactId>${escapeXml(artifact.artifactId)}</artifactId>\n  <version>${escapeXml(artifact.version)}</version>${mavenClassifier}${mavenType}\n</dependency>`,
      "gradle-kotlin": `implementation(${JSON.stringify(gradleCoordinate)})`,
      "gradle-groovy": `implementation ${singleQuoted(gradleCoordinate)}`,
      sbt: `libraryDependencies += ${sbtDependency}`,
    },
    repository: {
      maven: `<repository>\n  <id>${escapeXml(artifact.repository.id)}</id>\n  <name>${escapeXml(artifact.repository.name)}</name>\n  <url>${escapeXml(repositoryUrl)}</url>\n</repository>`,
      "gradle-kotlin": `maven {\n    url = uri(${JSON.stringify(repositoryUrl)})\n}`,
      "gradle-groovy": `maven {\n    url = uri(${singleQuoted(repositoryUrl)})\n}`,
      sbt: `resolvers += ${scalaString(artifact.repository.name)} at ${scalaString(repositoryUrl)}`,
    },
  } satisfies {
    artifact: Record<MavenSnippetFormat, string>;
    repository: Record<MavenSnippetFormat, string>;
  };
}

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function singleQuoted(value: string) {
  return `'${value.replaceAll("\\", "\\\\").replaceAll("'", "\\'")}'`;
}

function scalaString(value: string) {
  return JSON.stringify(value);
}
