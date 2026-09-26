import {
  Button,
  Label,
  NumberField,
  Pagination,
  Popover,
} from "@heroui/react";
import { Check, Minus, Plus, Rows3 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

type VersionPaginationProps = {
  isLoading: boolean;
  maxPageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  page: number;
  pageSize: number;
  pageSizeStep: number;
  totalItems: number;
  totalPages: number;
};

type PageItem = number | "ellipsis-start" | "ellipsis-end";

function visiblePages(page: number, totalPages: number): PageItem[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages: PageItem[] = [1];

  if (page > 4) pages.push("ellipsis-start");

  for (
    let current = Math.max(2, page - 1);
    current <= Math.min(totalPages - 1, page + 1);
    current += 1
  ) {
    pages.push(current);
  }

  if (page < totalPages - 3) pages.push("ellipsis-end");
  pages.push(totalPages);
  return pages;
}

export function VersionPagination({
  isLoading,
  maxPageSize,
  onPageChange,
  onPageSizeChange,
  page,
  pageSize,
  pageSizeStep,
  totalItems,
  totalPages,
}: VersionPaginationProps) {
  const { t } = useTranslation();

  if (totalItems === 0) return null;

  const firstItem = (page - 1) * pageSize + 1;
  const lastItem = Math.min(page * pageSize, totalItems);

  return (
    <Pagination
      aria-label={t("pagination.label")}
      className="flex-col items-center justify-between gap-3 sm:flex-row"
    >
      <Pagination.Summary>
        {t("pagination.summary", {
          from: firstItem,
          to: lastItem,
          total: totalItems,
        })}
      </Pagination.Summary>

      {totalPages > 1 && (
        <Pagination.Content className="self-center">
          <Pagination.Item>
            <Pagination.Previous
              aria-label={t("pagination.previous")}
              isDisabled={isLoading || page <= 1}
              onPress={() => onPageChange(page - 1)}
            >
              <Pagination.PreviousIcon />
            </Pagination.Previous>
          </Pagination.Item>

          {visiblePages(page, totalPages).map(item => (
            <Pagination.Item key={item}>
              {typeof item === "number" ? (
                <Pagination.Link
                  isActive={item === page}
                  isDisabled={isLoading}
                  onPress={() => onPageChange(item)}
                >
                  {item}
                </Pagination.Link>
              ) : (
                <Pagination.Ellipsis />
              )}
            </Pagination.Item>
          ))}

          <Pagination.Item>
            <Pagination.Next
              aria-label={t("pagination.next")}
              isDisabled={isLoading || page >= totalPages}
              onPress={() => onPageChange(page + 1)}
            >
              <Pagination.NextIcon />
            </Pagination.Next>
          </Pagination.Item>
        </Pagination.Content>
      )}

      <PageSizeControl
        isDisabled={isLoading}
        maxPageSize={maxPageSize}
        onChange={onPageSizeChange}
        pageSize={pageSize}
        pageSizeStep={pageSizeStep}
      />
    </Pagination>
  );
}

type PageSizeControlProps = {
  isDisabled: boolean;
  maxPageSize: number;
  onChange: (pageSize: number) => void;
  pageSize: number;
  pageSizeStep: number;
};

function PageSizeControl({
  isDisabled,
  maxPageSize,
  onChange,
  pageSize,
  pageSizeStep,
}: PageSizeControlProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [draftValue, setDraftValue] = useState(pageSize);
  const minimumPageSize = Math.min(pageSizeStep, maxPageSize);

  const handleOpenChange = (open: boolean) => {
    if (open) setDraftValue(pageSize);
    setIsOpen(open);
  };

  const apply = () => {
    const normalizedDraft = Number.isFinite(draftValue) ? draftValue : pageSize;
    const steppedValue = Math.round(normalizedDraft / pageSizeStep) * pageSizeStep;
    const value = Math.max(
      minimumPageSize,
      Math.min(maxPageSize, steppedValue)
    );
    onChange(value);
    setIsOpen(false);
  };

  return (
    <Popover isOpen={isOpen} onOpenChange={handleOpenChange}>
      <Popover.Trigger>
        <Button
          aria-label={t("pagination.pageSize")}
          isDisabled={isDisabled}
          variant="tertiary"
        >
          <Rows3 aria-hidden="true" size={17} />
          {pageSize}
        </Button>
      </Popover.Trigger>
      <Popover.Content placement="top end">
        <Popover.Arrow />
        <Popover.Dialog className="w-64 space-y-4 p-4">
          <Popover.Heading className="font-medium">
            {t("pagination.pageSize")}
          </Popover.Heading>
          <NumberField
            variant="secondary"
            fullWidth
            maxValue={maxPageSize}
            minValue={minimumPageSize}
            onChange={setDraftValue}
            onKeyDown={event => {
              if (event.key === "Enter") apply();
            }}
            step={pageSizeStep}
            value={draftValue}
          >
            <Label className="sr-only">{t("pagination.pageSize")}</Label>
            <NumberField.Group>
              <NumberField.DecrementButton>
                <Minus aria-hidden="true" size={16} />
              </NumberField.DecrementButton>
              <NumberField.Input />
              <NumberField.IncrementButton>
                <Plus aria-hidden="true" size={16} />
              </NumberField.IncrementButton>
            </NumberField.Group>
          </NumberField>
          <div className="text-xs text-muted">
            {t("pagination.pageSizeLimit", { max: maxPageSize })}
          </div>
          <Button className="w-full" onPress={apply} variant="primary">
            <Check aria-hidden="true" size={16} />
            {t("pagination.apply")}
          </Button>
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  );
}
