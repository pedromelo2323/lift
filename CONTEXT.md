# Lift — project context

Personal workout memory PWA for Pedro Melo. Apple Notes for progressive overload: log sets, see last sessions, keep moving weight up.

**Repo:** https://github.com/pedromelo2323/lift (`main`)  
**Live:** Vercel (auto-deploys from `main`)  
**DB:** Supabase project `utvgwckvosckvqnbhwkx` (EU)

---

## Stack

- Next.js 15 (App Router) + React + TypeScript + Tailwind
- Supabase (browser client, anon key) — no custom API for workouts
- TanStack React Query (5 min staleTime)
- PWA install via Safari → Add to Home Screen

Local env: `.env.local` with `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

---

## Data model (do not break)

```
workouts → exercises → exercise_sessions (sets jsonb + optional note)
                     → exercise_notes (legacy; prefer session.note)
bug_reports (kind: bug | idea, resolved bool)
```

Migrations in `supabase/migrations/` (`001` … `004_session_notes.sql`).  
Sets are **JSON on the session row**, not one DB row per set (unlike Lovable’s schema). When porting Lovable UI, reimplement against this shape.

`LovableCode/` is a local reference export (gitignored) — visual/UX source of truth, not the runtime app.

---

## App map

| Route | Purpose |
|-------|---------|
| `/` | Home — “Hey Pedro”, workout list, cold-start bicep splash |
| `/workout/[id]` | Workout — expand exercises, session table, rest timer |
| `/exercise/[id]` | Full exercise history (best set + all sessions + notes) |
| `/splash-preview` | Dev-only splash replay (can delete later) |

Global: bug FAB (bottom-right).  
Workout only: rest timer FAB (bottom-left).

---

## Features shipped (as of Aug 2026)

- Direct Supabase reads/writes + optimistic UI; drafts in `localStorage` so phone-lock mid-edit doesn’t lose sets (`keepalive` flush on background)
- Cold-start splash: grayscale 💪 fill animation (`BicepLoader` + `AppSplash`)
- Rest timer: 1:00 / 1:30 / 2:00 / 3:00, cancel ×, chime on finish (iOS has no vibrate)
- Session table: oldest → newest + Today last; `kg × reps` headers; ↑ when beating last session; stall hint after 3 flat sessions
- Per-session notes + faint previous note; history page via faint ↗
- Swipe past date row → trash → undo toast (5s)
- Bug sheet: drag handle down to dismiss; list with done/delete

Bug reports in Supabase are largely **resolved**; pull `bug_reports` if continuing work.

---

## Key files

| Area | Path |
|------|------|
| Home / splash | `components/HomeView.tsx`, `AppSplash.tsx`, `BicepLoader.tsx` |
| Workout | `WorkoutPageClient.tsx`, `ExerciseList.tsx`, `SessionTable.tsx` |
| Timer | `components/RestTimer.tsx` |
| Bugs | `components/BugReportButton.tsx` |
| Swipe / undo | `SwipeDeleteRow.tsx`, `UndoToast.tsx` |
| Data | `lib/workouts/fetch.ts`, `mutations.ts`, `session-draft.ts` |
| Hooks | `hooks/use-workouts.ts`, `useDebouncedCallback.ts` |
| Types | `types/index.ts`, `types/database.ts` |

---

## Conventions / gotchas

- Commits often need `--no-verify` (Uber git hooks) and explicit `user.name` / `user.email`; push with `gh auth token` credential helper.
- npm may need `--userconfig /dev/null` if Uber npmrc interferes.
- iPhone PWA caches aggressively — force-quit after deploy if UI looks stale.
- Don’t add auth yet; RLS is open (`using (true)`).
- Prefer minimal Apple-like UI (system fonts, hairlines, no purple/dashboard chrome).

---

## Possible next work

- Anything new from a refreshed `LovableCode` export
- Remove `/splash-preview` if no longer needed
- Auth / multi-user later (schema is ready for RLS)
- Custom rest durations, or timer that survives leaving the workout page

---

## Quick start

```bash
cd "Lift App"
npm run dev
# or: npm run dev -- -H 0.0.0.0  # test from phone on LAN
```

See you next time.

