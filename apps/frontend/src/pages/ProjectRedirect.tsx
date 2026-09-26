import { Navigate, useLocation, useParams } from "react-router-dom";
import { ProjectCatalogState } from "../components/ProjectCatalogState";
import { useProjectCatalog } from "../contexts/project-catalog.context";
import { createProjectPath } from "../utils/project";

export function DefaultProjectRedirect() {
  const location = useLocation();
  const { error, isLoading, projectService, reload } = useProjectCatalog();

  if (isLoading || error) {
    return <ProjectCatalogState error={error} isLoading={isLoading} onRetry={reload} />;
  }

  const forwardedProject = projectService.findByDomain(window.location.hostname);
  const project = forwardedProject ?? projectService.getDefault();

  if (!project) {
    return <ProjectCatalogState error={null} isLoading={false} onRetry={reload} />;
  }

  return (
    <Navigate
      replace
      to={{
        pathname: createProjectPath(project.id),
        search: forwardedProject ? location.search : "",
      }}
    />
  );
}

export function ProjectAliasRedirect() {
  const location = useLocation();
  const { projectId } = useParams();
  const { error, isLoading, projectService, reload } = useProjectCatalog();

  if (isLoading || error) {
    return <ProjectCatalogState error={error} isLoading={isLoading} onRetry={reload} />;
  }

  const requestedProject = projectService.findById(projectId);
  const project = requestedProject ?? projectService.getDefault();

  if (!project) {
    return <ProjectCatalogState error={null} isLoading={false} onRetry={reload} />;
  }

  return (
    <Navigate
      replace
      to={{
        pathname: createProjectPath(project.id),
        search: requestedProject ? location.search : "",
      }}
    />
  );
}
