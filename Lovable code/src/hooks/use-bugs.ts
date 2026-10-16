import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addBugReport,
  deleteBugReport,
  fetchBugReports,
  setBugResolved,
  type BugKind,
} from "@/lib/lift/bugs";

export const bugReportsKey = ["bug-reports"] as const;

export function useBugReports() {
  return useQuery({ queryKey: bugReportsKey, queryFn: fetchBugReports });
}

export function useBugMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: bugReportsKey });

  const create = useMutation({
    mutationFn: (input: { body: string; kind: BugKind }) =>
      addBugReport(input.body, input.kind),
    onSuccess: invalidate,
  });

  const toggle = useMutation({
    mutationFn: (input: { id: string; resolved: boolean }) =>
      setBugResolved(input.id, input.resolved),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteBugReport(id),
    onSuccess: invalidate,
  });

  return { create, toggle, remove };
}
