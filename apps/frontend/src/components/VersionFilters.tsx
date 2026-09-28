import type { TagGroup, TagSelections } from "@densy/loadry-contracts";
import {
  Button,
  Dropdown,
  ListBox,
  Modal,
  Select,
  Typography,
  useOverlayState,
} from "@heroui/react";
import { Check, ChevronDown, Tags, X } from "lucide-react";
import { useEffect, useRef, useState, type Key } from "react";
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
  showBranchFilter: boolean;
  tagFilter: TagSelections;
  tagGroups: TagGroup[];
  onTagChange: (value: TagSelections) => void;
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
  showBranchFilter,
  tagFilter,
  tagGroups,
  onTagChange,
}: VersionFiltersProps) {
  const { t } = useTranslation();
  const branchModal = useOverlayState();
  const seriesModal = useOverlayState();
  const tagsModal = useOverlayState();
  const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false);
  const [tagMenuColumnWidth, setTagMenuColumnWidth] = useState<number | null>(null);
  const tagTriggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const trigger = tagTriggerRef.current;

    if (!trigger) return;

    const updateColumnWidth = () => {
      setTagMenuColumnWidth(trigger.getBoundingClientRect().width / 2);
    };
    const resizeObserver = new ResizeObserver(updateColumnWidth);
    updateColumnWidth();
    resizeObserver.observe(trigger);

    return () => resizeObserver.disconnect();
  }, [tagGroups.length, showBranchFilter]);

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

  const selectedTagCount = Object.values(tagFilter).reduce(
    (total, values) => total + values.length,
    0
  );

  const updateTagGroup = (group: TagGroup, keys: "all" | Set<Key>) => {
    const nextValues = keys === "all"
      ? group.values.map(value => value.id)
      : Array.from(keys).filter((key): key is string => typeof key === "string");
    const next = { ...tagFilter };

    if (nextValues.length) next[group.id] = nextValues;
    else delete next[group.id];
    onTagChange(next);
  };

  const toggleTagValue = (group: TagGroup, value: string) => {
    const selectedKeys = new Set(tagFilter[group.id] ?? []);

    if (selectedKeys.has(value)) selectedKeys.delete(value);
    else selectedKeys.add(value);
    updateTagGroup(group, selectedKeys);
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

  const gridClassName = tagGroups.length
    ? showBranchFilter
      ? "grid-cols-2 md:grid-cols-3"
      : "grid-cols-1 md:grid-cols-2"
    : showBranchFilter
      ? "grid-cols-2"
      : "grid-cols-1";

  return (
    <div className={`grid gap-4 ${gridClassName}`}>
      {showBranchFilter && (
        <div className="space-y-2">
          <Typography.Paragraph className="text-sm font-medium text-muted">
            {t("filters.branch")}
          </Typography.Paragraph>
          <div className="hidden sm:block">
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
          <div className="sm:hidden">
            <Modal state={branchModal}>
              <Button className="w-full justify-between rounded-field px-3" variant="secondary">
                <span className="truncate text-left">{branchValueLabel}</span>
                <ChevronDown aria-hidden="true" size={16} />
              </Button>
              <Modal.Backdrop>
                <Modal.Container placement="bottom" size="sm">
                  <Modal.Dialog className="max-h-[85dvh]">
                    <Modal.CloseTrigger />
                    <Modal.Header>
                      <Modal.Heading>{t("filters.branch")}</Modal.Heading>
                    </Modal.Header>
                    <Modal.Body>
                      <div className="flex flex-col gap-2">
                        {branchOptions.map(option => {
                          const isSelected = branchFilter.includes(
                            option.id as BranchFilter[number]
                          );

                          return (
                            <Button
                              className="w-full justify-between px-3"
                              key={option.id}
                              onPress={() => handleBranchChange(option.id)}
                              variant={isSelected ? "secondary" : "tertiary"}
                            >
                              <span className="text-left">
                                {option.labelKey
                                  ? t(option.labelKey, {
                                      defaultValue: option.label ?? option.id,
                                    })
                                  : option.label ?? option.id}
                              </span>
                              {isSelected && <Check aria-hidden="true" size={18} />}
                            </Button>
                          );
                        })}
                      </div>
                    </Modal.Body>
                  </Modal.Dialog>
                </Modal.Container>
              </Modal.Backdrop>
            </Modal>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Typography.Paragraph className="text-sm font-medium text-muted">
          {t("filters.version")}
        </Typography.Paragraph>
        <div className="hidden sm:block">
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
        <div className="sm:hidden">
          <Modal state={seriesModal}>
            <Button className="w-full justify-between rounded-field px-3" variant="secondary">
              <span className="truncate text-left">{seriesValueLabel}</span>
              <ChevronDown aria-hidden="true" size={16} />
            </Button>
            <Modal.Backdrop>
              <Modal.Container placement="bottom" size="sm">
                <Modal.Dialog className="max-h-[85dvh]">
                  <Modal.CloseTrigger />
                  <Modal.Header>
                    <Modal.Heading>{t("filters.version")}</Modal.Heading>
                  </Modal.Header>
                  <Modal.Body>
                    <div className="flex flex-col gap-2">
                      {seriesOptions.map(option => {
                        const isSelected = seriesFilter.includes(option.id);

                        return (
                          <Button
                            className="w-full justify-between px-3"
                            key={option.id}
                            onPress={() => handleSeriesChange(option.id)}
                            variant={isSelected ? "secondary" : "tertiary"}
                          >
                            <span className="text-left">
                              {option.id === "all"
                                ? t("filters.allVersions")
                                : option.label ?? option.id}
                            </span>
                            {isSelected && <Check aria-hidden="true" size={18} />}
                          </Button>
                        );
                      })}
                    </div>
                  </Modal.Body>
                </Modal.Dialog>
              </Modal.Container>
            </Modal.Backdrop>
          </Modal>
        </div>
      </div>

      {tagGroups.length > 0 && (
        <div
          className={`${showBranchFilter ? "col-span-2 md:col-span-1" : ""} select--secondary space-y-2`}
        >
          <Typography.Paragraph className="text-sm font-medium text-muted">
            {t("filters.tags", { defaultValue: "Tags" })}
          </Typography.Paragraph>
          <div className="hidden sm:block">
          <Dropdown isOpen={isTagDropdownOpen} onOpenChange={setIsTagDropdownOpen}>
            <Dropdown.Trigger
              className="select__trigger select__trigger--full-width"
              ref={tagTriggerRef}
              style={{ color: "var(--accent-soft-foreground)", transform: "none" }}
            >
              <span className="select__value flex min-w-0 items-center gap-2">
                <Tags aria-hidden="true" className="shrink-0" size={16} />
                <span className="truncate text-left">
                  {selectedTagCount
                    ? t("filters.selectedTags", {
                        count: selectedTagCount,
                        defaultValue: `Tags (${selectedTagCount})`,
                      })
                    : t("filters.allTags", { defaultValue: "All tags" })}
                </span>
              </span>
              <ChevronDown
                aria-hidden="true"
                className="select__indicator"
                data-open={isTagDropdownOpen ? "true" : undefined}
                size={16}
              />
            </Dropdown.Trigger>
            <Dropdown.Popover
              style={tagMenuColumnWidth === null ? undefined : {
                maxWidth: "none",
                minWidth: tagMenuColumnWidth,
                width: tagMenuColumnWidth,
              }}
            >
              <Dropdown.Menu aria-label={t("filters.tags", { defaultValue: "Tags" })}>
                {selectedTagCount > 0 && (
                  <Dropdown.Item
                    id="clear-tags"
                    onAction={() => onTagChange({})}
                    textValue={t("filters.clearTags", { defaultValue: "Clear tags" })}
                  >
                    <span className="flex items-center gap-2 text-danger">
                      <X aria-hidden="true" size={16} />
                      {t("filters.clearTags", { defaultValue: "Clear tags" })}
                    </span>
                  </Dropdown.Item>
                )}
                {tagGroups.map(group => (
                  <Dropdown.SubmenuTrigger key={group.id}>
                    <Dropdown.Item id={`group:${group.id}`} textValue={group.label}>
                      <span className="flex w-full items-center justify-between gap-4">
                        <span>{group.label}</span>
                        <span className="flex items-center gap-2 text-muted">
                          {(tagFilter[group.id]?.length ?? 0) > 0 && (
                            <span>{tagFilter[group.id]?.length}</span>
                          )}
                          <Dropdown.SubmenuIndicator />
                        </span>
                      </span>
                    </Dropdown.Item>
                    <Dropdown.Popover
                      style={tagMenuColumnWidth === null ? undefined : {
                        maxWidth: "none",
                        minWidth: tagMenuColumnWidth,
                        width: tagMenuColumnWidth,
                      }}
                    >
                      <Dropdown.Menu
                        aria-label={group.label}
                        onSelectionChange={keys => updateTagGroup(group, keys)}
                        selectedKeys={new Set(tagFilter[group.id] ?? [])}
                        selectionMode="multiple"
                      >
                        {group.values.map(tag => (
                          <Dropdown.Item
                            id={tag.id}
                            key={tag.id}
                            textValue={tag.label}
                          >
                            <span className="flex w-full items-center justify-between gap-4">
                              <span>{tag.label}</span>
                              {tagFilter[group.id]?.includes(tag.id) && (
                                <Check aria-hidden="true" size={16} />
                              )}
                            </span>
                          </Dropdown.Item>
                        ))}
                      </Dropdown.Menu>
                    </Dropdown.Popover>
                  </Dropdown.SubmenuTrigger>
                ))}
              </Dropdown.Menu>
            </Dropdown.Popover>
          </Dropdown>
          </div>
          <div className="sm:hidden">
            <Modal state={tagsModal}>
              <Button
                className="w-full justify-between rounded-field px-3"
                style={{ color: "var(--accent-soft-foreground)" }}
                variant="secondary"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <Tags aria-hidden="true" className="shrink-0" size={16} />
                  <span className="truncate text-left">
                    {selectedTagCount
                      ? t("filters.selectedTags", {
                          count: selectedTagCount,
                          defaultValue: `Tags (${selectedTagCount})`,
                        })
                      : t("filters.allTags", { defaultValue: "All tags" })}
                  </span>
                </span>
                <ChevronDown aria-hidden="true" size={16} />
              </Button>
              <Modal.Backdrop>
                <Modal.Container placement="bottom" size="sm">
                  <Modal.Dialog className="max-h-[85dvh]">
                    <Modal.CloseTrigger />
                    <Modal.Header>
                      <Modal.Heading>
                        {t("filters.tags", { defaultValue: "Tags" })}
                      </Modal.Heading>
                    </Modal.Header>
                    <Modal.Body>
                      <div className="space-y-3">
                        {tagGroups.map(group => (
                          <section className="rounded-2xl border border-default-200 p-2" key={group.id}>
                            <Typography.Paragraph className="px-2 pb-1 text-sm font-semibold">
                              {group.label}
                            </Typography.Paragraph>
                            <div className="flex flex-col gap-1">
                              {group.values.map(tag => {
                                const isSelected = tagFilter[group.id]?.includes(tag.id) === true;

                                return (
                                  <Button
                                    className="w-full justify-between px-3"
                                    key={tag.id}
                                    onPress={() => toggleTagValue(group, tag.id)}
                                    variant={isSelected ? "secondary" : "tertiary"}
                                  >
                                    <span className="text-left">{tag.label}</span>
                                    {isSelected && <Check aria-hidden="true" size={18} />}
                                  </Button>
                                );
                              })}
                            </div>
                          </section>
                        ))}
                        {selectedTagCount > 0 && (
                          <Button
                            className="w-full"
                            onPress={() => onTagChange({})}
                            variant="danger-soft"
                          >
                            <X aria-hidden="true" size={18} />
                            {t("filters.clearTags", { defaultValue: "Clear tags" })}
                          </Button>
                        )}
                      </div>
                    </Modal.Body>
                  </Modal.Dialog>
                </Modal.Container>
              </Modal.Backdrop>
            </Modal>
          </div>
        </div>
      )}
    </div>
  );
}
