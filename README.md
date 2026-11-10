# Kalding English 🐐

A fast, delightfully tactile, typing-based English vocabulary learning web app. Learn vocabulary, spelling, definitions, and sentence composition by typing—complete with instant feedback, spaced repetition (SRS), points, streaks, and an expressive goat mascot named **Kalding** (_Ilocano for "goat"_).

**Tech Stack:** Next.js 16.4.5 (App Router) + React 19, TypeScript, Tailwind CSS v4, Supabase (Auth, Postgres, RLS), Anthropic Claude 3.5 Haiku (AI Semantic Grading), and Web Speech/Audio APIs.

> **Current Status:** **Phases 0–9 Complete & Production Ready**. 87/87 unit tests passing, 0 TypeScript errors, 19/19 routes statically compiled and partially prerendered.

---

## Key Features

### 1. Six Diverse Practice Modes

- **Definition &rarr; Word (`/practice/def_to_word`)**: Deduce the word from its dictionary definition and type it with character-by-character validation and color-coded feedback boxes.
- **Fill in the Blank (`/practice/fill_blank`)**: Cloze context drill; complete real-world example sentences by typing the missing target vocabulary.
- **Audio Dictation (`/practice/dictation`)**: Train listening skills using the Web Speech Synthesis voice synthesizer—listen to pronunciation and type the word from sound alone.
- **Speed Run (`/practice/speed_run`)**: High-intensity 60-second timed sprint measuring live Words Per Minute (WPM), accuracy percentage, and combo multipliers.
- **Word &rarr; Definition (`/practice/word_to_def`)**: Explain words in your own phrasing and receive instant AI feedback via Anthropic Claude 3.5 Haiku with semantic scoring and concept matching (with local fallback).
- **Type the Definition (`/practice/type_def`)**: Transcribe complete dictionary definitions character-by-character with live cursor tracking, space error indicators, and WPM computation.

### 2. Vocabulary of the Day (`/daily`)

- **Deterministic Daily Word:** Automatically selects a daily featured word based on the calendar date.
- **4-Step Progressive Drill:**
  1. _Recall & Spelling_ — Type the word from its definition with hint support.
  2. _Type Definition_ — Type out the complete dictionary definition word-for-word.
  3. _Transcribe Sentence_ — Type the authentic example sentence character-by-character.
  4. _Original Sentence Composition_ — Write your own original sentence using the word, with live client-side validation ensuring grammatical length and target word inclusion.
- **Rewards & Replayability:** Grants a **+50 XP** bonus on first completion each day, with unlimited repeat practice sessions available for extra reinforcement.

### 3. Spaced Repetition (SRS) & Intelligent Word Rotation (`/review`)

- **SuperMemo SM-2 Algorithm:** Calculates optimal review intervals based on answer accuracy, response speed, and streak histories (`src/core/srs.ts`).
- **Rotation Engine:** Dynamically prioritizes unpracticed vocabulary and overdue cards across the starter dataset of 150 words rather than repeating the same starter terms.

### 4. Interactive Dictionary & Word Bank (`/words`)

- Browse 150 CEFR-graded words (_Beginner_, _Intermediate_, _Advanced_) across 8 thematic domains (_Everyday_, _Academic_, _Work_, _Emotions_, _Action_, _Nature_, _Society_, _Technology_).
- Real-time search, part-of-speech filtering, and SRS mastery tracking.
- Free-form dictionary search modal powered by the Free Dictionary API.

### 5. Gamification & Progress Tracking (`/profile`)

- **10 Goat-Themed Ranks:** Climb from _Kid_ and _Grazing Kid_ to _Horned Scholar_, _Mountain Climber_, and _Mythic Capra_ (`src/core/levels.ts`).
- **Dynamic XP & Combo Bonuses:** Speed bonuses, accuracy multipliers, and streak bonuses (`src/core/scoring.ts`).
- **Daily Streaks & Goals:** Streak freeze protection, milestone indicators, and dynamic cheer messages from Kalding (`src/core/streak.ts`, `src/core/dailyGoal.ts`).

### 6. Tactile Audio & Keyboard Accessibility

- **Sound Effects:** Custom synthesized chimes for correct answers, soft thuds for errors, streak fanfare, and level-up chimes via the Web Audio API with volume controls.
- **Text-to-Speech:** Native speech synthesis with toggleable voice audio persisted across sessions in `localStorage`.
- **Keyboard Shortcuts:**
  - <kbd>Enter</kbd>: Submit answer / Advance to next word
  - <kbd>Alt</kbd> + <kbd>S</kbd>: Replay pronunciation audio
  - <kbd>Alt</kbd> + <kbd>H</kbd>: Reveal next letter hint (-5 XP)
  - <kbd>Esc</kbd>: Exit current session safely
- **Theme Support:** Dark and Light mode toggle with automatic system preference detection.

---

## Folder Structure

