# Lift — market readiness

Everything below keeps the current calm, typographic look. No new clutter.

## 1. Accounts and private data (the blocker)

Today every visitor shares the same workouts. Each person gets their own.

- Sign in with Google, plus email and password.
- A first-time visitor lands on a short sign-in screen; everything else sits behind it.
- Every workout, exercise, session, set and note becomes owned by one person, and
  the database only ever hands back your own rows.
- Existing seeded data stays as the starting template for new people, not as shared
  live data.

## 2. Onboarding

Straight after sign-up, one screen: "What are we training?"

- Three starter plans: Push / Pull / Legs, Upper / Lower, Full Body.
- Or "Start empty" and name your own.
- Picking a plan creates the workouts and exercises instantly, then drops you on Home.

## 3. Works offline

A gym basement can't break logging.

- The app shell and your workouts are cached, so it opens with no signal.
- Edits made offline are saved on the device and sent up automatically once you
  are back online.
- A small, quiet indicator when something is still waiting to sync.

## 4. Personal best flash

When a set beats the best you have ever done on that exercise, the cell gets a brief,
restrained highlight and a small mark stays on the row. No confetti, no sound.

## 5. Weekly recap

One card on Home, appearing at the end of the week: sessions logged, and how many
exercises went heavier than last time. Dismissable, never nagging.

## 6. Add to home screen

A one-line prompt on iOS Safari, shown once, explaining the share-sheet step. Never
shown again after it is dismissed or the app is already installed.

## 7. Export your data

A plain link in settings that downloads every session as a CSV file.

## 8. Landing page

A single public page at the root for signed-out visitors: what it is, one screenshot,
one sign-in button. Same monochrome design.

## Build order

Accounts, onboarding and offline ship together as one block, since they all touch how
data is owned and loaded. Then the personal best flash, then the recap, then install
prompt, export and landing page.

## Technical notes

- Auth via Lovable Cloud with Google plus email/password; a `profiles` row per user.
- Add `user_id` to `workouts`, `exercises`, `sessions`, `exercise_sets`,
  `session_notes`; replace the current open policies with per-user ones and matching
  grants. One migration, with a backfill of the existing rows onto the first account.
- Offline via a service worker for the shell plus a TanStack Query persister and a
  small outbox for pending writes.
- Personal best and recap computed in `src/lib/lift/model.ts` from data already
  fetched; no new tables.
- Export built client-side from the same queries.
