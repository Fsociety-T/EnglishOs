-- EnglishOS database schema
--
-- Paste this whole file into the Supabase SQL editor and run it once.
-- Safe to re-run: every statement is guarded.
--
-- Security model: every table carries user_id and has Row Level Security on
-- with a policy of auth.uid() = user_id. That is what makes it safe to ship
-- the anon key in the browser bundle - the key identifies the project, not the
-- user, and the database refuses to return another account's rows.

-- ---------------------------------------------------------------- profiles --
create table if not exists public.profiles (
  id                  uuid primary key references auth.users on delete cascade,
  display_name        text        not null default 'Learner',
  -- The language being learned. Also the language the interface speaks.
  language            text        not null default 'en' check (language in ('en','fr')),
  level               text        not null default 'B1'
                        check (level in ('A1','A2','B1','B2','C1','C2')),
  daily_goal_minutes  integer     not null default 20 check (daily_goal_minutes between 1 and 600),
  created_at          timestamptz not null default now()
);


-- ---------------------------------------------------------------- sessions --
create table if not exists public.sessions (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid        not null references auth.users on delete cascade,
  language          text        not null default 'en' check (language in ('en','fr')),
  kind              text        not null check (kind in ('writing','speaking')),
  topic_title       text        not null,
  prompt            text        not null default '',
  content           text        not null,
  audio_path        text,
  duration_seconds  integer     not null default 0,
  word_count        integer     not null default 0,
  -- Corrections and metrics live as jsonb rather than child tables: they are
  -- always read together with the session and never queried on their own.
  corrections       jsonb       not null default '[]'::jsonb,
  scores            jsonb       not null default '{}'::jsonb,
  summary           text        not null default '',
  strengths         jsonb       not null default '[]'::jsonb,
  next_focus        jsonb       not null default '[]'::jsonb,
  metrics           jsonb,
  created_at        timestamptz not null default now()
);
create index if not exists sessions_user_created_idx
  on public.sessions (user_id, created_at desc);

-- ----------------------------------------------------------------- lessons --
create table if not exists public.lessons (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid        not null references auth.users on delete cascade,
  language           text        not null default 'en' check (language in ('en','fr')),
  error_type         text        not null,
  title              text        not null,
  body               text        not null default '',
  examples           jsonb       not null default '[]'::jsonb,
  exercises          jsonb       not null default '[]'::jsonb,
  source_session_id  uuid        references public.sessions on delete set null,
  source_sentence    text,
  status             text        not null default 'new'
                       check (status in ('new','learning','mastered')),
  created_at         timestamptz not null default now()
);
create index if not exists lessons_user_idx on public.lessons (user_id, created_at desc);

-- -------------------------------------------------------------- vocabulary --
create table if not exists public.vocabulary (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid        not null references auth.users on delete cascade,
  language        text        not null default 'en' check (language in ('en','fr')),
  word            text        not null,
  phonetic        text,
  part_of_speech  text,
  definition      text        not null default '',
  example         text        not null default '',
  tags            text[]      not null default '{}',
  source          text        not null default 'manual'
                    check (source in ('writing','speaking','podcast','manual')),
  source_id       uuid,
  srs_box         smallint    not null default 1 check (srs_box between 1 and 5),
  next_review_at  timestamptz not null default now(),
  created_at      timestamptz not null default now(),
  -- The same word twice in one notebook is always a mistake, never intent -
  -- but "important" as an English word and as a French word are two entries.
  unique (user_id, language, word)
);
create index if not exists vocabulary_due_idx on public.vocabulary (user_id, next_review_at);

-- ---------------------------------------------------------------- podcasts --
create table if not exists public.podcasts (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid        not null references auth.users on delete cascade,
  title             text        not null,
  url               text        not null,
  platform          text        not null default 'other'
                      check (platform in ('youtube','spotify','other')),
  embed_id          text,
  thumbnail_url     text,
  status            text        not null default 'to-watch'
                      check (status in ('to-watch','watching','done')),
  progress_seconds  integer     not null default 0,
  rating            smallint    check (rating between 1 and 5),
  created_at        timestamptz not null default now()
);

create table if not exists public.podcast_notes (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid        not null references auth.users on delete cascade,
  podcast_id        uuid        not null references public.podcasts on delete cascade,
  timestamp_seconds integer,
  note              text        not null,
  created_at        timestamptz not null default now()
);
create index if not exists notes_podcast_idx on public.podcast_notes (podcast_id, timestamp_seconds);

-- ------------------------------------------------------------- daily_stats --
create table if not exists public.daily_stats (
  user_id           uuid    not null references auth.users on delete cascade,
  day               date    not null,
  minutes_practiced integer not null default 0,
  words_written     integer not null default 0,
  speaking_seconds  integer not null default 0,
  words_learned     integer not null default 0,
  lessons_completed integer not null default 0,
  primary key (user_id, day)
);

