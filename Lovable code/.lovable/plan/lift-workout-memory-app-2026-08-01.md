# Lift — workout memory app

Apple Notes for progressive overload. Three screens, no dashboards, no motivation, no clutter.

## Screens

**Home** — "Hey Pedro" / "What are we training today?" plus a plain list of workout cards showing name and last completed date. Nothing else.

**Workout** — back arrow + workout name, then the exercise list. Rows expand and collapse in place. Add, rename, delete, reorder exercises.

**Exercise (expanded, inline)** — the comparison table:

```text
Date      Set 1    Set 2    Set 3
Jul 12    22x10    22x10    24x6
Jul 19    22x10    22x10    24x7
Today     22x10    22x11    24x7
```

Last three sessions above, Today's row pre-filled from the most recent session. Every cell tap-to-edit, auto-saved, no Save button. Optional one-line note below the table, hidden when empty.

## Behaviour

- Auto-save on every edit (debounced), no confirmation dialogs.
- Today's row is created lazily the first time you touch a value.
- History starts empty; the table fills as you log.
- Mobile-first, one-handed, whole table fits one iPhone screen.
- Animations 150–250ms, restrained.

## Design

Calm and typographic: system font stack, generous whitespace, hairline separators, near-monochrome palette with a single restrained accent. No gradients, rings, badges, icons-for-decoration, or fitness clichés.

## Data

Backend on Lovable Cloud (Postgres) as the single source of truth — no localStorage persistence.

- `workouts` (name, position, last_completed_at)
- `exercises` (workout_id, name, position, target_reps, note)
- `sessions` (workout_id, date)
- `exercise_sets` (session_id, exercise_id, set_index, weight, reps)

One row per set rather than fixed set1/set2/set3 columns, so a 4th set needs no schema change. MVP has no auth; tables get permissive-but-explicit policies now and are structured so per-user RLS drops in later.

## Seed

The three workouts (Push, Pull, Leg/Shoulder) with their exercises, order, and target rep ranges come from the workout-plan image — send it and I'll seed exactly those. If it isn't attached when I build, I'll seed the three workout names with placeholder exercises you can rename in-app.

## Technical notes

- The spec names Next.js; this project runs TanStack Start (React + TypeScript + Tailwind), which is fixed here and covers the same ground. Everything else in the stack section holds.
- PWA: manifest + standalone display + iOS meta tags so it installs from Safari with no browser chrome.
- Logic separated from UI: data access in hooks over TanStack Query, small reusable presentational components.