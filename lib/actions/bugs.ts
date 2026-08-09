"use server";

import { revalidatePath } from "next/cache";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type { BugKind, BugReport } from "@/types/bugs";

export async function getBugReports(): Promise<BugReport[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = createClient();
  const { data, error } = await supabase
    .from("bug_reports")
    .select("id, body, kind, resolved, created_at")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []) as BugReport[];
}

export async function createBugReport(body: string, kind: BugKind) {
  if (!isSupabaseConfigured()) return { error: "Supabase not configured" };

  const supabase = createClient();
  const { error } = await supabase.from("bug_reports").insert({ body, kind });

  if (error) return { error: error.message };

  revalidatePath("/");
  return { success: true };
}

export async function toggleBugResolved(id: string, resolved: boolean) {
  if (!isSupabaseConfigured()) return { error: "Supabase not configured" };

  const supabase = createClient();
  const { error } = await supabase
    .from("bug_reports")
    .update({ resolved, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/");
  return { success: true };
}

export async function deleteBugReport(id: string) {
  if (!isSupabaseConfigured()) return { error: "Supabase not configured" };

  const supabase = createClient();
  const { error } = await supabase.from("bug_reports").delete().eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/");
  return { success: true };
}
