# PRODUCT SPEC
# Lift

> **A beautifully designed personal workout memory app.**

**Version:** MVP v0.1  
**Status:** In Development  
**Owner:** Pedro Melo  
**Platform:** iPhone (PWA)  
**Last Updated:** August 2026

---

# 1. Overview

## Vision

Lift is a personal workout memory app designed to eliminate the cognitive load of remembering previous workouts.

Its purpose is simple:

> **Remember what I lifted last time so I know what to lift today.**

It is **not** a complete fitness platform.

It is **not** trying to compete with Heavy, Strong or Hevy.

Instead, it solves one problem exceptionally well.

---

## Problem

Progressive overload depends on remembering previous performance.

Today, this information lives inside spreadsheets or feature-heavy fitness apps.

This creates unnecessary friction.

When arriving at an exercise, the user often forgets:

- What weight did I use?
- How many reps did I complete?
- Should I increase today?
- Did I already improve compared to last session?

Because of that, users naturally choose comfortable weights instead of progressing.

---

## Solution

Lift remembers everything.

The user opens today's workout, expands an exercise and instantly sees previous performance.

Today's values are already pre-filled.

The user only edits what changed.

No thinking.

No remembering.

No spreadsheets.

---

# 2. Product Philosophy

Lift is **not** a workout tracker.

Lift is a **memory extension**.

The user is already motivated.

The app should never try to motivate them.

The app should never coach them.

The app should never judge them.

Its only responsibility is remembering previous workouts beautifully.

Think:

> **Apple Notes for progressive overload.**

---

# 3. Design Philosophy

The design should feel inspired by:

- Apple Notes
- Apple Health
- Linear

Not by traditional fitness applications.

The experience should feel:

- calm
- premium
- elegant
- lightweight
- effortless

Luxury comes from restraint.

Not decoration.

Use:

- generous whitespace
- subtle separators
- beautiful typography
- restrained colors
- smooth animations
- minimal hierarchy

Avoid:

- gradients
- neon colors
- progress rings
- badges
- trophies
- fitness clichés
- unnecessary icons
- dashboards
- clutter

If something doesn't help today's workout, remove it.

---

# 4. Product Principles

## Memory before tracking

Tracking exists only to improve memory.

---

## Zero cognitive load

The app remembers.

The user doesn't.

---

## Fast

Everything should feel immediate.

---

## Edit in place

No unnecessary navigation.

---

## Auto-save

Every edit persists automatically.

No Save button.

---

## Mobile-first

Everything is designed for iPhone.

Desktop is secondary.

---

# 5. UX Principles

- The user should know what to lift within **3 seconds**.
- Everything should work comfortably one-handed.
- Minimize taps.
- Prefer editing over navigation.
- Never interrupt the workout.
- Never ask unnecessary questions.
- Never show unnecessary information.
- Use whitespace as a design element.
- Typography is more important than colors.
- Every animation should feel subtle (150–250ms).

---

# 6. Navigation

Only three levels exist.

```

Home

↓

Workout

↓

Exercise

```

No bottom navigation.

No hidden menus.

No tab bars.

No profile.

No settings page unless absolutely necessary.

---

# 7. Home Screen

Greeting.

Example:

```

Hey Pedro

```

Below:

```

What are we training today?

```

Workout cards.

Current workouts:

- Push3
- Pull3
- Legs3

Each card displays:

- workout name
- last completed date

Nothing else.

No statistics.

No streaks.

No dashboard.

---

# 8. Workout Screen

Selecting a workout opens the exercise list.

Example:

```

← Push3

▼ Incline Bench Press

▶ Dips

▶ Chest Fly

▶ Behind Head Tricep

▶ Tricep Cable Pushdowns

```

Exercises expand and collapse.

The user can:

- add exercises
- delete exercises
- reorder exercises

---

# 9. Exercise Screen

This is the most important screen.

The UI should prioritize **comparison** over scrolling.

Each previous workout occupies one row.

Each set occupies one compact cell.

Example:

| Date | Set 1 | Set 2 | Set 3 |
|-------|--------|--------|--------|
| Jul 12 | 22×10 | 22×10 | 24×6 |
| Jul 19 | 22×10 | 22×10 | 24×7 |
| Jul 26 | 22×10 | 22×11 | 24×7 |
| **Today** | 22×10 | 22×11 | 24×7 |

Today's row is automatically pre-filled using the latest workout.

Every value is editable.

Tapping a value allows editing directly.

Changes are automatically saved.

No Save button.

The complete table should comfortably fit on one iPhone screen.

---

# 10. Notes

Each exercise supports one optional note.

Example:

```

Warm up with 18kg before working sets.

```

If no note exists, don't display anything.

---

# 11. Logging Philosophy

The app never forces a workflow.

The user may update:

- after every set
- after finishing the exercise
- after finishing the workout

All workflows should feel natural.

The app behaves more like editing a spreadsheet than completing a form.

---

# 12. Editing

Everything is editable.

- workout names
- exercise names
- exercise order
- notes
- weights
- reps

