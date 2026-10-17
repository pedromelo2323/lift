"use server";

import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type { BugKind, BugReport, BugReportList } from "@/types/bugs";

export async function getBugReports(): Promise<BugReportList> {
  if (!isSupabaseConfigured()) return { reports: [], isAdmin: false };

  const supabase = await createClient();
  const [{ data, error }, { data: isAdmin }] = await Promise.all([
    supabase
      .from("bug_reports")
      .select("id, body, kind, resolved, created_at, user_id")
      .order("created_at", { ascending: false }),
    supabase.rpc("is_admin"),
  ]);

  if (error) throw new Error(error.message);
  const rows = data ?? [];

  let names = new Map<string, string>();
  if (isAdmin && rows.length > 0) {
    const ids = [...new Set(rows.map((r) => r.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name")
      .in("id", ids);
    names = new Map((profiles ?? []).map((p) => [p.id, p.display_name ?? ""]));
  }

  const reports: BugReport[] = rows.map((r) => ({
    id: r.id,
    body: r.body,
    kind: r.kind as BugKind,
    resolved: r.resolved,
    created_at: r.created_at,
    reporter: isAdmin ? names.get(r.user_id) || null : null,
  }));

  return { reports, isAdmin: Boolean(isAdmin) };
}

export async function createBugReport(body: string, kind: BugKind) {
  if (!isSupabaseConfigured()) return { error: "Supabase not configured" };

  const supabase = await createClient();
  const { error } = await supabase.from("bug_reports").insert({ body, kind });

  if (error) return { error: error.message };
  return { success: true };
}

export async function toggleBugResolved(id: string, resolved: boolean) {
  if (!isSupabaseConfigured()) return { error: "Supabase not configured" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("bug_reports")
    .update({ resolved, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { error: error.message };
  return { success: true };
}

export async function deleteBugReport(id: string) {
  if (!isSupabaseConfigured()) return { error: "Supabase not configured" };

  const supabase = await createClient();
  const { error } = await supabase.from("bug_reports").delete().eq("id", id);

  if (error) return { error: error.message };
  return { success: true };
}
