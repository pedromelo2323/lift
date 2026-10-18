"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BackIcon, CloseIcon, MicIcon, PlusIcon, StopIcon } from "@/components/onboarding/icons";
import { PlanPreview } from "@/components/onboarding/PlanPreview";
import { useProfile } from "@/hooks/use-workouts";
import { useVoiceNotes } from "@/hooks/use-voice-notes";
import { firstName, profileKey } from "@/lib/api/profile";
import { workoutsKey } from "@/lib/api/workouts";
import {
  AGE_RANGES,
  DAYS,
  EXPERIENCE,
  GOALS,
  PLAN_LIMIT,
  SESSION_MINUTES,
  SEXES,
  SPLITS,
  TEMPLATES,
  fallbackPlans,
  toCreatePlanInput,
  type AboutYou,
  type Plan,
  type PlanResponse,
  type PlanWorkout,
} from "@/lib/onboarding/plan";
import { createClient } from "@/lib/supabase/client";

type Step =
  | { kind: "about" }
  | { kind: "describe" }
  | { kind: "building" }
  | { kind: "plan"; options: Plan[]; ai: boolean; note?: string | undefined }
  | { kind: "choose" }
  | { kind: "custom" };

const primaryButton =
  "mt-10 w-full rounded-xl bg-foreground py-3 text-[15px] font-medium text-background transition-opacity disabled:opacity-30";

export function Onboarding() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();
  const [step, setStep] = useState<Step>({ kind: "about" });
  const [name, setName] = useState<string | null>(null);
  const [about, setAbout] = useState<Partial<AboutYou>>({});
  const [notes, setNotes] = useState("");
  const [remaining, setRemaining] = useState(PLAN_LIMIT);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const saving = useRef(false);

  const savedName = firstName(profile?.displayName) ?? "";

  useEffect(() => {
    void (async () => {
      const { data } = await createClient().from("plan_usage").select("plan_generations").maybeSingle();
      if (data) setRemaining(Math.max(0, PLAN_LIMIT - data.plan_generations));
    })();
  }, []);

  async function saveName() {
    const next = (name ?? savedName).trim();
    if (!next || next === savedName || !profile) return;
    await createClient().from("profiles").update({ display_name: next }).eq("id", profile.id);
    void queryClient.invalidateQueries({ queryKey: profileKey });
  }

  async function save(workouts: PlanWorkout[]) {
    if (saving.current) return;
    saving.current = true;
    setBusy(true);
    setError(null);
    try {
      const { error: rpcError } = await createClient().rpc("create_plan", { plan: toCreatePlanInput(workouts) });
      if (rpcError) throw rpcError;
      // Refetch now so Home never sees the old empty list and sends the user back here.
      await queryClient.refetchQueries({ queryKey: workoutsKey, type: "all" });
      router.replace("/");
    } catch {
      setError("Something went wrong. Try again.");
      saving.current = false;
      setBusy(false);
    }
  }

  async function build() {
    const answers = about as AboutYou;
    const fallback = (note: string) =>
      setStep({ kind: "plan", options: fallbackPlans(answers.days_per_week), ai: false, note });

    setStep({ kind: "building" });
    try {
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ about: answers, notes }),
      });
      const body = (await res.json()) as PlanResponse;
      setRemaining(body.remaining ?? 0);
      if (body.plans?.length) setStep({ kind: "plan", options: body.plans, ai: true });
      else if (body.error === "limit") fallback("You've used your plan builds — here's a great starting point.");
      else fallback("Couldn't build a custom plan right now — here's a great starting point.");
    } catch {
      fallback("Couldn't build a custom plan right now — here's a great starting point.");
    }
  }

  function back() {
    if (step.kind === "plan" && step.ai) setStep({ kind: "describe" });
    else setStep({ kind: "about" });
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-md px-6 pb-16 pt-16">
      {step.kind !== "about" && step.kind !== "building" ? (
        <button type="button" onClick={back} aria-label="Back" className="-ml-1 mb-6 p-1 text-muted-foreground">
          <BackIcon size={20} />
        </button>
      ) : null}

      <div key={step.kind} className="step-in">
        {step.kind === "about" ? (
          <About
            name={name ?? savedName}
            onName={setName}
            value={about}
            onChange={setAbout}
            onNext={() => {
              void saveName();
              setStep({ kind: "describe" });
            }}
            onReady={() => setStep({ kind: "choose" })}
            onCustom={() => setStep({ kind: "custom" })}
          />
        ) : step.kind === "describe" ? (
          <Describe notes={notes} onNotes={setNotes} onBuild={build} />
        ) : step.kind === "building" ? (
          <Building />
        ) : step.kind === "plan" ? (
          <PlanPreview
            key={step.options.map((o) => o.name).join("|")}
            options={step.options}
            note={step.note}
            busy={busy}
            canRegenerate={step.ai && remaining > 0}
            onRegenerate={build}
            onConfirm={(plan) => save(plan.workouts)}
          />
        ) : step.kind === "choose" ? (
          <Choose
            onPick={(plan) => setStep({ kind: "plan", options: [plan], ai: false })}
            onCustom={() => setStep({ kind: "custom" })}
          />
        ) : (
          <Custom busy={busy} onConfirm={(names) => save(names.map((n) => ({ name: n, exercises: [] })))} />
        )}
        {error ? <p className="mt-4 text-[13px] text-muted-foreground">{error}</p> : null}
      </div>
    </main>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-7 text-[11px] font-light uppercase tracking-[0.14em] text-muted-foreground/70">{children}</p>
  );
}

