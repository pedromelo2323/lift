import { supabase } from "@/integrations/supabase/client";

export type BugKind = "bug" | "idea";

export type BugReport = {
  id: string;
  body: string;
  kind: BugKind;
  resolved: boolean;
  created_at: string;
};

export async function fetchBugReports(): Promise<BugReport[]> {
  const { data, error } = await supabase
    .from("bug_reports")
    .select("id, body, kind, resolved, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as BugReport[];
}

export async function addBugReport(body: string, kind: BugKind) {
  const { error } = await supabase.from("bug_reports").insert({ body, kind });
  if (error) throw error;
}

export async function setBugResolved(id: string, resolved: boolean) {
  const { error } = await supabase.from("bug_reports").update({ resolved }).eq("id", id);
  if (error) throw error;
}

export async function deleteBugReport(id: string) {
  const { error } = await supabase.from("bug_reports").delete().eq("id", id);
  if (error) throw error;
}
