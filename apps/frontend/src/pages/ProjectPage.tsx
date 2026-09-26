import { useEffect } from "react";
import { Navigate, useParams } from "react-router-dom";
import { ProjectCatalogState } from "../components/ProjectCatalogState";
import { useProjectCatalog } from "../contexts/project-catalog.context";
import { createProjectPath } from "../utils/project";
import { HomePage } from "./HomePage";

export function ProjectPage() {
  const { projectId } = useParams();
  const { error, isLoading, projectService, reload } = useProjectCatalog();
  const project = projectService.findById(projectId);
  const defaultProject = projectService.getDefault();

  useEffect(() => {
    if (project) {
      document.title = `${project.name} — Loadry`;
    }
  }, [project]);

  if (isLoading || error) {
    return <ProjectCatalogState error={error} isLoading={isLoading} onRetry={reload} />;
  }

  if (!project) {
    return defaultProject ? (
      <Navigate replace to={createProjectPath(defaultProject.id)} />
    ) : (
      <ProjectCatalogState error={null} isLoading={false} onRetry={reload} />
    );
  }

  return <HomePage project={project} />;
}
