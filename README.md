# Lift

A personal workout memory app — **Apple Notes for progressive overload.**

## Stack

- Next.js 15 + React + TypeScript + Tailwind CSS
- Supabase (PostgreSQL)
- Vercel + PWA

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up Supabase

1. Create a free project at [supabase.com](https://supabase.com)
2. Run the migration in `supabase/migrations/001_initial_schema.sql` via the SQL Editor
3. Copy `.env.example` to `.env.local` and add your project URL + anon key

### 3. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 4. Install on iPhone

1. Open the app in Safari
2. Tap Share → Add to Home Screen

## Deploy

Deploy to [Vercel](https://vercel.com) and add the same environment variables.

## Product Spec

See [PRODUCT_SPEC.md](./PRODUCT_SPEC.md) for the full MVP specification.
