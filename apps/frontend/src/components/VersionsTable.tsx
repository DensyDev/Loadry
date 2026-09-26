import {
  Button,
  CardDescription,
  Chip,
  Skeleton,
  Table,
  Typography,
} from "@heroui/react";
import type { Version } from "@densy/loadry-contracts";
import { RefreshCcw, ServerCrash } from "lucide-react";
import { useTranslation } from "react-i18next";
import { DownloadSplitButton } from "./DownloadSplitButton";

type VersionsTableProps = {
  entries: Version[];
  error: Error | null;
  isLoading: boolean;
  onRetry: () => void;
};

export function VersionsTable({
  entries,
  error,
  isLoading,
  onRetry,
}: VersionsTableProps) {
  const { t } = useTranslation();

  if (error) {
    return (
      <div className="flex min-h-60 flex-col items-center justify-center gap-4 text-center">
        <ServerCrash aria-hidden="true" className="text-danger" size={36} />
        <div className="space-y-2">
          <Typography.Heading level={3}>{t("errors.loadVersions")}</Typography.Heading>
          <Typography.Paragraph className="max-w-2xl break-all text-muted">
            {error.message}
          </Typography.Paragraph>
        </div>
        <Button onPress={onRetry} variant="primary">
          <RefreshCcw aria-hidden="true" size={16} />
          {t("common.retry")}
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return <VersionsTableSkeleton />;
  }

  if (entries.length === 0) {
    return (
      <div className="flex min-h-60 items-center justify-center text-center">
        <Typography.Paragraph className="text-muted">{t("home.empty")}</Typography.Paragraph>
      </div>
    );
  }

  return (
    <Table>
      <Table.ScrollContainer>
        <Table.Content aria-label={t("home.tableTitle")} className="min-w-[900px]">
          <Table.Header>
            <Table.Column isRowHeader>{t("home.version")}</Table.Column>
            <Table.Column>{t("home.source")}</Table.Column>
            <Table.Column>{t("filters.branch")}</Table.Column>
            <Table.Column>{t("home.file")}</Table.Column>
            <Table.Column>{t("common.download")}</Table.Column>
          </Table.Header>
            <Table.Body items={entries}>
            {entry => {
              return (
              <Table.Row id={entry.id}>
                <Table.Cell>
                  <div>
                    <strong>{entry.version}</strong>
                    <CardDescription>Series {entry.series}</CardDescription>
                  </div>
                </Table.Cell>
                <Table.Cell>
                  {entry.source?.url ? (
                    <a
                      className="block max-w-[280px] truncate text-blue-500 underline-offset-4 hover:underline"
                      href={entry.source.url}
                      rel="noreferrer"
                      target="_blank"
                      title={entry.source.text ?? entry.source.url}
                    >
                      {entry.source.text ?? entry.source.url}
                    </a>
                  ) : (
                    <Typography.Paragraph className="text-sm text-muted">—</Typography.Paragraph>
                  )}
                </Table.Cell>
                <Table.Cell>
                  <Chip size="sm" variant="soft">
                    {t(entry.branch.labelKey, { defaultValue: entry.branch.id })}
                  </Chip>
                </Table.Cell>
                <Table.Cell>
                  <Typography.Paragraph className="break-all text-sm text-muted">
                    {entry.fileName}
                  </Typography.Paragraph>
                </Table.Cell>
                <Table.Cell>
                  <DownloadSplitButton
                    checksumUrl={entry.checksumUrl}
                    directUrl={entry.directDownloadUrl}
                    downloadUrl={entry.downloadUrl}
                    fileName={entry.fileName}
                  />
                </Table.Cell>
              </Table.Row>
              );
            }}
          </Table.Body>
        </Table.Content>
      </Table.ScrollContainer>
    </Table>
  );
}

const skeletonRows = Array.from({ length: 8 }, (_, index) => ({ id: `skeleton-${index}` }));

function VersionsTableSkeleton() {
  const { t } = useTranslation();

  return (
    <Table>
      <Table.ScrollContainer>
        <Table.Content
          aria-busy="true"
          aria-label={t("home.loading")}
          className="min-w-[900px]"
        >
          <Table.Header>
            <Table.Column isRowHeader>{t("home.version")}</Table.Column>
            <Table.Column>{t("home.source")}</Table.Column>
            <Table.Column>{t("filters.branch")}</Table.Column>
            <Table.Column>{t("home.file")}</Table.Column>
            <Table.Column>{t("common.download")}</Table.Column>
          </Table.Header>
          <Table.Body items={skeletonRows}>
            {row => (
              <Table.Row id={row.id}>
                <Table.Cell><Skeleton className="h-5 w-24 rounded-md" /></Table.Cell>
                <Table.Cell><Skeleton className="h-5 w-48 rounded-md" /></Table.Cell>
                <Table.Cell><Skeleton className="h-6 w-20 rounded-full" /></Table.Cell>
                <Table.Cell><Skeleton className="h-5 w-64 rounded-md" /></Table.Cell>
                <Table.Cell><Skeleton className="h-9 w-32 rounded-lg" /></Table.Cell>
              </Table.Row>
            )}
          </Table.Body>
        </Table.Content>
      </Table.ScrollContainer>
    </Table>
  );
}
