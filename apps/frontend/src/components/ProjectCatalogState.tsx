import { Button, Spinner, Typography } from "@heroui/react";
import { FolderCog, RefreshCcw, ServerCrash } from "lucide-react";
import { useTranslation } from "react-i18next";

type ProjectCatalogStateProps = {
  error: Error | null;
  isLoading: boolean;
  onRetry: () => void;
};

export function ProjectCatalogState({
  error,
  isLoading,
  onRetry,
}: ProjectCatalogStateProps) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="flex min-h-60 items-center justify-center">
        <Spinner aria-label={t("projects.loading", { defaultValue: "Loading projects" })} size="lg" />
      </div>
    );
  }

  if (!error) {
    return (
      <div className="flex min-h-60 flex-col items-center justify-center gap-3 px-4 text-center">
        <FolderCog aria-hidden="true" className="text-muted" size={36} />
        <Typography.Heading level={3}>
          {t("projects.emptyTitle", { defaultValue: "No projects configured" })}
        </Typography.Heading>
        <Typography.Paragraph className="max-w-2xl text-muted">
          {t("projects.emptyDescription", {
            defaultValue:
              "Set LOADRY_CONFIG_JSON or LOADRY_CONFIG_URL to publish your first project.",
          })}
        </Typography.Paragraph>
      </div>
    );
  }

  return (
    <div className="flex min-h-60 flex-col items-center justify-center gap-4 px-4 text-center">
      <ServerCrash aria-hidden="true" className="text-danger" size={36} />
      <div className="space-y-2">
        <Typography.Heading level={3}>
          {t("errors.loadProjects", { defaultValue: "Failed to load projects" })}
        </Typography.Heading>
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
