import { useQuery } from "@tanstack/react-query";

interface RepositoryStatus {
  status?: string;
}

export function useRepository() {
  const { data: repository, isLoading, error } = useQuery<RepositoryStatus>({
    queryKey: ["/api/repository"],
  });

  return {
    repository,
    isLoading,
    error,
    isComplete: repository?.status === "complete"
  };
}
