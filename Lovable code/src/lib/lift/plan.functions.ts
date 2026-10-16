import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Template } from "./templates";

export type AboutYou = {
  age_range: string;
  sex: string;
  goal: string;
  days_per_week: number;
  session_minutes: number;
  experience: string;
  split?: string | undefined;
};

const MAX_GENERATIONS = 3;

const ONE_PLAN = {
  type: "object",
  additionalProperties: false,
  required: ["name", "blurb", "workouts"],
  properties: {
    name: { type: "string" },
    blurb: { type: "string" },
    workouts: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "exercises"],
        properties: {
          name: { type: "string" },
          exercises: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["name", "target_reps", "superset_with_next"],
              properties: {
                name: { type: "string" },
                target_reps: { type: "string" },
                superset_with_next: { type: "boolean" },
              },
            },
          },
        },
      },
    },
  },
};

const PLAN_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["options"],
  properties: { options: { type: "array", items: ONE_PLAN } },
};

const INSTRUCTIONS = `You are an expert strength coach designing gym plans for a minimalist workout log app.
Return exactly TWO genuinely different plan options. If the person has no split preference, use two different splits that both
suit their days per week (e.g. 3 days: Push/Pull/Legs vs Full body x3; 4 days: Upper/Lower vs Push/Pull/Legs + Full body).
If they chose a split, both options use it but differ in emphasis or exercise selection. Each option has exactly as many workouts as the person's days per week (max 6). Fit each workout in their session length
(about 4 exercises for 30 min, 5 for 45, 6 for 60, 7 for 90). Use common exercise names (e.g. "Hip thrust", "Lat pulldown").
target_reps is a short range like "8–10" or "12–15" (use "45s" for timed holds). Use superset_with_next=true only to pair two
compatible accessory moves; never on the last exercise of a workout. Respect preferences, dislikes, injuries and equipment.
Never repeat an identical workout within a week: when a split recurs (e.g. Full body x3, Upper/Lower x2), make distinct variants
(e.g. "Full Body A", "Full Body B", "Full Body C") with different main lifts and accessories.
If the person names a performance objective (e.g. running, explosiveness/jumping, a sport, mobility, posture), design the whole plan
from scratch for that objective — do not take a generic bodybuilding split and append extras. Choose the structure, exercise selection,
order, rep ranges and supersets the way a specialist coach would for that goal (e.g. running: unilateral strength, posterior chain,
calf/soleus, hip stability, trunk; explosiveness: power/plyometric work first while fresh, low-rep heavy strength, then targeted
accessories). Still include sensible aesthetic/hypertrophy work where it fits the goal. Mention the objective in the blurb.
Workout names are short (e.g. "Lower — glutes", "Upper", "Push"). name: short plan name. blurb: one short sentence.
Never give medical advice. Write in the language the person used.`;

type Result = { plans: Template[]; remaining: number; error?: string };

export const generatePlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { about: AboutYou; notes: string }) => ({
    about: input.about,
    notes: String(input.notes ?? "").slice(0, 1500),
  }))
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase, userId } = context;
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan_generations")
      .eq("id", userId)
      .maybeSingle();
    const used = profile?.plan_generations ?? 0;
    const a = data.about;
    await supabase.from("profiles").upsert(
      {
        id: userId,
        age_range: a.age_range,
        sex: a.sex,
        goal: a.goal,
        days_per_week: a.days_per_week,
        session_minutes: a.session_minutes,
        experience: a.experience,
        plan_generations: used + 1,
      },
      { onConflict: "id" },
    );
    if (used >= MAX_GENERATIONS) return { plans: [], remaining: 0, error: "limit" };

    const { generateJson, AiError } = await import("./ai.server");
    const input = `Age: ${a.age_range}. Sex: ${a.sex}. Goal: ${a.goal}. Experience: ${a.experience}.
Split preference: ${a.split || "no preference — you decide"}. Days per week: ${a.days_per_week}. Session length: ${a.session_minutes} min. Units: kg.
In their own words: ${data.notes || "(nothing — just build something great)"}`;
    try {
      type RawPlan = {
        name: string;
        blurb: string;
        workouts: { name: string; exercises: { name: string; target_reps: string; superset_with_next: boolean }[] }[];
      };
      const raw = await generateJson<{ options: RawPlan[] }>(INSTRUCTIONS, input, PLAN_SCHEMA);
      const plans: Template[] = raw.options.slice(0, 2).map((raw, pi) => ({
        id: `ai-${pi}`,
        name: raw.name.slice(0, 60),
        blurb: raw.blurb.slice(0, 140),
        workouts: raw.workouts.slice(0, 6).map((w) => ({
          name: w.name.slice(0, 40),
          exercises: w.exercises.slice(0, 10).map((e, i, arr) => ({
            name: e.name.slice(0, 60),
            target_reps: e.target_reps.slice(0, 12),
            linked_to_next: e.superset_with_next && i < arr.length - 1,
          })),
        })),
      })).filter((p) => p.workouts.length > 0);
      if (plans.length === 0) throw new Error("empty");
      return { plans, remaining: MAX_GENERATIONS - used - 1 };
    } catch (err) {
      const status = err instanceof AiError ? err.status : 500;
      return { plans: [], remaining: MAX_GENERATIONS - used - 1, error: status === 402 || status === 403 ? "unavailable" : "failed" };
    }
  });

export const transcribeVoice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: FormData) => {
    if (!(input instanceof FormData)) throw new Error("Expected form data");
    const file = input.get("file");
    if (!(file instanceof File)) throw new Error("Missing audio");
    return file;
  })
  .handler(async ({ data }) => {
    const { transcribeAudio } = await import("./ai.server");
    try {
      return { text: await transcribeAudio(data) };
    } catch {
      return { text: "", error: "failed" };
    }
  });
