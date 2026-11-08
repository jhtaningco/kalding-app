-- Kalding English Initial Schema Migration
-- Tables: profiles, words, user_words, attempts, daily_stats

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- 1. PROFILES
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  language text not null default 'en',
  daily_goal integer not null default 100,
  theme text not null default 'light',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

comment on table public.profiles is 'Learner profile and preferences.';

-- 2. WORDS
create table if not exists public.words (
  id uuid primary key default gen_random_uuid(),
  language text not null default 'en',
  word text not null,
  part_of_speech text not null,
  definition text not null,
  example_sentence text not null,
  level text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_words_language on public.words(language);
create index if not exists idx_words_word on public.words(word);

comment on table public.words is 'Vocabulary dictionary and practice content.';

-- 3. USER_WORDS (Spaced Repetition tracking)
create table if not exists public.user_words (
  user_id uuid not null references auth.users(id) on delete cascade,
  word_id uuid not null references public.words(id) on delete cascade,
  language text not null default 'en',
  ease real not null default 2.5,
  interval_days integer not null default 0,
  next_review_at timestamp with time zone default timezone('utc'::text, now()) not null,
  streak_correct integer not null default 0,
  times_seen integer not null default 0,
  times_correct integer not null default 0,
  last_seen_at timestamp with time zone,
  primary key (user_id, word_id)
);

create index if not exists idx_user_words_review on public.user_words(user_id, next_review_at);
create index if not exists idx_user_words_language on public.user_words(user_id, language);

comment on table public.user_words is 'Learner SRS progress and stats per word.';

-- 4. ATTEMPTS (Typing practice history)
create table if not exists public.attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  word_id uuid not null references public.words(id) on delete cascade,
  language text not null default 'en',
  mode text not null,
  correct boolean not null,
  typed_text text not null,
  time_ms integer not null,
  accuracy real not null,
  points_earned integer not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_attempts_user on public.attempts(user_id, created_at desc);

comment on table public.attempts is 'Individual typing exercise submissions.';

-- 5. DAILY_STATS
create table if not exists public.daily_stats (
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null default current_date,
  language text not null default 'en',
  points integer not null default 0,
  words_practiced integer not null default 0,
  goal_met boolean not null default false,
  primary key (user_id, date)
);

create index if not exists idx_daily_stats_user on public.daily_stats(user_id, date desc);

comment on table public.daily_stats is 'Daily summary of points, practice count, and goal status.';

-- -------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS)
-- -------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.words enable row level security;
alter table public.user_words enable row level security;
alter table public.attempts enable row level security;
alter table public.daily_stats enable row level security;

-- PROFILES policies
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- WORDS policies
-- Authenticated users can read all words (and insert custom words)
create policy "Authenticated users can read words"
  on public.words for select
  to authenticated
  using (true);

create policy "Authenticated users can insert words"
  on public.words for insert
  to authenticated
  with check (true);

-- USER_WORDS policies
create policy "Users can view own user_words"
  on public.user_words for select
  using (auth.uid() = user_id);

create policy "Users can insert own user_words"
  on public.user_words for insert
  with check (auth.uid() = user_id);

create policy "Users can update own user_words"
  on public.user_words for update
  using (auth.uid() = user_id);

create policy "Users can delete own user_words"
  on public.user_words for delete
  using (auth.uid() = user_id);

-- ATTEMPTS policies
create policy "Users can view own attempts"
  on public.attempts for select
  using (auth.uid() = user_id);

create policy "Users can insert own attempts"
  on public.attempts for insert
  with check (auth.uid() = user_id);

-- DAILY_STATS policies
create policy "Users can view own daily stats"
  on public.daily_stats for select
  using (auth.uid() = user_id);

create policy "Users can insert own daily stats"
  on public.daily_stats for insert
  with check (auth.uid() = user_id);

create policy "Users can update own daily stats"
  on public.daily_stats for update
  using (auth.uid() = user_id);

-- -------------------------------------------------------------
-- AUTOMATIC PROFILE CREATION TRIGGER
-- -------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  raw_name text;
begin
  raw_name := coalesce(
    new.raw_user_meta_data->>'display_name',
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    split_part(new.email, '@', 1)
  );

  insert into public.profiles (id, display_name, language, daily_goal, theme)
  values (
    new.id,
    raw_name,
    'en',
    100,
    'light'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

-- Drop trigger if it already exists, then create
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