Nothing becomes permanently locked.

---

# 13. Current Workout Templates

The application should initialize with the workout plan from the reference image (`assets/workout-plan.png`).

Maintain workout names, exercise names, order, and target rep ranges exactly as defined below.

## Push3

| Order | Exercise | Sets/Reps |
|-------|----------|-----------|
| 1 | Incline Bench Press | 4×6–8 |
| 2 | Dips | 3×8–12 |
| 3 | Chest Fly | 3×12–15 |
| 4 | Behind Head Tricep | 3×10–12 |
| 5 | Tricep Cable Pushdowns | 3×10/side |

## Pull3

| Order | Exercise | Sets/Reps |
|-------|----------|-----------|
| 1 | Pull Ups (open form) | 4×8–10 |
| 2 | Lat Pulldown | 3×8–10 |
| 3 | Seated Horizontal Row | 3×10–12 |
| 4 | Standing Lat Pushdown | 3×10–12 |
| 5 | Bicep Curls | 3×10 |

## Legs3

| Order | Exercise | Sets/Reps |
|-------|----------|-----------|
| 1 | Landmine Snatch | 3×8–10 |
| 2 | Shoulder Press | 3×10–12 |
| 3 | Walking Lunges | 3×15–20 |
| 4 | Leg Extension | 3×12–15 |
| 5 | Lateral Raises | 3×10/side |

---

# 14. Information Architecture

```

Workout

└── Exercise

├── History

├── Today

└── Note

```

---

# 15. Data Model

Entities:

```

Workout

Exercise

WorkoutSession

ExerciseSession

ExerciseNote

```

Each ExerciseSession stores:

- date
- exercise
- set 1 weight
- set 1 reps
- set 2 weight
- set 2 reps
- set 3 weight
- set 3 reps

Design the schema so adding additional sets later requires minimal changes.

---

# 16. Technology Stack

The following technologies are mandatory unless there is a compelling technical reason otherwise.

## Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS

## Backend

Supabase

Use Supabase for:

- PostgreSQL database
- future authentication
- Row Level Security preparation

Authentication is **not** part of the MVP.

---

## Hosting

Vercel

---

## Mobile

Progressive Web App (PWA)

Requirements:

- Installable from Safari.
- Launches from Home Screen.
- Standalone mode.
- No browser chrome.
- Mobile-first.
- Responsive.

---

## Data

Supabase is the source of truth.

Do **not** use LocalStorage as primary persistence.

LocalStorage may only be used for temporary UI state or caching.

---

## Cost

The application should remain fully functional using only free tiers.

Target infrastructure cost:

**$0/month**

The only future paid services expected are AI APIs.

---

# 17. Project Structure

```

app/

components/

hooks/

lib/

types/

supabase/

public/

assets/

```

Components should remain:

- reusable
- modular
- easy to extend

---

# 18. Coding Principles

- Use TypeScript everywhere.
- Prefer reusable components.
- Separate business logic from UI.
- Avoid duplicated code.
- Follow modern React patterns.
- Prefer composition over inheritance.
- Keep components small.
- Keep styling inside Tailwind.
- Write code that future AI agents can extend easily.

---

# 19. Things the AI Should Optimize For

- Build for speed.
- Build for simplicity.
- Build for maintainability.
- Build for extensibility.
- Prioritize usability over aesthetics.
- Typography over decoration.
- Whitespace over visual effects.
- Keep the UI feeling handcrafted.
- Every interaction should feel intentional.

---

# 20. Things the AI Should NOT Build

Do **not** invent:

- dashboards
- charts
- AI coaching
- workout recommendations
- progression suggestions
- PR tracking
- calories
- nutrition
- bodyweight
- timers
- Apple Health integration
- wearables
- social features
- achievements
- streaks
- onboarding
- login
- subscriptions
- settings pages
- bottom navigation
- floating action buttons
- generic fitness app layouts

Stay focused.

---

# 21. Acceptance Criteria

The MVP is complete when the user can:

- Open the app from the iPhone Home Screen.
- Choose today's workout.
- Expand an exercise.
- Instantly compare the last three sessions.
- Edit today's weights and reps.
- Auto-save changes.
- Close the app.
- Reopen later.
- Find everything exactly as before.

---

# 22. Success Definition

The MVP succeeds if, after one month, the user no longer needs a spreadsheet because Lift has become the default tool before every exercise.

---

# 23. Final Instructions for Lovable

Read this entire Product Spec before generating any code.

Treat this document as the single source of truth.

Do not make assumptions when the specification is explicit.

If something is ambiguous, choose the simplest solution aligned with the product philosophy.

Do not think of Lift as a fitness app.

Think of it as **Apple Notes for progressive overload.**

Build the architecture as if this project will continue growing for years, even though the MVP is intentionally small.

Prioritize:

- clean architecture
- reusable components
- maintainable code
- mobile-first experience
- elegant UX

The goal is not to build the most feature-rich workout app.

The goal is to build the most effortless way to remember previous workouts.