function Chips<T extends string | number>({
  options,
  value,
  onPick,
  format,
}: {
  options: readonly T[];
  value: T | undefined;
  onPick: (value: T) => void;
  format?: (value: T) => string;
}) {
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={String(option)}
          type="button"
          onClick={() => onPick(option)}
          className={`rounded-full border px-3.5 py-1.5 text-[15px] transition-colors duration-150 ${
            value === option ? "border-foreground bg-foreground text-background" : "border-border text-foreground"
          }`}
        >
          {format ? format(option) : String(option)}
        </button>
      ))}
    </div>
  );
}

function About({
  name,
  onName,
  value,
  onChange,
  onNext,
  onReady,
  onCustom,
}: {
  name: string;
  onName: (value: string) => void;
  value: Partial<AboutYou>;
  onChange: (value: Partial<AboutYou>) => void;
  onNext: () => void;
  onReady: () => void;
  onCustom: () => void;
}) {
  const set =
    <K extends keyof AboutYou>(key: K) =>
    (v: NonNullable<AboutYou[K]>) =>
      onChange({ ...value, [key]: v });
  const done =
    name.trim() &&
    value.age_range &&
    value.sex &&
    value.goal &&
    value.days_per_week &&
    value.session_minutes &&
    value.experience;

  return (
    <>
      <div className="mb-6 flex items-center justify-end gap-4 text-[13px] text-muted-foreground">
        <button type="button" onClick={onReady} className="active:text-foreground">
          Ready plans
        </button>
        <span className="h-3 w-px bg-border" />
        <button type="button" onClick={onCustom} className="active:text-foreground">
          Build my own
        </button>
      </div>
      <h1 className="text-[32px] font-semibold leading-tight tracking-tight">Let&apos;s build your plan</h1>
      <p className="mt-1 text-[17px] text-muted-foreground">A few taps. Takes ten seconds.</p>

      <Label>Your name</Label>
      <input
        value={name}
        onChange={(e) => onName(e.target.value)}
        placeholder="First name"
        autoComplete="given-name"
        className="mt-2 w-full border-b border-border bg-transparent py-2 text-[17px] outline-none placeholder:text-muted-foreground/50 focus:border-foreground"
      />
      <Label>Goal</Label>
      <Chips options={GOALS} value={value.goal} onPick={set("goal")} />
      <Label>Days per week</Label>
      <Chips options={DAYS} value={value.days_per_week} onPick={set("days_per_week")} />
      <Label>Preferred split · optional</Label>
      <Chips
        options={SPLITS}
        value={value.split}
        onPick={(v) => onChange({ ...value, split: value.split === v ? undefined : v })}
      />
      <Label>Session length</Label>
      <Chips
        options={SESSION_MINUTES}
        value={value.session_minutes}
        onPick={set("session_minutes")}
        format={(m) => `${m} min`}
      />
      <Label>Experience</Label>
      <Chips options={EXPERIENCE} value={value.experience} onPick={set("experience")} />
      <Label>Sex</Label>
      <Chips options={SEXES} value={value.sex} onPick={set("sex")} />
      <Label>Age</Label>
      <Chips options={AGE_RANGES} value={value.age_range} onPick={set("age_range")} />

      <button type="button" disabled={!done} onClick={onNext} className={primaryButton}>
        Continue
      </button>
    </>
  );
}

