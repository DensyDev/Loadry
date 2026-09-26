import {
  Button,
  DateField,
  DateRangePicker,
  InputGroup,
  Label,
  Modal,
  Popover,
  RangeCalendar,
  SearchField,
  TextField,
  useOverlayState,
} from "@heroui/react";
import { parseDate } from "@internationalized/date";
import { Check, Search, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { VersionSearchFilters } from "../hooks/useVersions";

type VersionSearchProps = {
  filters: VersionSearchFilters;
  onChange: (filters: VersionSearchFilters) => void;
};

const emptyFilters: VersionSearchFilters = {
  modifiedFrom: "",
  modifiedTo: "",
  propertyKey: "",
  propertyValue: "",
  query: "",
};

function countAdvancedFilters(filters: VersionSearchFilters) {
  return [
    filters.modifiedFrom,
    filters.modifiedTo,
    filters.propertyKey,
    filters.propertyValue,
  ].filter(Boolean).length;
}

export function VersionSearch({ filters, onChange }: VersionSearchProps) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState(filters);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const mobileModal = useOverlayState();
  const advancedFilterCount = countAdvancedFilters(filters);

  useEffect(() => {
    setDraft(filters);
  }, [
    filters.modifiedFrom,
    filters.modifiedTo,
    filters.propertyKey,
    filters.propertyValue,
    filters.query,
  ]);

  useEffect(() => {
    if (draft.query === filters.query) return;

    const timeout = window.setTimeout(() => {
      onChange({ ...filters, query: draft.query });
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [draft.query, filters, onChange]);

  const apply = () => {
    onChange(draft);
    setIsPopoverOpen(false);
    mobileModal.close();
  };

  const reset = () => {
    setDraft(emptyFilters);
    onChange(emptyFilters);
    setIsPopoverOpen(false);
    mobileModal.close();
  };

  const openMobileModal = () => {
    setDraft(filters);
    mobileModal.open();
  };

  const desktopSearch = useMemo(
    () => (
      <SearchField
        aria-label={t("filters.search")}
        fullWidth
        onChange={query => setDraft(current => ({ ...current, query }))}
        value={draft.query}
      >
        <SearchField.Group>
          <SearchField.SearchIcon />
          <SearchField.Input placeholder={t("filters.searchPlaceholder")} />
          <SearchField.ClearButton />
          <Popover
            isOpen={isPopoverOpen}
            onOpenChange={open => {
              setIsPopoverOpen(open);
              if (open) setDraft(filters);
            }}
          >
            <Popover.Trigger>
              <Button
                aria-label={t("filters.advanced")}
                className="relative ml-1 border-l border-default-200"
                isIconOnly
                variant="ghost"
              >
                <SlidersHorizontal aria-hidden="true" size={17} />
                {advancedFilterCount > 0 && (
                  <span className="absolute right-0.5 top-0.5 flex size-4 items-center justify-center rounded-full bg-accent text-[10px] font-semibold text-accent-foreground">
                    {advancedFilterCount}
                  </span>
                )}
              </Button>
            </Popover.Trigger>
            <Popover.Content placement="bottom end">
              <Popover.Arrow />
              <Popover.Dialog className="w-[min(26rem,calc(100vw-2rem))] space-y-4 p-4">
                <Popover.Heading className="font-medium">
                  {t("filters.advanced")}
                </Popover.Heading>
                <AdvancedSearchFields draft={draft} onDraftChange={setDraft} />
                <SearchActions onApply={apply} onReset={reset} />
              </Popover.Dialog>
            </Popover.Content>
          </Popover>
        </SearchField.Group>
      </SearchField>
    ),
    [
      advancedFilterCount,
      draft,
      filters,
      isPopoverOpen,
      t,
    ]
  );

  return (
    <>
      <div className="hidden sm:block">{desktopSearch}</div>

      <div className="flex justify-end sm:hidden">
        <Modal state={mobileModal}>
          <Button
            aria-label={t("filters.search")}
            className="w-full"
            onPress={openMobileModal}
            variant={filters.query || advancedFilterCount ? "secondary" : "tertiary"}
          >
            <Search aria-hidden="true" size={17} />
            {t("filters.search")}
            {(filters.query || advancedFilterCount > 0) && (
              <span className="rounded-full bg-accent px-1.5 text-xs font-semibold text-accent-foreground">
                {advancedFilterCount + (filters.query ? 1 : 0)}
              </span>
            )}
          </Button>
          <Modal.Backdrop>
            <Modal.Container placement="bottom" size="sm">
              <Modal.Dialog className="max-h-[90dvh]">
                <Modal.CloseTrigger />
                <Modal.Header>
                  <Modal.Heading>{t("filters.search")}</Modal.Heading>
                </Modal.Header>
                <Modal.Body>
                  <div className="space-y-5 pb-2">
                    <SearchField
                      aria-label={t("filters.search")}
                      autoFocus
                      fullWidth
                      onChange={query => setDraft(current => ({ ...current, query }))}
                      value={draft.query}
                    >
                      <SearchField.Group>
                        <SearchField.SearchIcon />
                        <SearchField.Input placeholder={t("filters.searchPlaceholder")} />
                        <SearchField.ClearButton />
                      </SearchField.Group>
                    </SearchField>
                    <p className="text-xs leading-relaxed text-muted">
                      {t("filters.searchDescription")}
                    </p>
                    <AdvancedSearchFields draft={draft} onDraftChange={setDraft} />
                    <SearchActions onApply={apply} onReset={reset} />
                  </div>
                </Modal.Body>
              </Modal.Dialog>
            </Modal.Container>
          </Modal.Backdrop>
        </Modal>
      </div>
    </>
  );
}

type AdvancedSearchFieldsProps = {
  draft: VersionSearchFilters;
  onDraftChange: (filters: VersionSearchFilters) => void;
};

function AdvancedSearchFields({ draft, onDraftChange }: AdvancedSearchFieldsProps) {
  const { t } = useTranslation();
  const dateRange =
    draft.modifiedFrom && draft.modifiedTo
      ? {
          end: parseDate(draft.modifiedTo),
          start: parseDate(draft.modifiedFrom),
        }
      : null;
  const update = (key: keyof VersionSearchFilters, value: string) => {
    onDraftChange({ ...draft, [key]: value });
  };

  return (
    <div className="space-y-4">
      <DateRangePicker
        className="w-full"
        onChange={range =>
          onDraftChange({
            ...draft,
            modifiedFrom: range?.start.toString() ?? "",
            modifiedTo: range?.end.toString() ?? "",
          })
        }
        value={dateRange}
      >
        <Label>{t("filters.modifiedDate")}</Label>
        <DateField.Group fullWidth variant="secondary">
          <DateField.InputContainer>
            <DateField.Input slot="start">
              {segment => <DateField.Segment segment={segment} />}
            </DateField.Input>
            <DateRangePicker.RangeSeparator />
            <DateField.Input slot="end">
              {segment => <DateField.Segment segment={segment} />}
            </DateField.Input>
          </DateField.InputContainer>
          <DateField.Suffix>
            <DateRangePicker.Trigger>
              <DateRangePicker.TriggerIndicator />
            </DateRangePicker.Trigger>
          </DateField.Suffix>
        </DateField.Group>
        <DateRangePicker.Popover>
          <RangeCalendar aria-label={t("filters.modifiedDate")}>
            <RangeCalendar.Header>
              <RangeCalendar.Heading />
              <RangeCalendar.NavButton slot="previous" />
              <RangeCalendar.NavButton slot="next" />
            </RangeCalendar.Header>
            <RangeCalendar.Grid>
              <RangeCalendar.GridHeader>
                {day => <RangeCalendar.HeaderCell>{day}</RangeCalendar.HeaderCell>}
              </RangeCalendar.GridHeader>
              <RangeCalendar.GridBody>
                {date => <RangeCalendar.Cell date={date} />}
              </RangeCalendar.GridBody>
            </RangeCalendar.Grid>
          </RangeCalendar>
        </DateRangePicker.Popover>
      </DateRangePicker>

      <fieldset className="rounded-xl border border-default-300 bg-default-100/35 p-3">
        <legend className="px-1 text-sm font-medium text-foreground">
          {t("filters.properties")}
        </legend>
        <div className="grid grid-cols-1 gap-3 pt-1 sm:grid-cols-2">
          <TextField
            onChange={value => update("propertyKey", value)}
            value={draft.propertyKey}
          >
            <Label>{t("filters.propertyKey")}</Label>
            <InputGroup fullWidth variant="secondary">
              <InputGroup.Input placeholder={t("filters.propertyKeyPlaceholder")} />
            </InputGroup>
          </TextField>
          <TextField
            onChange={value => update("propertyValue", value)}
            value={draft.propertyValue}
          >
            <Label>{t("filters.propertyValue")}</Label>
            <InputGroup fullWidth variant="secondary">
              <InputGroup.Input placeholder={t("filters.propertyValuePlaceholder")} />
            </InputGroup>
          </TextField>
        </div>
      </fieldset>
    </div>
  );
}

type SearchActionsProps = {
  onApply: () => void;
  onReset: () => void;
};

function SearchActions({ onApply, onReset }: SearchActionsProps) {
  const { t } = useTranslation();

  return (
    <div className="flex gap-2">
      <Button className="flex-1" onPress={onReset} variant="tertiary">
        <X aria-hidden="true" size={16} />
        {t("filters.reset")}
      </Button>
      <Button className="flex-1" onPress={onApply} variant="primary">
        <Check aria-hidden="true" size={16} />
        {t("filters.apply")}
      </Button>
    </div>
  );
}
