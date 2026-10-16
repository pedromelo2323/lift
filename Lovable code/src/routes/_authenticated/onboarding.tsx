import { useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Mic, Plus, Square, X } from "lucide-react";
import { TEMPLATES, type Template } from "@/lib/lift/templates";
import { applyTemplate, createCustomWorkouts, fallbackTemplateId, fetchProfile, updateDisplayName } from "@/lib/lift/account";
import { generatePlan, transcribeVoice, type AboutYou } from "@/lib/lift/plan.functions";
import { workoutsKey } from "@/hooks/use-lift";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [
      { title: "Build your plan — Lift" },
      { name: "description", content: "Tell Lift how you train and get a plan built for you in seconds." },
      { property: "og:title", content: "Build your plan — Lift" },
      { property: "og:description", content: "Tell Lift how you train and get a plan built for you in seconds." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Onboarding,
});

type Step =
  | { kind: "about" }
  | { kind: "describe" }
  | { kind: "building" }
  | { kind: "plan"; options: Template[]; ai: boolean; note?: string | undefined }
  | { kind: "choose" }
  | { kind: "custom" };

const EMPTY: Partial<AboutYou> = {};

function Onboarding() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const generate = useServerFn(generatePlan);
  const [step, setStep] = useState<Step>({ kind: "about" });
  const [about, setAbout] = useState<Partial<AboutYou>>(EMPTY);
  const [notes, setNotes] = useState("");
  const [remaining, setRemaining] = useState(3);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lock = useRef(false);
  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: fetchProfile });
  const [name, setName] = useState<string | null>(null);
  const saveName = () => {
    const clean = name?.trim();
    if (!clean || clean === profile?.display_name) return;
    updateDisplayName(clean)
      .then(() => queryClient.invalidateQueries({ queryKey: ["profile"] }))
      .catch(() => {});
  };

  const save = async (fn: () => Promise<void>) => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError(null);
    try {
      await fn();
      // Refetch now (not just mark stale) so Home never sees the old empty list and bounces back here.
      await queryClient.refetchQueries({ queryKey: workoutsKey, type: "all" });
      navigate({ to: "/home", replace: true });
    } catch {
      setError("Something went wrong. Try again.");
      lock.current = false;
      setBusy(false);
    }
  };

  const build = async () => {
    const a = about as AboutYou;
    setStep({ kind: "building" });
    const fallback = () => {
      const first = TEMPLATES.find((t) => t.id === fallbackTemplateId(a.days_per_week)) ?? TEMPLATES[0]!;
      const second = TEMPLATES.find((t) => t.id !== first.id && t.id !== "full-body") ?? TEMPLATES.find((t) => t.id !== first.id)!;
      return [first, second];
    };
    try {
      const res = await generate({ data: { about: a, notes } });
      setRemaining(res.remaining);
      if (res.plans.length) setStep({ kind: "plan", options: res.plans, ai: true });
      else
        setStep({
          kind: "plan",
          options: fallback(),
          ai: false,
          note: res.error === "limit" ? "You've used your plan builds — here's a great starting point." : "Couldn't build a custom plan right now — here's a great starting point.",
        });
    } catch {
      setStep({ kind: "plan", options: fallback(), ai: false, note: "Couldn't build a custom plan right now — here's a great starting point." });
    }
  };

  const back = () => {
    if (step.kind === "describe") setStep({ kind: "about" });
    else if (step.kind === "plan") setStep(step.ai ? { kind: "describe" } : { kind: "about" });
    else if (step.kind === "custom") setStep({ kind: "about" });
    else setStep({ kind: "about" });
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-md px-6 pb-16 pt-16">
      {step.kind !== "about" && step.kind !== "building" ? (
        <button type="button" onClick={back} aria-label="Back" className="-ml-1 mb-6 p-1 text-muted-foreground">
          <ArrowLeft className="size-5" />
        </button>
      ) : null}

      <div key={step.kind} className="animate-in fade-in slide-in-from-bottom-1 duration-300">
        {step.kind === "about" ? (
          <About
            name={name ?? profile?.display_name ?? ""}
            onName={setName}
            value={about}
            onChange={setAbout}
            onNext={() => {
              saveName();
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
            onConfirm={(t) => save(() => applyTemplate(t))}
          />
        ) : step.kind === "choose" ? (
          <Choose onPick={(t) => setStep({ kind: "plan", options: [t], ai: false })} onCustom={() => setStep({ kind: "custom" })} />
        ) : (
          <Custom busy={busy} onConfirm={(names) => save(() => createCustomWorkouts(names))} />
        )}
        {error ? <p className="mt-4 text-[13px] text-muted-foreground">{error}</p> : null}
      </div>
    </main>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="mt-7 text-[11px] font-light uppercase tracking-[0.14em] text-muted-foreground/70">{children}</p>;
}

function Chips<T extends string | number>({ options, value, onPick, format }: { options: T[]; value: T | undefined; onPick: (v: T) => void; format?: (v: T) => string }) {
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={String(o)}
          type="button"
          onClick={() => onPick(o)}
          className={cn(
            "rounded-full border px-3.5 py-1.5 text-[15px] transition-colors duration-150",
            value === o ? "border-foreground bg-foreground text-background" : "border-border text-foreground",
          )}
        >
          {format ? format(o) : String(o)}
        </button>
      ))}
    </div>
  );
}

