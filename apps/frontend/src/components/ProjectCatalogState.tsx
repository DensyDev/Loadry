import { Button, Spinner, Typography } from "@heroui/react";
import { RefreshCcw, ServerCrash } from "lucide-react";
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
    return null;
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
