import { Button, Dropdown } from "@heroui/react";
import { Check, ChevronDown, Copy, Download, Fingerprint, Link } from "lucide-react";
import type { Key } from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { copyToClipboard } from "../utils/clipboard";

type DownloadSplitButtonProps = {
  checksumUrl?: string | null;
  directUrl: string;
  downloadUrl: string;
  fileName: string;
};

function startDownload(url: string) {
  const link = document.createElement("a");
  link.href = url;
  link.rel = "noopener noreferrer";
  document.body.append(link);
  link.click();
  link.remove();
}

export function DownloadSplitButton({
  checksumUrl,
  directUrl,
  downloadUrl,
  fileName,
}: DownloadSplitButtonProps) {
  const { t } = useTranslation();
  const [copiedKey, setCopiedKey] = useState<"direct" | "download" | null>(null);

  const handleCopy = async (key: "direct" | "download", url: string) => {
    await copyToClipboard(url);
    setCopiedKey(key);
    window.setTimeout(() => setCopiedKey(null), 1600);
  };

  const onAction = (key: Key | null) => {
    if (key === "copy-direct-link") {
      void handleCopy("direct", directUrl);
    }

    if (key === "copy-download-link") {
      void handleCopy("download", downloadUrl);
    }

    if (key === "download-checksum" && checksumUrl) {
      startDownload(checksumUrl);
    }
  };

  return (
    <div className="inline-flex items-stretch overflow-hidden rounded-full">
      <Button className="rounded-r-none" onPress={() => startDownload(downloadUrl)} variant="primary">
        <Download aria-hidden="true" size={16} />
        {t("common.download")}
      </Button>
      <Dropdown>
        <Dropdown.Trigger>
          <Button
            aria-label={`${t("common.download")} ${fileName}`}
            className="rounded-l-none border-l border-white/15"
            isIconOnly
            variant="primary"
          >
            <ChevronDown aria-hidden="true" size={16} />
          </Button>
        </Dropdown.Trigger>
        <Dropdown.Popover>
          <Dropdown.Menu aria-label={fileName} onAction={onAction}>
            <Dropdown.Item
              id="copy-direct-link"
              key="copy-direct-link"
              textValue={copiedKey === "direct" ? t("common.copied") : t("common.copyDirectLink")}
            >
              <span className="flex items-center gap-2">
                {copiedKey === "direct" ? (
                  <Check aria-hidden="true" size={16} />
                ) : (
                  <Link aria-hidden="true" size={16} />
                )}
                {copiedKey === "direct" ? t("common.copied") : t("common.copyDirectLink")}
              </span>
            </Dropdown.Item>
            <Dropdown.Item
              id="copy-download-link"
              key="copy-download-link"
              textValue={copiedKey === "download" ? t("common.copied") : t("common.copyDownloadLink")}
            >
              <span className="flex items-center gap-2">
                {copiedKey === "download" ? (
                  <Check aria-hidden="true" size={16} />
                ) : (
                  <Copy aria-hidden="true" size={16} />
                )}
                {copiedKey === "download" ? t("common.copied") : t("common.copyDownloadLink")}
              </span>
            </Dropdown.Item>
            <Dropdown.Item
              id="download-checksum"
              key="download-checksum"
              className="border-t border-default-200 pt-2"
              isDisabled={!checksumUrl}
              textValue={t("common.downloadChecksum")}
            >
              <span className="flex items-center gap-2">
                <Fingerprint aria-hidden="true" size={16} />
                {t("common.downloadChecksum")}
              </span>
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>
    </div>
  );
}