function About({ name, onName, value, onChange, onNext, onReady, onCustom }: { name: string; onName: (v: string) => void; value: Partial<AboutYou>; onChange: (v: Partial<AboutYou>) => void; onNext: () => void; onReady: () => void; onCustom: () => void }) {
  const set = <K extends keyof AboutYou>(k: K) => (v: AboutYou[K]) => onChange({ ...value, [k]: v });
  const done = name.trim() && value.age_range && value.sex && value.goal && value.days_per_week && value.session_minutes && value.experience;
  return (
    <>
      <div className="mb-6 flex items-center justify-end gap-4 text-[13px] text-muted-foreground">
        <button type="button" onClick={onReady} className="underline-offset-4 hover:text-foreground hover:underline">
          Ready plans
        </button>
        <span className="h-3 w-px bg-border" />
        <button type="button" onClick={onCustom} className="underline-offset-4 hover:text-foreground hover:underline">
          Build my own
        </button>
      </div>
      <h1 className="text-[32px] font-semibold leading-tight tracking-tight">Let's build your plan</h1>
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
      <Chips options={["Get stronger", "Build muscle", "Tone & lean", "General fitness"]} value={value.goal} onPick={set("goal")} />
      <Label>Days per week</Label>
      <Chips options={[2, 3, 4, 5, 6]} value={value.days_per_week} onPick={set("days_per_week")} />
      <Label>Preferred split · optional</Label>
      <Chips
        options={["Push / Pull / Legs", "Upper / Lower", "Full body"]}
        value={value.split}
        onPick={(v) => onChange({ ...value, split: value.split === v ? undefined : v })}
      />
      <Label>Session length</Label>
      <Chips options={[30, 45, 60, 90]} value={value.session_minutes} onPick={set("session_minutes")} format={(m) => `${m} min`} />
      <Label>Experience</Label>
      <Chips options={["New", "Some", "Experienced"]} value={value.experience} onPick={set("experience")} />
      <Label>Sex</Label>
      <Chips options={["Female", "Male", "Other"]} value={value.sex} onPick={set("sex")} />
      <Label>Age</Label>
      <Chips options={["Under 25", "25–34", "35–44", "45–54", "55+"]} value={value.age_range} onPick={set("age_range")} />

      <button
        type="button"
        disabled={!done}
        onClick={onNext}
        className="mt-10 w-full rounded-xl bg-primary py-3 text-[15px] font-medium text-primary-foreground transition-opacity disabled:opacity-30"
      >
        Continue
      </button>
    </>
  );
}

