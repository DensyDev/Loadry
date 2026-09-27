import { Button, Modal, Tabs, useOverlayState } from "@heroui/react";
import type { MavenArtifact } from "@densy/loadry-contracts";
import { Check, Copy } from "lucide-react";
import { Fragment, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { copyToClipboard } from "../utils/clipboard";
import { createMavenSnippets, type MavenSnippetFormat } from "../utils/maven";

type MavenDependencyModalProps = {
  artifact: MavenArtifact;
  state: ReturnType<typeof useOverlayState>;
};

const formats: Array<{ id: MavenSnippetFormat; label: string }> = [
  { id: "maven", label: "Maven" },
  { id: "gradle-kotlin", label: "Gradle Kotlin" },
  { id: "gradle-groovy", label: "Gradle Groovy" },
  { id: "sbt", label: "SBT" },
];

export function MavenDependencyModal({ artifact, state }: MavenDependencyModalProps) {
  const { t } = useTranslation();
  const snippets = createMavenSnippets(artifact);

  return (
    <Modal state={state}>
      <Modal.Backdrop>
        <Modal.Container placement="center" scroll="inside" size="lg">
          <Modal.Dialog className="max-h-[90dvh]">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>
                {t("dependencies.title", { defaultValue: "Use as a dependency" })}
              </Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <Tabs className="w-full pb-2" variant="secondary">
                <Tabs.ListContainer>
                  <Tabs.List aria-label={t("dependencies.title", { defaultValue: "Use as a dependency" })}>
                    {formats.map(format => (
                      <Tabs.Tab className="min-h-14 py-3 leading-tight" id={format.id} key={format.id}>
                        {format.label}
                        <Tabs.Indicator />
                      </Tabs.Tab>
                    ))}
                  </Tabs.List>
                </Tabs.ListContainer>
                {formats.map(format => (
                  <Tabs.Panel className="pt-5" id={format.id} key={format.id}>
                    <div className="space-y-6">
                      <SnippetSection
                        format={format.id}
                        label={t("dependencies.repository", { defaultValue: "Repository" })}
                        value={snippets.repository[format.id]}
                      />
                      <SnippetSection
                        format={format.id}
                        label={t("dependencies.artifact", { defaultValue: "Dependency" })}
                        value={snippets.artifact[format.id]}
                      />
                    </div>
                  </Tabs.Panel>
                ))}
              </Tabs>
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

function SnippetSection({
  format,
  label,
  value,
}: {
  format: MavenSnippetFormat;
  label: string;
  value: string;
}) {
  return (
    <section className="space-y-3">
      <h3 className="text-base font-semibold text-foreground">{label}</h3>
      <CopyableSnippet format={format} label={label} value={value} />
    </section>
  );
}

function CopyableSnippet({
  format,
  label,
  value,
}: {
  format: MavenSnippetFormat;
  label: string;
  value: string;
}) {
  const { t } = useTranslation();
  const [isCopied, setIsCopied] = useState(false);

  const copy = async () => {
    await copyToClipboard(value);
    setIsCopied(true);
    window.setTimeout(() => setIsCopied(false), 1600);
  };

  return (
    <div className="relative rounded-xl border border-default-200 bg-default-100/70">
      <pre className="max-h-56 overflow-auto whitespace-pre p-4 pr-12 text-xs leading-relaxed text-foreground sm:text-sm">
        <code>{format === "maven" ? highlightXml(value) : highlightJvmDsl(value)}</code>
      </pre>
      <Button
        aria-label={isCopied ? t("common.copied") : `${t("common.copyLink")}: ${label}`}
        className="absolute right-2 top-2"
        isIconOnly
        onPress={copy}
        variant="tertiary"
      >
        {isCopied ? <Check aria-hidden="true" size={17} /> : <Copy aria-hidden="true" size={17} />}
      </Button>
    </div>
  );
}

function highlightXml(value: string) {
  const parts = value.match(/<\/?[A-Za-z][^>]*>|[^<]+/g) ?? [value];

  return parts.map((part, index) => {
    const tag = part.match(/^(<\/?)([\w:.-]+)([^>]*)(\/?>)$/);

    if (tag) {
      return (
        <Fragment key={index}>
          <span className="text-default-500">{tag[1]}</span>
          <span className="text-purple-600 dark:text-purple-300">{tag[2]}</span>
          {tag[3] && <span className="text-blue-600 dark:text-blue-300">{tag[3]}</span>}
          <span className="text-default-500">{tag[4]}</span>
        </Fragment>
      );
    }

    return <Fragment key={index}>{highlightXmlText(part)}</Fragment>;
  });
}

function highlightXmlText(value: string) {
  return value.split(/(\s+)/).map((part, index) => (
    /^\s+$/.test(part)
      ? <Fragment key={index}>{part}</Fragment>
      : <span className="text-emerald-600 dark:text-emerald-300" key={index}>{part}</span>
  ));
}

function highlightJvmDsl(value: string) {
  const tokens: ReactNode[] = [];
  const pattern = /("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|(\b\d+(?:\.\d+)?\b)|(\b(?:Artifact|Some|at|classifier|implementation|libraryDependencies|maven|resolvers|uri|url)\b)|([=+%(),.])/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(value))) {
    if (match.index > lastIndex) {
      tokens.push(value.slice(lastIndex, match.index));
    }

    const className = match[1]
      ? "text-emerald-600 dark:text-emerald-300"
      : match[2]
        ? "text-default-500"
        : match[3]
          ? "text-amber-600 dark:text-amber-300"
          : match[4]
            ? "text-purple-600 dark:text-purple-300"
            : "text-blue-600 dark:text-blue-300";

    tokens.push(<span className={className} key={match.index}>{match[0]}</span>);
    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < value.length) {
    tokens.push(value.slice(lastIndex));
  }

  return tokens;
}
