import { NextResponse } from "next/server";
import { AiError, generatePlans, isAiConfigured } from "@/lib/ai/openai";
import { getSignedInClient } from "@/lib/api/auth";
import { NOTES_MAX_LENGTH, PLAN_LIMIT, parseAboutYou, type PlanResponse } from "@/lib/onboarding/plan";

export const maxDuration = 60;

// Errors that mean the AI account can't serve requests (no key, no credit, rate limited).
const UNAVAILABLE = new Set([401, 402, 403, 429, 503]);

export async function POST(request: Request) {
  const session = await getSignedInClient();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { supabase, userId } = session;

  const body = (await request.json().catch(() => null)) as { about?: unknown; notes?: unknown } | null;
  const about = parseAboutYou(body?.about);
  if (!about) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const notes = String(body?.notes ?? "").trim().slice(0, NOTES_MAX_LENGTH);

  const { split: _split, ...answers } = about;
  const { error: profileError } = await supabase.from("profiles").update(answers).eq("id", userId);
  if (profileError) console.error("Saving onboarding answers failed", profileError.message);

  const { data: usage } = await supabase
    .from("plan_usage")
    .select("plan_generations")
    .eq("user_id", userId)
    .maybeSingle();
  const used = usage?.plan_generations ?? 0;

  const reply = (response: PlanResponse) => NextResponse.json(response);
  if (used >= PLAN_LIMIT) return reply({ plans: [], remaining: 0, error: "limit" });
  if (!isAiConfigured()) return reply({ plans: [], remaining: PLAN_LIMIT - used, error: "unavailable" });

  try {
    const plans = await generatePlans(about, notes);
    if (plans.length === 0) throw new AiError(502, "No plans returned");

    // Only successful builds count against the limit.
    const { data: total } = await supabase.rpc("claim_plan_generation");
    return reply({ plans, remaining: Math.max(0, PLAN_LIMIT - (total ?? used + 1)) });
  } catch (error) {
    const status = error instanceof AiError ? error.status : 500;
    if (!(error instanceof AiError)) console.error("Plan generation failed", error);
    return reply({
      plans: [],
      remaining: PLAN_LIMIT - used,
      error: UNAVAILABLE.has(status) ? "unavailable" : "failed",
    });
  }
}
