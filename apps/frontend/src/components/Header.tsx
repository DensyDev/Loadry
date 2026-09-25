import {
  Button,
  Dropdown,
  Label,
  Modal,
  ToggleButton,
  ToggleButtonGroup,
  useOverlayState,
} from "@heroui/react";
import { Check, ChevronDown, Monitor, Moon, Sun } from "lucide-react";
import type { Key } from "react";
import { CircleFlag } from "react-circle-flags";
import { useTranslation } from "react-i18next";
import type { ThemeMode } from "../hooks/useTheme";
import { localeDefinitions, resolveLocale } from "../locales";

type HeaderProps = {
  onThemeModeChange: (themeMode: ThemeMode) => void;
  themeMode: ThemeMode;
};

const themeItems = [
  { id: "light", labelKey: "theme.light", icon: Sun },
  { id: "dark", labelKey: "theme.dark", icon: Moon },
  { id: "system", labelKey: "theme.system", icon: Monitor },
] as const;

type LanguageMenuProps = {
  activeLocaleCode: string;
  label: string;
  onAction: (key: Key | null) => void;
};

function LanguageMenu({ activeLocaleCode, label, onAction }: LanguageMenuProps) {
  return (
    <Dropdown.Popover>
      <Dropdown.Menu aria-label={label} onAction={onAction}>
        {localeDefinitions.map(item => (
          <Dropdown.Item id={item.code} key={item.code} textValue={item.nativeLabel}>
            <span className="flex w-full items-center justify-between gap-4">
              <span className="flex items-center gap-3">
                <CircleFlag
                  className="size-5.5 shrink-0"
                  countryCode={item.flagCountryCode}
                  height="20"
                />
                <Label>{item.nativeLabel}</Label>
              </span>
              {item.code === activeLocaleCode && <Check aria-hidden="true" size={16} />}
            </span>
          </Dropdown.Item>
        ))}
      </Dropdown.Menu>
    </Dropdown.Popover>
  );
}

