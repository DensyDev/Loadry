import { Card, CardContent } from "@heroui/react";
import type { Project } from "@densy/loadry-contracts";
import { useNavigate } from "react-router-dom";
import { useProjectCatalog } from "../contexts/project-catalog.context";
import { createProjectPath } from "../utils/project";
import { ProjectSelector } from "../components/ProjectSelector";
import { VersionFilters } from "../components/VersionFilters";
import { VersionsTable } from "../components/VersionsTable";
import { VersionPagination } from "../components/VersionPagination";
import { useVersions } from "../hooks/useVersions";

type HomePageProps = {
  project: Project;
};

export function HomePage({ project }: HomePageProps) {
  const navigate = useNavigate();
  const { projects } = useProjectCatalog();
  const {
    branchFilter,
    branchOptions,
    entries,
    error,
    isLoading,
    pagination,
    reload,
    seriesFilter,
    seriesOptions,
    setBranchFilter,
    setPage,
    setPageSize,
    setSeriesFilter,
  } = useVersions(project);

  const selectProject = (projectId: string) => {
    navigate(createProjectPath(projectId));
  };

  return (
    <section className="mx-auto w-full max-w-[1382px] space-y-4 px-4 py-8 md:px-6">
      <ProjectSelector
        onChange={selectProject}
        project={project}
        projects={projects}
      />
      <Card>
        <CardContent className="space-y-4">
          <VersionFilters
            branchFilter={branchFilter}
            branchOptions={branchOptions}
            onBranchChange={setBranchFilter}
            onSeriesChange={setSeriesFilter}
            seriesFilter={seriesFilter}
            seriesOptions={seriesOptions}
          />
          <VersionsTable
            entries={entries}
            error={error}
            isLoading={isLoading}
            onRetry={reload}
          />
          <VersionPagination
            isLoading={isLoading}
            maxPageSize={pagination.maxPageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            page={pagination.page}
            pageSize={pagination.pageSize}
            pageSizeStep={pagination.pageSizeStep}
            totalItems={pagination.totalItems}
            totalPages={pagination.totalPages}
          />
        </CardContent>
      </Card>
    </section>
  );
}