function Describe({
  notes,
  onNotes,
  onBuild,
}: {
  notes: string;
  onNotes: React.Dispatch<React.SetStateAction<string>>;
  onBuild: () => void;
}) {
  const voice = useVoiceNotes((text) => onNotes((current) => (current.trim() ? `${current.trim()} ${text}` : text)));

  return (
    <>
      <h1 className="text-[32px] font-semibold leading-tight tracking-tight">How do you like to train?</h1>
      <p className="mt-1 text-[17px] text-muted-foreground">Type or say it. Anything helps.</p>

      <div className="mt-8 rounded-2xl border border-border p-4">
        <textarea
          value={notes}
          onChange={(e) => onNotes(e.target.value)}
          rows={6}
          maxLength={1500}
          placeholder="I want stronger glutes, I do pilates on rest days, no burpees, and I have dumbbells and cables."
          className="w-full resize-none bg-transparent text-[17px] leading-relaxed outline-none placeholder:text-muted-foreground/50"
        />
        <div className="flex items-center justify-between gap-3 pt-2">
          <span className="text-[13px] text-muted-foreground" role="status">
            {voice.recording ? "Listening… tap to stop" : voice.transcribing ? "Writing it down…" : voice.error ?? ""}
          </span>
          <button
            type="button"
            aria-label={voice.recording ? "Stop recording" : "Speak"}
            disabled={voice.transcribing}
            onClick={voice.recording ? voice.stop : voice.start}
            className={`flex size-11 shrink-0 items-center justify-center rounded-full border transition-colors disabled:opacity-40 ${
              voice.recording ? "animate-pulse border-foreground bg-foreground text-background" : "border-border text-foreground"
            }`}
          >
            {voice.recording ? <StopIcon size={16} /> : <MicIcon size={20} />}
          </button>
        </div>
      </div>

      <button
        type="button"
        disabled={voice.recording || voice.transcribing}
        onClick={onBuild}
        className={primaryButton}
      >
        {notes.trim() ? "Build my plan" : "Skip — just build me something good"}
      </button>
    </>
  );
}

function Building() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="h-px w-24 overflow-hidden bg-border">
        <div className="building-bar h-px w-1/3 bg-foreground" />
      </div>
      <p className="mt-6 text-[19px] tracking-tight">Building your plan</p>
      <p className="mt-1 text-[13px] text-muted-foreground">Picking exercises, sets and reps for you. Takes about half a minute.</p>
    </div>
  );
}

function Choose({ onPick, onCustom }: { onPick: (plan: Plan) => void; onCustom: () => void }) {
  return (
    <>
      <h1 className="text-[32px] font-semibold leading-tight tracking-tight">Ready plans</h1>
      <p className="mt-1 text-[17px] text-muted-foreground">Start from a plan, or make your own.</p>
      <div className="mt-8">
        {TEMPLATES.map((plan) => (
          <button
            key={plan.id}
            type="button"
            onClick={() => onPick(plan)}
            className="flex w-full items-baseline justify-between border-b border-border py-4 text-left transition-colors active:bg-secondary"
          >
            <span>
              <span className="block text-[19px] tracking-tight">{plan.name}</span>
              <span className="block text-[13px] text-muted-foreground">{plan.blurb}</span>
            </span>
            <span className="text-[13px] text-muted-foreground">
              {plan.workouts.length} {plan.workouts.length === 1 ? "workout" : "workouts"}
            </span>
          </button>
        ))}
        <button
          type="button"
          onClick={onCustom}
          className="flex w-full items-baseline border-b border-border py-4 text-left transition-colors active:bg-secondary"
        >
          <span>
            <span className="block text-[19px] tracking-tight">Build your own plan</span>
            <span className="block text-[13px] text-muted-foreground">Name your workouts, add exercises after.</span>
          </span>
        </button>
      </div>
    </>
  );
}

function Custom({ busy, onConfirm }: { busy: boolean; onConfirm: (names: string[]) => void }) {
  const [names, setNames] = useState<string[]>(["Workout A", "Workout B"]);
  const clean = names.map((n) => n.trim()).filter(Boolean);

  return (
    <>
      <h1 className="text-[32px] font-semibold leading-tight tracking-tight">Your plan</h1>
      <p className="mt-1 text-[17px] text-muted-foreground">Name each workout. Add exercises inside.</p>
      <div className="mt-8">
        {names.map((name, i) => (
          <div key={i} className="flex items-center border-b border-border">
            <input
              value={name}
              maxLength={40}
              onChange={(e) => setNames((prev) => prev.map((n, j) => (j === i ? e.target.value : n)))}
              placeholder={`Workout ${i + 1}`}
              className="flex-1 bg-transparent py-4 text-[19px] tracking-tight outline-none"
            />
            {names.length > 1 ? (
              <button
                type="button"
                aria-label="Remove workout"
                onClick={() => setNames((prev) => prev.filter((_, j) => j !== i))}
                className="p-2 text-muted-foreground/60"
              >
                <CloseIcon size={16} />
              </button>
            ) : null}
          </div>
        ))}
        {names.length < 7 ? (
          <button
            type="button"
            onClick={() => setNames((prev) => [...prev, ""])}
            className="mt-3 flex items-center gap-1.5 text-[15px] text-muted-foreground"
          >
            <PlusIcon size={16} /> Add workout
          </button>
        ) : null}
      </div>
      <button
        type="button"
        disabled={busy || clean.length === 0}
        onClick={() => onConfirm(clean)}
        className={primaryButton}
      >
        {busy ? "Setting up…" : "Create plan"}
      </button>
    </>
  );
}
