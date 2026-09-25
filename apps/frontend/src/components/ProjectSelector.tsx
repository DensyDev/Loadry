import { ListBox, Select } from "@heroui/react";
import type { Project } from "@densy/loadry-contracts";
import { Check, ChevronDown, PackageOpen } from "lucide-react";
import type { Key } from "react";
import { useTranslation } from "react-i18next";

type ProjectSelectorProps = {
  onChange: (projectId: string) => void;
  project: Project;
  projects: Project[];
};

export function ProjectSelector({ onChange, project, projects }: ProjectSelectorProps) {
  const { t } = useTranslation();

  const handleChange = (key: Key | null) => {
    if (typeof key === "string" && key !== project.id) {
      onChange(key);
    }
  };

  const listBoxProps = {
    onAction: handleChange,
    selectedKeys: new Set([project.id]),
    selectionMode: "single",
  } as any;

  return (
    <Select
      aria-label={t("projects.select")}
      key={project.id}
      placeholder={t("projects.select")}
      variant="secondary"
    >
      <Select.Trigger className="min-h-20 px-4 py-3">
        <span className="flex min-w-0 flex-1 items-center gap-3 text-left">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
            <PackageOpen aria-hidden="true" size={20} />
          </span>
          <span className="min-w-0">
            <span className="block truncate font-semibold">{project.name}</span>
            <span className="block truncate text-sm text-muted">{project.description}</span>
          </span>
        </span>
        <Select.Indicator>
          <ChevronDown aria-hidden="true" size={18} />
        </Select.Indicator>
      </Select.Trigger>
      <Select.Popover>
        <ListBox {...listBoxProps}>
          {projects.map(option => (
            <ListBox.Item
              id={option.id}
              key={option.id}
              textValue={`${option.name} ${option.description}`}
              {...({ onPress: () => handleChange(option.id) } as any)}
            >
              <span className="flex w-full items-center justify-between gap-4 py-1">
                <span className="min-w-0">
                  <span className="block truncate font-medium">{option.name}</span>
                  <span className="block truncate text-sm text-muted">{option.description}</span>
                </span>
                {option.id === project.id && <Check aria-hidden="true" className="shrink-0" size={16} />}
              </span>
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
  );
}
