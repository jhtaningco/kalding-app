# Kalding English

A typing-based English learning app. Learn vocabulary, spelling, and grammar by typing, with points, streaks, and a goat mascot named Kalding (Ilocano for "goat").

**Stack:** Next.js (App Router) + TypeScript, Tailwind CSS, Supabase (Auth, Postgres, RLS), deployed on Vercel.

> Status: **Phase 0** (project setup). See the build phases at the bottom.

## Requirements

- Node.js 20.19+ (developed on Node 24)
- npm

## Run it

```bash
npm install
cp .env.example .env.local   # PowerShell: Copy-Item .env.example .env.local
npm run dev
```

Open http://localhost:3000. You should see the "Kalding English" placeholder page. No env values are needed until Phase 2.

## Scripts

| Command                | What it does                      |
| ---------------------- | --------------------------------- |
| `npm run dev`          | Start the dev server              |
| `npm run build`        | Production build                  |
| `npm run start`        | Serve the production build        |
| `npm run lint`         | ESLint                            |
| `npm run typecheck`    | TypeScript check (`tsc --noEmit`) |
| `npm run format`       | Prettier, write changes           |
| `npm run format:check` | Prettier, check only              |
| `npm test`             | Run unit tests once (Vitest)      |
| `npm run test:watch`   | Vitest in watch mode              |

## Folder structure

```
public/kalding/        Kalding SVG files (you add these)
public/sounds/         correct / wrong / level-up sounds (later)
src/app/               Next.js routes
src/components/        ui, kalding, practice, gamification, layout
src/core/              PURE TypeScript logic (scoring, SRS, checking, streaks, levels)
src/lib/               Supabase clients, text-to-speech helper
src/hooks/             React hooks
src/types/             Generated DB types
supabase/migrations/   SQL for tables and RLS
supabase/seed/         Seed data (words.json)
scripts/               Seed / import scripts
```

### The `src/core/` rule

Everything in `src/core/` is framework-independent: no React, no Next, no browser APIs. This lets the future Expo mobile app reuse it as-is. ESLint enforces this (`no-restricted-imports` for `react`, `next`, and app-layer folders). Every file there has a `*.test.ts` next to it. All tunable numbers (points, streak multipliers, daily goal, SRS values) live in [`src/core/config.ts`](src/core/config.ts).

## Secrets

- `.env.local` is git-ignored. Only `.env.example` is committed.
- `ANTHROPIC_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are **server only**. Never prefix them with `NEXT_PUBLIC_` and never import them in client code.

## Build phases

0. Project setup (current)
1. Design system and layout
2. Supabase, auth, and schema
3. Word content
4. First practice mode (Definition to Word)
5. Spaced repetition and review queue
6. Remaining modes
7. Gamification and home screen
8. Progress and profile
9. Polish and deploy
10. (Future) PWA, Expo app, other languages

> This project uses a recent Next.js with breaking changes from older versions. Check `node_modules/next/dist/docs/` before relying on older conventions (see `AGENTS.md`).
