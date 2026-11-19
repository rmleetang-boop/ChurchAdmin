import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import type {
  DepartmentInput,
  FeatureInput,
  FeatureStatus,
} from "@shared/departmentFeatures";

export function useDepartmentWorkspace() {
  const { user } = useAuth();
  const canManage = user?.role === "admin" || user?.designation === "Technical administrator";
  const query = trpc.admin.departments.workspace.useQuery(undefined, {
    enabled: canManage,
    retry: false,
  });
  const create = trpc.admin.departments.createWithFeatures.useMutation();
  const add = trpc.admin.departments.addFeature.useMutation();
  const update = trpc.admin.departments.updateFeature.useMutation();
  return {
    items: query.data ?? [],
    canManage,
    isSample: false,
    loading: query.isLoading,
    error: query.error,
    pending: create.isPending || add.isPending || update.isPending,
    retry: query.refetch,
    create: async (draft: DepartmentInput) => {
      await create.mutateAsync(draft);
      await query.refetch();
    },
    addFeature: async (departmentId: number, feature: FeatureInput) => {
      await add.mutateAsync({ departmentId, feature });
      await query.refetch();
    },
    updateFeature: async (
      id: number,
      status: FeatureStatus,
      teamNotes: string
    ) => {
      await update.mutateAsync({ id, status, teamNotes });
      await query.refetch();
    },
  };
}
