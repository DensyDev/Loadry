import { Spinner, Typography } from "@heroui/react";
import { useTranslation } from "react-i18next";

export function LoadingState() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-60 flex-col items-center justify-center gap-3 text-center">
      <Spinner aria-label="Loading versions" size="lg" />
      <Typography.Paragraph className="text-muted">
        {t("home.loading")}
      </Typography.Paragraph>
    </div>
  );
}
