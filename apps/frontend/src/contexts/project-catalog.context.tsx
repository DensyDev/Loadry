import type { Project, Site } from "@densy/loadry-contracts";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { useAsync } from "../hooks/useAsync";
import { downloads } from "../services/downloads";
import { ProjectService } from "../services/project.service";
import { fallbackSite } from "../utils/site";

type ProjectCatalogContextValue = {
  error: Error | null;
  isLoading: boolean;
  projectService: ProjectService;
  projects: Project[];
  reload: () => void;
  site: Site;
};

const ProjectCatalogContext = createContext<ProjectCatalogContextValue | null>(null);

export function ProjectCatalogProvider({ children }: { children: ReactNode }) {
  const [reloadToken, setReloadToken] = useState(0);
  const loadCatalog = useCallback(() => downloads.catalog.get(), []);
  const { data, error, isLoading } = useAsync(loadCatalog, [loadCatalog, reloadToken]);
  const projects = data?.projects ?? [];
  const site = data?.site ?? fallbackSite;
  const projectService = useMemo(() => new ProjectService(projects), [projects]);
  const value = useMemo(
    () => ({
      error,
      isLoading,
      projectService,
      projects,
      reload: () => setReloadToken(current => current + 1),
      site,
    }),
    [error, isLoading, projectService, projects, site]
  );

  return (
    <ProjectCatalogContext.Provider value={value}>
      {children}
    </ProjectCatalogContext.Provider>
  );
}

export function useProjectCatalog() {
  const value = useContext(ProjectCatalogContext);

  if (!value) {
    throw new Error("useProjectCatalog must be used inside ProjectCatalogProvider");
  }

  return value;
}