export function Header({ onThemeModeChange, themeMode }: HeaderProps) {
  const { i18n, t } = useTranslation();
  const languageModal = useOverlayState();
  const themeModal = useOverlayState();
  const activeLocale = resolveLocale(i18n.resolvedLanguage ?? i18n.language);
  const activeLocaleCode = activeLocale.code;
  const activeTheme = themeItems.find(item => item.id === themeMode) ?? themeItems[2];
  const ActiveThemeIcon = activeTheme.icon;

  const changeLanguage = (key: Key | null) => {
    if (typeof key !== "string") {
      return;
    }

    const selectedLocale = localeDefinitions.find(item => item.code === key);

    if (selectedLocale) {
      void i18n.changeLanguage(selectedLocale.code);
    }
  };

  const selectTheme = (key: Key | null) => {
    if (key === "light" || key === "dark" || key === "system") {
      onThemeModeChange(key);
    }
  };

  const selectMobileLanguage = (localeCode: string) => {
    changeLanguage(localeCode);
    languageModal.close();
  };

  const selectMobileTheme = (theme: ThemeMode) => {
    onThemeModeChange(theme);
    themeModal.close();
  };

  const changeTheme = (keys: "all" | Set<Key>) => {
    if (keys !== "all") {
      selectTheme(Array.from(keys)[0] ?? null);
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[1382px] items-center justify-between gap-2 px-4 py-3 md:px-6">
        <div className="min-w-0 truncate text-lg font-semibold">Loadry</div>

        <div className="flex shrink-0 items-center gap-2">
          <div className="hidden sm:block">
            <Dropdown>
              <Dropdown.Trigger>
                <Button aria-label={t("header.language")} variant="tertiary">
                  <span className="flex items-center gap-3.5">
                    <CircleFlag
                      className="size-5.5 shrink-0"
                      countryCode={activeLocale.flagCountryCode}
                      height="20"
                    />
                    <span>{activeLocale.nativeLabel}</span>
                  </span>
                  <ChevronDown aria-hidden="true" size={16} />
                </Button>
              </Dropdown.Trigger>
              <LanguageMenu
                activeLocaleCode={activeLocaleCode}
                label={t("header.language")}
                onAction={changeLanguage}
              />
            </Dropdown>
          </div>

          <div className="sm:hidden">
            <Modal state={languageModal}>
              <Button
                aria-label={t("header.language")}
                className="h-10 rounded-full border-default-200 bg-default-100/80 px-3 text-foreground"
                variant="outline"
              >
                <CircleFlag
                  className="size-5.5 shrink-0"
                  countryCode={activeLocale.flagCountryCode}
                  height="20"
                />
                <span>{activeLocale.nativeLabel}</span>
                <ChevronDown aria-hidden="true" size={16} />
              </Button>
              <Modal.Backdrop>
                <Modal.Container placement="bottom" size="sm">
                  <Modal.Dialog className="max-h-[85dvh]">
                    <Modal.CloseTrigger />
                    <Modal.Header>
                      <Modal.Heading>{t("header.language")}</Modal.Heading>
                    </Modal.Header>
                    <Modal.Body>
                      <div className="flex flex-col gap-2">
                        {localeDefinitions.map(item => (
                          <Button
                            className="w-full justify-between px-3"
                            key={item.code}
                            onPress={() => selectMobileLanguage(item.code)}
                            variant={item.code === activeLocaleCode ? "secondary" : "tertiary"}
                          >
                            <span className="flex items-center gap-3">
                              <CircleFlag
                                className="size-6 shrink-0"
                                countryCode={item.flagCountryCode}
                                height="24"
                              />
                              <span>{item.nativeLabel}</span>
                            </span>
                            {item.code === activeLocaleCode && (
                              <Check aria-hidden="true" size={18} />
                            )}
                          </Button>
                        ))}
                      </div>
                    </Modal.Body>
                  </Modal.Dialog>
                </Modal.Container>
              </Modal.Backdrop>
            </Modal>
          </div>

          <div className="hidden sm:block">
            <ToggleButtonGroup
              aria-label="Theme switcher"
              disallowEmptySelection
              onSelectionChange={changeTheme}
              selectedKeys={new Set([themeMode])}
              selectionMode="single"
            >
              {themeItems.map(({ id, icon: Icon, labelKey }, index) => (
                <ToggleButton aria-label={t(labelKey)} id={id} isIconOnly key={id} variant="default">
                  {index > 0 && <ToggleButtonGroup.Separator />}
                  <Icon aria-hidden="true" size={16} />
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </div>

          <div className="sm:hidden">
            <Modal state={themeModal}>
              <Button
                aria-label={t(activeTheme.labelKey)}
                className="min-w-14 gap-1 px-2"
                style={{ color: "var(--color-foreground)" }}
                variant="secondary"
              >
                <ActiveThemeIcon aria-hidden="true" size={16} />
                <ChevronDown aria-hidden="true" size={14} />
              </Button>
              <Modal.Backdrop>
                <Modal.Container placement="bottom" size="sm">
                  <Modal.Dialog>
                    <Modal.CloseTrigger />
                    <Modal.Header>
                      <Modal.Heading>{t("header.theme")}</Modal.Heading>
                    </Modal.Header>
                    <Modal.Body>
                      <div className="flex flex-col gap-2">
                        {themeItems.map(({ id, icon: Icon, labelKey }) => (
                          <Button
                            className="w-full justify-between px-3"
                            key={id}
                            onPress={() => selectMobileTheme(id)}
                            variant={id === themeMode ? "secondary" : "tertiary"}
                          >
                            <span className="flex items-center gap-3">
                              <Icon aria-hidden="true" size={18} />
                              <span>{t(labelKey)}</span>
                            </span>
                            {id === themeMode && <Check aria-hidden="true" size={18} />}
                          </Button>
                        ))}
                      </div>
                    </Modal.Body>
                  </Modal.Dialog>
                </Modal.Container>
              </Modal.Backdrop>
            </Modal>
          </div>
        </div>
      </div>
    </header>
  );
}
