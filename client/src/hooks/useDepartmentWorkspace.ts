import { useEffect, useState } from "react";
import { z } from "zod";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { DEPARTMENT_SAMPLES } from "@/data/departmentSamples";
import { departmentInput, featureInput, FEATURE_STATUSES, type DepartmentInput, type DepartmentWorkspace, type FeatureInput, type FeatureStatus } from "@shared/departmentFeatures";

const STORAGE_KEY = "churchflow-department-workspaces-v1";
const storedSchema = z.array(z.object({
  id: z.number(), name: z.string(), leadName: z.string(), branchId: z.number().int().min(1).max(5),
  description: z.string(), memberCount: z.number(), features: z.array(featureInput.extend({
    id: z.number(), status: z.enum(FEATURE_STATUSES), teamNotes: z.string(), createdAt: z.string(),
  })),
}));
const readSamples = (): DepartmentWorkspace[] => {
  try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? storedSchema.parse(JSON.parse(raw)) : structuredClone(DEPARTMENT_SAMPLES); }
  catch { return structuredClone(DEPARTMENT_SAMPLES); }
};

export function useDepartmentWorkspace() {
  const { user, loading: authLoading, error: authError } = useAuth();
  const isSample = !user;
  const canManage = isSample || user?.role === "admin";
  const [samples, setSamples] = useState(readSamples);
  const [pending, setPending] = useState(false);
  const query = trpc.admin.departments.workspace.useQuery(undefined, { enabled: user?.role === "admin", retry: false });
  const createMutation = trpc.admin.departments.createWithFeatures.useMutation();
  const addMutation = trpc.admin.departments.addFeature.useMutation();
  const updateMutation = trpc.admin.departments.updateFeature.useMutation();
  useEffect(() => {
    const onStorage = (event: StorageEvent) => { if (event.key === STORAGE_KEY) setSamples(readSamples()); };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  const saveSamples = (next: DepartmentWorkspace[]) => {
    // Do not report success if browser storage is disabled or full.
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setSamples(next);
  };
  const run = async (fn: () => Promise<void>) => { setPending(true); try { await fn(); } finally { setPending(false); } };
  const create = (draft: DepartmentInput) => run(async () => {
    const input = departmentInput.parse(draft);
    if (!canManage) throw new Error("Only administrators can manage departments.");
    if (!isSample) { await createMutation.mutateAsync(input); await query.refetch(); return; }
    const current = readSamples();
    if (current.some(dept => dept.branchId === input.branchId && dept.name.toLowerCase() === input.name.toLowerCase())) throw new Error("This department already exists in this branch.");
    const id = Math.max(Date.now(), ...current.map(dept => dept.id + 1), ...current.flatMap(dept => dept.features.map(feature => feature.id + 1)));
    saveSamples([{ ...input, id, memberCount: 0, features: input.features.map((feature, i) => ({ ...feature, id: id + i, status: "submitted", teamNotes: "", createdAt: new Date().toISOString() })) }, ...current]);
  });
  const addFeature = (departmentId: number, draft: FeatureInput) => run(async () => {
    const feature = featureInput.parse(draft);
    if (!canManage) throw new Error("Only administrators can manage departments.");
    if (!isSample) { await addMutation.mutateAsync({ departmentId, feature }); await query.refetch(); return; }
    const current = readSamples();
    if (!current.some(dept => dept.id === departmentId)) throw new Error("Department no longer exists.");
    const id = Math.max(Date.now(), ...current.flatMap(dept => dept.features.map(item => item.id + 1)));
    saveSamples(current.map(dept => dept.id === departmentId ? { ...dept, features: [{ ...feature, id, status: "submitted", teamNotes: "", createdAt: new Date().toISOString() }, ...dept.features] } : dept));
  });
  const updateFeature = (id: number, status: FeatureStatus, teamNotes: string) => run(async () => {
    if (!canManage) throw new Error("Only administrators can manage departments.");
    if (!isSample) { await updateMutation.mutateAsync({ id, status, teamNotes }); await query.refetch(); return; }
    saveSamples(readSamples().map(dept => ({ ...dept, features: dept.features.map(feature => feature.id === id ? { ...feature, status, teamNotes } : feature) })));
  });
  return { items: isSample ? samples : query.data || [], isSample, canManage, pending,
    loading: authLoading || (!isSample && query.isLoading), error: authError || query.error,
    create, addFeature, updateFeature, retry: query.refetch };
}