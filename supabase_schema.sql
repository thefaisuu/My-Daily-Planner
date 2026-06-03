-- ══════════════════════════════════════════════════════════
-- 1. PROFILES TABLE (Keyed by id references auth.users)
-- ══════════════════════════════════════════════════════════
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  avatar_url text,
  gemini_api_key text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table profiles enable row level security;

-- Policies for profiles
create policy "profiles_select" on profiles for select using (auth.uid() = id);
create policy "profiles_insert" on profiles for insert with check (auth.uid() = id);
create policy "profiles_update" on profiles for update using (auth.uid() = id);
create policy "profiles_delete" on profiles for delete using (auth.uid() = id);

-- Trigger to automatically create a profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ══════════════════════════════════════════════════════════
-- 2. SCHEDULE TASKS
-- ══════════════════════════════════════════════════════════
create table if not exists schedule_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  date date not null,
  time_slot text not null,
  task text not null,
  completed boolean default false not null,
  constraint unique_user_schedule unique (user_id, date, time_slot)
);

alter table schedule_tasks enable row level security;

-- Policies for schedule_tasks
create policy "schedule_tasks_select" on schedule_tasks for select using (auth.uid() = user_id);
create policy "schedule_tasks_insert" on schedule_tasks for insert with check (auth.uid() = user_id);
create policy "schedule_tasks_update" on schedule_tasks for update using (auth.uid() = user_id);
create policy "schedule_tasks_delete" on schedule_tasks for delete using (auth.uid() = user_id);


-- ══════════════════════════════════════════════════════════
-- 3. HABITS
-- ══════════════════════════════════════════════════════════
create table if not exists habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  name text not null,
  icon text,
  color text
);

alter table habits enable row level security;

-- Policies for habits
create policy "habits_select" on habits for select using (auth.uid() = user_id);
create policy "habits_insert" on habits for insert with check (auth.uid() = user_id);
create policy "habits_update" on habits for update using (auth.uid() = user_id);
create policy "habits_delete" on habits for delete using (auth.uid() = user_id);


-- ══════════════════════════════════════════════════════════
-- 4. HABIT LOGS
-- ══════════════════════════════════════════════════════════
create table if not exists habit_logs (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid references habits(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  completed_date date not null,
  streak_count integer default 0 not null
);

alter table habit_logs enable row level security;

-- Policies for habit_logs
create policy "habit_logs_select" on habit_logs for select using (auth.uid() = user_id);
create policy "habit_logs_insert" on habit_logs for insert with check (auth.uid() = user_id);
create policy "habit_logs_update" on habit_logs for update using (auth.uid() = user_id);
create policy "habit_logs_delete" on habit_logs for delete using (auth.uid() = user_id);


-- ══════════════════════════════════════════════════════════
-- 5. MOOD LOGS
-- ══════════════════════════════════════════════════════════
create table if not exists mood_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  mood text not null,
  note text,
  logged_date date not null,
  constraint unique_user_mood unique (user_id, logged_date)
);

alter table mood_logs enable row level security;

-- Policies for mood_logs
create policy "mood_logs_select" on mood_logs for select using (auth.uid() = user_id);
create policy "mood_logs_insert" on mood_logs for insert with check (auth.uid() = user_id);
create policy "mood_logs_update" on mood_logs for update using (auth.uid() = user_id);
create policy "mood_logs_delete" on mood_logs for delete using (auth.uid() = user_id);


-- ══════════════════════════════════════════════════════════
-- 6. NOTES
-- ══════════════════════════════════════════════════════════
create table if not exists notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  title text,
  body text,
  color text,
  pinned boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table notes enable row level security;

-- Policies for notes
create policy "notes_select" on notes for select using (auth.uid() = user_id);
create policy "notes_insert" on notes for insert with check (auth.uid() = user_id);
create policy "notes_update" on notes for update using (auth.uid() = user_id);
create policy "notes_delete" on notes for delete using (auth.uid() = user_id);


-- ══════════════════════════════════════════════════════════
-- 7. WATER LOGS
-- ══════════════════════════════════════════════════════════
create table if not exists water_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  glasses integer default 0 not null,
  goal integer default 8 not null,
  logged_date date not null,
  constraint unique_user_water unique (user_id, logged_date)
);

alter table water_logs enable row level security;

-- Policies for water_logs
create policy "water_logs_select" on water_logs for select using (auth.uid() = user_id);
create policy "water_logs_insert" on water_logs for insert with check (auth.uid() = user_id);
create policy "water_logs_update" on water_logs for update using (auth.uid() = user_id);
create policy "water_logs_delete" on water_logs for delete using (auth.uid() = user_id);


-- ══════════════════════════════════════════════════════════
-- 8. CHAT HISTORY
-- ══════════════════════════════════════════════════════════
create table if not exists chat_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  role text not null,
  message text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table chat_history enable row level security;

-- Policies for chat_history
create policy "chat_history_select" on chat_history for select using (auth.uid() = user_id);
create policy "chat_history_insert" on chat_history for insert with check (auth.uid() = user_id);
create policy "chat_history_update" on chat_history for update using (auth.uid() = user_id);
create policy "chat_history_delete" on chat_history for delete using (auth.uid() = user_id);


-- ══════════════════════════════════════════════════════════
-- 9. AI BRIEFINGS
-- ══════════════════════════════════════════════════════════
create table if not exists ai_briefings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  message text not null,
  briefing_date date not null,
  constraint unique_user_briefing unique (user_id, briefing_date)
);

alter table ai_briefings enable row level security;

-- Policies for ai_briefings
create policy "ai_briefings_select" on ai_briefings for select using (auth.uid() = user_id);
create policy "ai_briefings_insert" on ai_briefings for insert with check (auth.uid() = user_id);
create policy "ai_briefings_update" on ai_briefings for update using (auth.uid() = user_id);
create policy "ai_briefings_delete" on ai_briefings for delete using (auth.uid() = user_id);


-- ══════════════════════════════════════════════════════════
-- 10. STORAGE SETUP FOR AVATARS
-- ══════════════════════════════════════════════════════════

-- Create the avatars bucket
insert into storage.buckets (id, name, public) 
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Enable policies for storage
create policy "avatars_select" on storage.objects for select using (bucket_id = 'avatars');
create policy "avatars_insert" on storage.objects for insert with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "avatars_update" on storage.objects for update using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "avatars_delete" on storage.objects for delete using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