```
kalding-app/
├── public/
│   ├── kalding/              # Kalding SVG mascot expressions
│   └── sounds/               # Audio assets & chimes
├── src/
│   ├── app/                  # Next.js App Router (pages & server endpoints)
│   │   ├── (app)/            # Authenticated application shell
│   │   │   ├── daily/        # Vocabulary of the day route
│   │   │   ├── practice/     # Practice hub & dynamic [mode] runners
│   │   │   ├── review/       # Spaced repetition review queue
│   │   │   ├── words/        # Interactive dictionary & vocabulary browser
│   │   │   ├── profile/      # User progress, levels, and statistics
│   │   │   └── settings/     # Audio, theme, and account preferences
│   │   ├── (auth)/           # Login, Signup, and OAuth routes
│   │   ├── api/              # AI definition grading & dictionary endpoints
│   │   └── icon.svg          # Custom SVG goat mascot favicon
│   ├── components/           # UI components organized by domain
│   │   ├── daily/            # 4-step daily word engine
│   │   ├── gamification/     # Level badges, streak counters, XP toasts
│   │   ├── kalding/          # Reactive goat mascot & speech bubbles
│   │   ├── layout/           # App header, top navigation, and sidebars
│   │   ├── practice/         # Typing areas, prompt cards, feedback bars
│   │   └── ui/               # Design system atoms (buttons, chips, icons)
│   ├── core/                 # PURE TypeScript logic (Zero framework imports)
│   │   ├── blankSentence.ts  # Cloze blanking utilities
│   │   ├── checkAnswer.ts    # String normalization & character accuracy
│   │   ├── config.ts         # Central game constants & scoring rules
│   │   ├── dailyGoal.ts      # Daily goal tracking & cheer messages
│   │   ├── dailyWord.ts      # Date-based daily word picker & sentence validator
│   │   ├── gradeDefinition.ts# Concept matching & grading algorithms
│   │   ├── levels.ts         # XP progression thresholds & goat titles
│   │   ├── scoring.ts        # Dynamic XP calculation
│   │   ├── srs.ts            # SuperMemo SM-2 spaced repetition logic
│   │   ├── stats.ts          # Accuracy & mastery aggregations
│   │   ├── streak.ts         # Daily streak & freeze management
│   │   ├── wordSelection.ts  # Queue selection & word rotation engine
│   │   └── wpm.ts            # Live Words-Per-Minute calculations
│   ├── hooks/                # Custom React hooks (keyboard shortcuts, audio)
│   ├── lib/                  # Supabase clients, sounds, and speech helpers
│   └── types/                # Supabase database schemas & application types
├── supabase/
│   ├── migrations/           # SQL migration files with Row Level Security
│   └── seed/words.json       # 150 curated starter vocabulary words
└── scripts/                  # Word seeding & dictionary import utilities
```

### The `src/core/` Architecture Rule

All business logic inside `src/core/` is **strictly framework-independent**:

- No React hooks, no Next.js APIs, and no browser-specific globals (`window`, `localStorage`, `document`).
- 100% test coverage with Vitest (`*.test.ts` alongside every file).
- This decoupled architecture allows the exact same core logic to be shared with future mobile apps (e.g., React Native / Expo) without modifications.

---

## Getting Started

### Prerequisites

- **Node.js**: 20.19+ (tested on Node.js 24)
- **npm**

### 1. Installation

```bash
git clone https://github.com/your-username/kalding-app.git
cd kalding-app
npm install
```

### 2. Configure Environment Variables

Create `.env.local` by copying `.env.example`:

```bash
# Windows PowerShell
Copy-Item .env.example .env.local

# macOS / Linux
cp .env.example .env.local
```

Fill in your configuration keys:

```env
# Supabase (Auth & Database)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Anthropic Claude (Optional - for AI Definition Grading)
ANTHROPIC_API_KEY=sk-ant-api03-...

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> **Security Note:** `ANTHROPIC_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are server-only secrets. Never prefix them with `NEXT_PUBLIC_` and never import them into client components.

### 3. Database Setup & Seeding

Run the Supabase migrations in `supabase/migrations/` via the Supabase Dashboard SQL Editor or Supabase CLI. Then seed the 150 starter vocabulary words:

```bash
npm run seed
```

### 4. Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to open the app.

---

## Available Scripts

| Command                | Purpose                                                           |
| :--------------------- | :---------------------------------------------------------------- |
| `npm run dev`          | Launch Next.js local development server with Turbopack            |
| `npm run build`        | Compile optimized Next.js production build (`--webpack`)          |
| `npm run start`        | Run production server                                             |
| `npm test`             | Run all 87 unit tests via Vitest                                  |
| `npm run test:watch`   | Run Vitest in interactive watch mode                              |
| `npm run typecheck`    | Run TypeScript validation without emitting files (`tsc --noEmit`) |
| `npm run lint`         | Run ESLint checks                                                 |
| `npm run format`       | Automatically format all files with Prettier                      |
| `npm run format:check` | Verify formatting consistency with Prettier                       |
| `npm run seed`         | Seed database with initial 150 words from `words.json`            |

---

## Build Phases

- [x] **Phase 0:** Project setup, tooling, and Vitest testing foundation
- [x] **Phase 1:** Design system, typography, theme toggle, and responsive layouts
- [x] **Phase 2:** Supabase schema, authentication (Email & Google OAuth), and Row Level Security
- [x] **Phase 3:** 150-word curated starter bank with CEFR levels and seed scripts
- [x] **Phase 4:** Core typing engine and Definition &rarr; Word recall practice mode
- [x] **Phase 5:** Spaced repetition system (SM-2) and smart review queue
- [x] **Phase 6:** All remaining practice modes (Cloze, Audio Dictation, Speed Run, AI Graded Word &rarr; Def, Type the Definition)
- [x] **Phase 7:** Gamification, level system (1–10), streak tracking, and Home dashboard
- [x] **Phase 8:** User profile, statistics, mastery tracking, and vocabulary directory
- [x] **Phase 9:** Sound effects, voice synthesis, keyboard shortcuts, mobile touch polish, favicon, and production deployment build
- [x] **Feature Extension:** Deterministic **Vocabulary of the Day** with 4-step progressive drill and intelligent multi-word rotation engine
- [ ] **Phase 10 (Future):** Progressive Web App (PWA) offline support, Expo React Native mobile companion app, and additional language packs.

---

## License

MIT License &copy; 2026 Kalding English.
