import type { Project } from "@densy/loadry-contracts";
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

type ProjectCatalogContextValue = {
  error: Error | null;
  isLoading: boolean;
  projectService: ProjectService;
  projects: Project[];
  reload: () => void;
};

const ProjectCatalogContext = createContext<ProjectCatalogContextValue | null>(null);

export function ProjectCatalogProvider({ children }: { children: ReactNode }) {
  const [reloadToken, setReloadToken] = useState(0);
  const loadProjects = useCallback(() => downloads.projects.list(), []);
  const { data, error, isLoading } = useAsync(loadProjects, [loadProjects, reloadToken]);
  const projects = data ?? [];
  const projectService = useMemo(() => new ProjectService(projects), [projects]);
  const value = useMemo(
    () => ({
      error,
      isLoading,
      projectService,
      projects,
      reload: () => setReloadToken(current => current + 1),
    }),
    [error, isLoading, projectService, projects]
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