-- ------------------------------------------------- language backfill (v2) --
-- The language columns arrived with the French version, after the first
-- release. `create table if not exists` above does nothing to a table that
-- already exists, so existing projects get the columns here instead.
-- Defaulting to 'en' leaves every account created before French exactly where
-- it was: their history stays English and stays visible.
do $$
begin
  alter table public.profiles   add column if not exists language text not null default 'en';
  alter table public.sessions   add column if not exists language text not null default 'en';
  alter table public.lessons    add column if not exists language text not null default 'en';
  alter table public.vocabulary add column if not exists language text not null default 'en';

  -- Vocabulary was unique on (user_id, word). It has to become
  -- (user_id, language, word), or a French word could never be saved
  -- alongside the identically spelled English one.
  if exists (
    select 1 from pg_constraint
    where conname = 'vocabulary_user_id_word_key'
      and conrelid = 'public.vocabulary'::regclass
  ) then
    alter table public.vocabulary drop constraint vocabulary_user_id_word_key;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'vocabulary_user_id_language_word_key'
      and conrelid = 'public.vocabulary'::regclass
  ) then
    alter table public.vocabulary
      add constraint vocabulary_user_id_language_word_key unique (user_id, language, word);
  end if;
end $$;

-- Check constraints are added separately: each is skipped if already present.
do $$
declare
  t text;
begin
  for t in select unnest(array['profiles','sessions','lessons','vocabulary'])
  loop
    begin
      execute format(
        'alter table public.%I add constraint %I check (language in (''en'',''fr''))',
        t, t || '_language_check');
    exception
      when duplicate_object then null;
    end;
  end loop;
end $$;

-- ------------------------------------------------------ row level security --
alter table public.profiles      enable row level security;
alter table public.sessions      enable row level security;
alter table public.lessons       enable row level security;
alter table public.vocabulary    enable row level security;
alter table public.podcasts      enable row level security;
alter table public.podcast_notes enable row level security;
alter table public.daily_stats   enable row level security;

do $$
declare
  t text;
begin
  -- profiles keys on id; every other table keys on user_id.
  for t in select unnest(array[
      'sessions','lessons','vocabulary','podcasts','podcast_notes','daily_stats'
    ])
  loop
    execute format('drop policy if exists "own rows" on public.%I', t);
    execute format(
      'create policy "own rows" on public.%I for all
         using (auth.uid() = user_id) with check (auth.uid() = user_id)', t);
  end loop;

  drop policy if exists "own profile" on public.profiles;
  create policy "own profile" on public.profiles for all
    using (auth.uid() = id) with check (auth.uid() = id);
end $$;

-- -------------------------------------------------- profile auto-provision --
-- Without this, a brand new account has no profile row and the dashboard has
-- nothing to greet them with.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  chosen text := new.raw_user_meta_data ->> 'language';
begin
  -- The sign-up form sends the chosen language as user metadata. Anything
  -- unexpected falls back to English rather than failing the check constraint
  -- and blocking the account from being created at all.
  if chosen is null or chosen not in ('en', 'fr') then
    chosen := 'en';
  end if;

  insert into public.profiles (id, display_name, language)
  values (new.id, coalesce(split_part(new.email, '@', 1), 'Learner'), chosen)
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- --------------------------------------------------- daily stats increment --
-- Called instead of read-modify-write so two devices practising on the same
-- day cannot overwrite each other's totals.
create or replace function public.bump_daily_stats(
  p_minutes integer default 0,
  p_words integer default 0,
  p_speaking integer default 0,
  p_learned integer default 0,
  p_lessons integer default 0
) returns void
language plpgsql
security invoker
as $$
begin
  insert into public.daily_stats as d
    (user_id, day, minutes_practiced, words_written, speaking_seconds, words_learned, lessons_completed)
  values
    (auth.uid(), current_date, p_minutes, p_words, p_speaking, p_learned, p_lessons)
  on conflict (user_id, day) do update set
    minutes_practiced = d.minutes_practiced + excluded.minutes_practiced,
    words_written     = d.words_written     + excluded.words_written,
    speaking_seconds  = d.speaking_seconds  + excluded.speaking_seconds,
    words_learned     = d.words_learned     + excluded.words_learned,
    lessons_completed = d.lessons_completed + excluded.lessons_completed;
end $$;

-- ------------------------------------------------------------ audio bucket --
insert into storage.buckets (id, name, public)
values ('recordings', 'recordings', false)
on conflict (id) do nothing;

-- Each user may only touch files under a folder named after their own uid.
drop policy if exists "own recordings" on storage.objects;
create policy "own recordings" on storage.objects for all
  using (bucket_id = 'recordings' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'recordings' and (storage.foldername(name))[1] = auth.uid()::text);
