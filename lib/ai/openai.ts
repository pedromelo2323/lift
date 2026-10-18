// Server-only: imported by app/api route handlers, never by client components.
import type { AboutYou, Plan } from "@/lib/onboarding/plan";

const API = "https://api.openai.com/v1";
const PLAN_TIMEOUT_MS = 55_000;
const TRANSCRIBE_TIMEOUT_MS = 30_000;
export const MAX_AUDIO_BYTES = 10 * 1024 * 1024;

export class AiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

function apiKey() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new AiError(503, "AI is not configured");
  return key;
}

export function isAiConfigured() {
  return Boolean(process.env.OPENAI_API_KEY);
}

const INSTRUCTIONS = `You are an expert strength coach designing gym plans for a minimalist workout log app.
Return exactly TWO genuinely different plan options. If the person has no split preference, use two different splits that both
suit their days per week (e.g. 3 days: Push/Pull/Legs vs Full body x3; 4 days: Upper/Lower vs Push/Pull/Legs + Full body).
If they chose a split, both options use it but differ in emphasis or exercise selection. Each option has exactly as many workouts as the person's days per week (max 6). Fit each workout in their session length
(about 4 exercises for 30 min, 5 for 45, 6 for 60, 7 for 90). Use common exercise names (e.g. "Hip thrust", "Lat pulldown"); a name is only the exercise, never notes or caveats.
sets is the number of working sets, usually 3, 4 for main lifts, 2 for small accessories when time is short.
target_reps is a short range like "8–10" or "12–15" (use "45s" for timed holds). Use superset_with_next=true only to pair two
compatible accessory moves; never on the last exercise of a workout. Respect preferences, dislikes, injuries and equipment.
Never repeat an identical workout within a week: when a split recurs (e.g. Full body x3, Upper/Lower x2), make distinct variants
(e.g. "Full Body A", "Full Body B", "Full Body C") with different main lifts and accessories.
If the person names a performance objective (e.g. running, explosiveness/jumping, a sport, mobility, posture), design the whole plan
from scratch for that objective — do not take a generic bodybuilding split and append extras. Choose the structure, exercise selection,
order, rep ranges and supersets the way a specialist coach would for that goal (e.g. running: unilateral strength, posterior chain,
calf/soleus, hip stability, trunk; explosiveness: power/plyometric work first while fresh, low-rep heavy strength, then targeted
accessories). Still include sensible aesthetic/hypertrophy work where it fits the goal. Mention the objective in the blurb.
Workout names are short (e.g. "Lower — glutes", "Upper", "Push"). name: short plan name. blurb: one short sentence, under 20 words.
Never give medical advice. Write in the language the person used.`;

const EXERCISE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["name", "sets", "target_reps", "superset_with_next"],
  properties: {
    name: { type: "string" },
    sets: { type: "integer" },
    target_reps: { type: "string" },
    superset_with_next: { type: "boolean" },
  },
};

const PLAN_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["options"],
  properties: {
    options: {
      type: "array",
      items: {
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
                exercises: { type: "array", items: EXERCISE_SCHEMA },
              },
            },
          },
        },
      },
    },
  },
};

type RawPlan = {
  name: string;
  blurb: string;
  workouts: {
    name: string;
    exercises: { name: string; sets: number; target_reps: string; superset_with_next: boolean }[];
  }[];
};

type ResponsesOutput = {
  output?: { type: string; content?: { type: string; text?: string }[] }[];
};

function outputText(body: ResponsesOutput) {
  for (const item of body.output ?? []) {
    if (item.type !== "message") continue;
    for (const part of item.content ?? []) {
      if (part.type === "output_text" && part.text) return part.text;
    }
  }
  throw new AiError(502, "Empty AI response");
}

function clampSets(sets: number) {
  return Number.isFinite(sets) ? Math.min(6, Math.max(1, Math.round(sets))) : 3;
}

export async function generatePlans(about: AboutYou, notes: string): Promise<Plan[]> {
  const input = `Age: ${about.age_range}. Sex: ${about.sex}. Goal: ${about.goal}. Experience: ${about.experience}.
Split preference: ${about.split || "no preference — you decide"}. Days per week: ${about.days_per_week}. Session length: ${about.session_minutes} min. Units: kg.
In their own words: ${notes || "(nothing — just build something great)"}`;

  const reasoning = process.env.OPENAI_PLAN_REASONING ?? "none";
  const res = await fetch(`${API}/responses`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey()}` },
    body: JSON.stringify({
      model: process.env.OPENAI_PLAN_MODEL ?? "gpt-6-luna",
      instructions: INSTRUCTIONS,
      input,
      store: false,
      ...(reasoning === "none" ? {} : { reasoning: { effort: reasoning } }),
      text: { format: { type: "json_schema", name: "plan", strict: true, schema: PLAN_SCHEMA } },
    }),
    signal: AbortSignal.timeout(PLAN_TIMEOUT_MS),
  });

  if (!res.ok) {
    console.error("AI plan error", res.status, (await res.text()).slice(0, 500));
    throw new AiError(res.status, "AI request failed");
  }

  const raw = JSON.parse(outputText((await res.json()) as ResponsesOutput)) as { options: RawPlan[] };

  return raw.options
    .slice(0, 2)
    .map((plan, planIndex) => ({
      id: `ai-${planIndex}`,
      name: plan.name.slice(0, 60),
      blurb: plan.blurb.slice(0, 140),
      workouts: plan.workouts.slice(0, 6).map((workout) => ({
        name: workout.name.slice(0, 40),
        exercises: workout.exercises.slice(0, 10).map((exercise, i, all) => ({
          name: exercise.name.slice(0, 60),
          sets_reps: `${clampSets(exercise.sets)}×${exercise.target_reps.slice(0, 12)}`,
          linked_to_next: exercise.superset_with_next && i < all.length - 1,
        })),
      })),
    }))
    .filter((plan) => plan.workouts.length > 0);
}

export async function transcribe(file: File): Promise<string> {
  if (!file.size || file.size > MAX_AUDIO_BYTES) throw new AiError(400, "Recording too long");

  const form = new FormData();
  form.append("model", process.env.OPENAI_TRANSCRIBE_MODEL ?? "gpt-4o-mini-transcribe");
  form.append("file", file, file.name);
  form.append("response_format", "json");

  const res = await fetch(`${API}/audio/transcriptions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey()}` },
    body: form,
    signal: AbortSignal.timeout(TRANSCRIBE_TIMEOUT_MS),
  });

  if (!res.ok) {
    console.error("Transcribe error", res.status, (await res.text()).slice(0, 500));
    throw new AiError(res.status, "Transcription failed");
  }

  const body = (await res.json()) as { text?: string };
  return (body.text ?? "").trim();
}