function Describe({ notes, onNotes, onBuild }: { notes: string; onNotes: (v: string) => void; onBuild: () => void }) {
  const transcribe = useServerFn(transcribeVoice);
  const [recording, setRecording] = useState(false);
  const [listening, setListening] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);

  const start = async () => {
    setMicError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = ["audio/webm", "audio/mp4"].find((m) => MediaRecorder.isTypeSupported(m)) ?? "";
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      const chunks: Blob[] = [];
      rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const type = (rec.mimeType || "audio/webm").split(";")[0]!.replace("video/", "audio/");
        const ext = type.includes("mp4") ? "m4a" : "webm";
        const form = new FormData();
        form.append("file", new File([new Blob(chunks, { type })], `voice.${ext}`, { type }));
        setListening(true);
        try {
          const res = await transcribe({ data: form });
          if (res.text) onNotes(notes ? `${notes} ${res.text}` : res.text);
          else setMicError("Didn't catch that. Try again or type it.");
        } catch {
          setMicError("Didn't catch that. Try again or type it.");
        }
        setListening(false);
      };
      rec.start();
      recorder.current = rec;
      setRecording(true);
      setTimeout(() => recorder.current?.state === "recording" && recorder.current.stop(), 60_000);
    } catch {
      setMicError("Microphone not available. You can type instead.");
    }
  };
  const stop = () => {
    recorder.current?.stop();
    setRecording(false);
  };

  return (
    <>
      <h1 className="text-[32px] font-semibold leading-tight tracking-tight">How do you like to train?</h1>
      <p className="mt-1 text-[17px] text-muted-foreground">Type or say it. Anything helps.</p>

      <div className="mt-8 rounded-2xl border border-border p-4">
        <textarea
          value={notes}
          onChange={(e) => onNotes(e.target.value)}
          rows={6}
          placeholder="I want stronger glutes, I do pilates on rest days, no burpees, and I have dumbbells and cables."
          className="w-full resize-none bg-transparent text-[17px] leading-relaxed outline-none placeholder:text-muted-foreground/50"
        />
        <div className="flex items-center justify-between pt-2">
          <span className="text-[13px] text-muted-foreground">
            {recording ? "Listening… tap to stop" : listening ? "Writing it down…" : micError ?? ""}
          </span>
          <button
            type="button"
            aria-label={recording ? "Stop recording" : "Speak"}
            disabled={listening}
            onClick={recording ? stop : start}
            className={cn(
              "flex size-11 items-center justify-center rounded-full border transition-colors",
              recording ? "animate-pulse border-foreground bg-foreground text-background" : "border-border text-foreground",
            )}
          >
            {recording ? <Square className="size-4" /> : <Mic className="size-5" />}
          </button>
        </div>
      </div>

      <button
        type="button"
        disabled={recording || listening}
        onClick={onBuild}
        className="mt-10 w-full rounded-xl bg-primary py-3 text-[15px] font-medium text-primary-foreground disabled:opacity-30"
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
        <div className="h-px w-1/3 animate-[lift-slide_1.2s_ease-in-out_infinite] bg-foreground" />
      </div>
      <p className="mt-6 text-[19px] tracking-tight">Building your plan</p>
      <p className="mt-1 text-[13px] text-muted-foreground">Picking exercises, sets and reps for you.</p>
      <style>{`@keyframes lift-slide{0%{transform:translateX(-100%)}100%{transform:translateX(300%)}}`}</style>
    </div>
  );
}

type Plan = Template;
type Ex = Plan["workouts"][number]["exercises"];

