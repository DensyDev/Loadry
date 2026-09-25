import { ListBox, Select, Typography } from "@heroui/react";
import { Check, ChevronDown } from "lucide-react";
import type { Key } from "react";
import { useTranslation } from "react-i18next";
import type { BranchFilter } from "../hooks/useVersions";

type Option = {
  id: string;
  label?: string | null;
  labelKey?: string;
};

type VersionFiltersProps = {
  branchFilter: BranchFilter;
  branchOptions: Option[];
  onBranchChange: (value: BranchFilter) => void;
  onSeriesChange: (value: string[]) => void;
  seriesFilter: string[];
  seriesOptions: Option[];
};

function toggleSelection(key: Key | null, previous: string[]) {
  if (typeof key !== "string") {
    return previous;
  }

  if (key === "all") {
    return ["all"];
  }

  const selectedValues = previous.filter(item => item !== "all");

  if (selectedValues.includes(key)) {
    const nextValues = selectedValues.filter(item => item !== key);
    return nextValues.length > 0 ? nextValues : ["all"];
  }

  return [...selectedValues, key];
}

export function VersionFilters({
  branchFilter,
  branchOptions,
  onBranchChange,
  onSeriesChange,
  seriesFilter,
  seriesOptions,
}: VersionFiltersProps) {
  const { t } = useTranslation();

  const branchValueLabel = branchFilter.includes("all")
    ? t("filters.allBranches")
    : branchOptions
        .filter(option => branchFilter.includes(option.id as BranchFilter[number]))
        .map(option =>
          option.labelKey
            ? t(option.labelKey, { defaultValue: option.label ?? option.id })
            : option.label ?? option.id
        )
        .join(", ");

  const seriesValueLabel = seriesFilter.includes("all")
    ? t("filters.allVersions")
    : seriesOptions
        .filter(option => seriesFilter.includes(option.id))
        .map(option => (option.id === "all" ? t("filters.allVersions") : option.label ?? option.id))
        .join(", ");

  const handleBranchChange = (key: Key | null) => {
    onBranchChange(toggleSelection(key, branchFilter) as BranchFilter);
  };

  const handleSeriesChange = (key: Key | null) => {
    onSeriesChange(toggleSelection(key, seriesFilter));
  };

  const branchListBoxProps = {
    onAction: handleBranchChange,
    selectedKeys: new Set(branchFilter),
    selectionMode: "multiple",
  } as any;

  const seriesListBoxProps = {
    onAction: handleSeriesChange,
    selectedKeys: new Set(seriesFilter),
    selectionMode: "multiple",
  } as any;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <Typography.Paragraph className="text-sm font-medium text-muted">
          {t("filters.branch")}
        </Typography.Paragraph>
        <Select
          key={branchFilter.join("|")}
          placeholder={t("filters.branch")}
          variant="secondary"
        >
          <Select.Trigger>
            <span className="truncate text-left">{branchValueLabel}</span>
            <Select.Indicator>
              <ChevronDown aria-hidden="true" size={16} />
            </Select.Indicator>
          </Select.Trigger>
          <Select.Popover>
            <ListBox {...branchListBoxProps}>
              {branchOptions.map(option => (
                <ListBox.Item
                  id={option.id}
                  key={option.id}
                  textValue={option.id}
                  {...({ onPress: () => handleBranchChange(option.id) } as any)}
                >
                  <span className="flex w-full items-center justify-between gap-3">
                    <span>
                      {option.labelKey
                        ? t(option.labelKey, { defaultValue: option.label ?? option.id })
                        : option.label ?? option.id}
                    </span>
                    {branchFilter.includes(option.id as BranchFilter[number]) && (
                      <Check aria-hidden="true" size={16} />
                    )}
                  </span>
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>
      </div>

      <div className="space-y-2">
        <Typography.Paragraph className="text-sm font-medium text-muted">
          {t("filters.version")}
        </Typography.Paragraph>
        <Select
          key={seriesFilter.join("|")}
          placeholder={t("filters.version")}
          variant="secondary"
        >
          <Select.Trigger>
            <span className="truncate text-left">{seriesValueLabel}</span>
            <Select.Indicator>
              <ChevronDown aria-hidden="true" size={16} />
            </Select.Indicator>
          </Select.Trigger>
          <Select.Popover>
            <ListBox {...seriesListBoxProps}>
              {seriesOptions.map(option => (
                <ListBox.Item
                  id={option.id}
                  key={option.id}
                  textValue={option.id}
                  {...({ onPress: () => handleSeriesChange(option.id) } as any)}
                >
                  <span className="flex w-full items-center justify-between gap-3">
                    <span>
                      {option.id === "all"
                        ? t("filters.allVersions")
                        : option.label ?? option.id}
                    </span>
                    {seriesFilter.includes(option.id) && <Check aria-hidden="true" size={16} />}
                  </span>
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>
      </div>
    </div>
  );
}
