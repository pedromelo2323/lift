# Onboarding — "your plan, built for you"

The aha moment: a new person answers a few quick questions, says or types how they like to train, and a complete plan appears in seconds.

## Flow

```text
Sign up -> About you (1 screen) -> Describe your training (type or speak)
        -> Your plan (preview, edit) -> Home (first-time hints guide the rest)
```

1. **About you** — one calm screen, tap-to-pick chips, no typing:
   - Age range, sex, goal (strength, muscle, toned/lean, general fitness)
   - Days per week (2–6), session length (30 / 45 / 60 / 90 min)
   - Experience (new, some, experienced)
   - Units fixed to kg (still changeable in Settings)
2. **Describe your training** — a single text box with a mic button.
   - Example placeholder: "I like pilates on rest days, want stronger glutes, hate burpees, have dumbbells and a cable machine."
   - Optional: "Skip — just build me something good".
   - Ready plans stay available as a small link for people who don't want AI.
3. **Your plan** — the generated plan shown like today's preview: workouts, exercises, target reps, supersets where sensible.
   - Tap any exercise to rename or remove; "Regenerate" once if they don't like it.
   - "Start with this plan" saves it and lands on Home.
4. **Home** — existing first-time hints take over (open a workout, log a set, edit/pair).

## Keeping AI cost near zero

- One AI call per new account (plus at most 2 regenerations), short output. Roughly a fraction of a cent each.
- Voice is turned into text first, then the same single call — no ongoing chat.
- If AI fails or credits run out, it falls back silently to the closest ready plan based on days per week.
- Uses ChatGPT (OpenAI's latest model, via Lovable — no extra account); usage comes from your workspace credits. Claude remains blocked by workspace privacy settings, so an allowed model is used.

## Data

- The "About you" answers are stored on the person's profile (needed for good plans and future suggestions). Nothing else new.
- Privacy policy gets one line about this.

## Technical notes

- Profile columns: age_range, sex, goal, days_per_week, session_minutes, experience (migration + per-user RLS already on profiles).
- Server function `generatePlan`: authenticated, rate-limited to 3 per user, default model with strict JSON schema output (workouts → exercises → target_reps, superset links). Validated, then inserted through existing account helpers.
- Speech: record in browser, send to server function using the default transcription model, insert text into the box.
- Fallback mapping: 2–3 days → Full Body, 4 → Upper/Lower, 5–6 → Push/Pull/Legs.