function PlanPreview({
  options,
  note,
  busy,
  canRegenerate,
  onRegenerate,
  onConfirm,
}: {
  options: Plan[];
  note?: string | undefined;
  busy: boolean;
  canRegenerate: boolean;
  onRegenerate: () => void;
  onConfirm: (t: Plan) => void;
}) {
  const [plans, setPlans] = useState(options);
  const [active, setActive] = useState(0);
  const scroller = useRef<HTMLDivElement>(null);
  const update = (pi: number, wi: number, fn: (ex: Ex) => Ex) =>
    setPlans((all) =>
      all.map((p, i) => (i !== pi ? p : { ...p, workouts: p.workouts.map((w, j) => (j === wi ? { ...w, exercises: fn(w.exercises) } : w)) })),
    );
  const goTo = (i: number) => scroller.current?.scrollTo({ left: i * scroller.current.clientWidth, behavior: "smooth" });
  const multi = plans.length > 1;

  return (
    <>
      {note ? <p className="mb-4 text-[13px] text-muted-foreground">{note}</p> : null}
      <h1 className="text-[32px] font-semibold leading-tight tracking-tight">{multi ? "Pick your plan" : plans[0]?.name}</h1>
      <p className="mt-1 text-[17px] text-muted-foreground">
        {multi ? "Swipe to compare. Everything stays editable." : `${plans[0]?.blurb ?? ""} Tap a name to rename.`}
      </p>

      {multi ? (
        <div className="mt-6 flex items-center gap-2">
          {plans.map((p, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              className={cn(
                "rounded-full border px-3 py-1 text-[13px] transition-colors",
                active === i ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground",
              )}
            >
              Option {i + 1}
            </button>
          ))}
        </div>
      ) : null}

      <div
        ref={scroller}
        onScroll={(e) => {
          const el = e.currentTarget;
          setActive(Math.round(el.scrollLeft / Math.max(1, el.clientWidth)));
        }}
        className="-mx-6 mt-4 flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {plans.map((plan, pi) => (
          <div key={pi} className="w-full shrink-0 snap-center px-6">
            {multi ? (
              <div className="mb-6">
                <p className="text-[22px] font-medium tracking-tight">{plan.name}</p>
                <p className="text-[13px] text-muted-foreground">{plan.blurb}</p>
              </div>
            ) : null}
            <div className="space-y-8">
              {plan.workouts.map((w, wi) => (
                <section key={wi}>
                  <h2 className="text-[19px] font-medium tracking-tight">{w.name}</h2>
                  <ul className="mt-2">
                    {w.exercises.map((e, ei) => {
                      const inSuperset = e.linked_to_next || w.exercises[ei - 1]?.linked_to_next;
                      return (
                        <li key={ei} className={cn("flex items-center gap-2 border-b border-border py-1.5 text-[15px]", inSuperset && "border-l border-l-foreground pl-3")}>
                          <input
                            value={e.name}
                            onChange={(ev) => update(pi, wi, (ex) => ex.map((x, j) => (j === ei ? { ...x, name: ev.target.value } : x)))}
                            className="min-w-0 flex-1 bg-transparent py-1 outline-none"
                          />
                          {e.target_reps ? <span className="text-[13px] text-muted-foreground">{e.target_reps}</span> : null}
                          <button
                            type="button"
                            aria-label={`Remove ${e.name}`}
                            onClick={() =>
                              update(pi, wi, (ex) =>
                                ex.filter((_, j) => j !== ei).map((x, j, arr) => (j === arr.length - 1 ? { ...x, linked_to_next: false } : x)),
                              )
                            }
                            className="p-1 text-muted-foreground/50"
                          >
                            <X className="size-3.5" />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))}
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                onConfirm({
                  ...plan,
                  workouts: plan.workouts.map((w) => ({ ...w, exercises: w.exercises.filter((e) => e.name.trim()) })),
                })
              }
              className="mt-10 w-full rounded-xl bg-primary py-3 text-[15px] font-medium text-primary-foreground disabled:opacity-40"
            >
              {busy ? "Setting up…" : multi ? "Go with this" : "Start with this plan"}
            </button>
          </div>
        ))}
      </div>

      {canRegenerate ? (
        <button type="button" disabled={busy} onClick={onRegenerate} className="mt-4 w-full text-center text-[13px] text-muted-foreground underline underline-offset-4">
          Show me two other options
        </button>
      ) : null}
    </>
  );
}

function Choose({ onPick, onCustom }: { onPick: (t: Template) => void; onCustom: () => void }) {
  return (
    <>
      <h1 className="text-[32px] font-semibold leading-tight tracking-tight">Ready plans</h1>
      <p className="mt-1 text-[17px] text-muted-foreground">Start from a plan, or make your own.</p>
      <div className="mt-8">
        {TEMPLATES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onPick(t)}
            className="flex w-full items-baseline justify-between border-b border-border py-4 text-left transition-colors active:bg-secondary"
          >
            <span>
              <span className="block text-[19px] tracking-tight">{t.name}</span>
              <span className="block text-[13px] text-muted-foreground">{t.blurb}</span>
            </span>
            <span className="text-[13px] text-muted-foreground">
              {t.workouts.length} {t.workouts.length === 1 ? "workout" : "workouts"}
            </span>
          </button>
        ))}
        <button type="button" onClick={onCustom} className="flex w-full items-baseline border-b border-border py-4 text-left transition-colors active:bg-secondary">
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
              onChange={(e) => setNames((prev) => prev.map((n, j) => (j === i ? e.target.value : n)))}
              placeholder={`Workout ${i + 1}`}
              className="flex-1 bg-transparent py-4 text-[19px] tracking-tight outline-none"
            />
            {names.length > 1 ? (
              <button type="button" aria-label="Remove workout" onClick={() => setNames((prev) => prev.filter((_, j) => j !== i))} className="p-2 text-muted-foreground/60">
                <X className="size-4" />
              </button>
            ) : null}
          </div>
        ))}
        {names.length < 7 ? (
          <button type="button" onClick={() => setNames((prev) => [...prev, ""])} className="mt-3 flex items-center gap-1.5 text-[15px] text-muted-foreground">
            <Plus className="size-4" /> Add workout
          </button>
        ) : null}
      </div>
      <button
        type="button"
        disabled={busy || clean.length === 0}
        onClick={() => onConfirm(clean)}
        className="mt-10 w-full rounded-xl bg-primary py-3 text-[15px] font-medium text-primary-foreground disabled:opacity-40"
      >
        {busy ? "Setting up…" : "Create plan"}
      </button>
    </>
  );
}
