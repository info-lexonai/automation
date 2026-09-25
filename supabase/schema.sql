-- LEXON Automation — Supabase/Postgres schema
-- Run this in Supabase SQL editor (or via `supabase db push`)

create extension if not exists pgcrypto;

create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

create table if not exists instagram_accounts (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  instagram_user_id text not null,
  username text,
  profile_image_url text,
  encrypted_token text not null, -- long-lived token, encrypted at rest (see server/lib/crypto.ts)
  token_expires_at timestamptz,
  status text not null default 'connected', -- connected | expired | revoked
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_id, instagram_user_id)
);

create table if not exists automations (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  instagram_account_id uuid not null references instagram_accounts(id) on delete cascade,
  post_id text,               -- null when post_scope = 'any' or 'next'
  post_scope text not null default 'specific', -- specific | any | next
  post_type text,             -- IMAGE | VIDEO | CAROUSEL_ALBUM | REEL
  post_thumbnail_url text,
  post_caption text,
  title text not null,
  description text,
  resource_type text not null default 'other', -- pdf|website|youtube|tool|course|file|other
  trigger_type text not null default 'keywords', -- keywords | any_comment
  match_mode text not null default 'flexible',   -- exact | flexible
  allow_emoji_only boolean not null default false,
  allow_short_comments boolean not null default false,
  delay_seconds int not null default 3 check (delay_seconds between 1 and 30),
  comment_reply_enabled boolean not null default true,
  dm_type text not null default 'text_button',
  dm_content text not null,
  button_label text,
  resource_url text,
  status text not null default 'draft', -- draft | active | paused
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists automation_keywords (
  id uuid primary key default gen_random_uuid(),
  automation_id uuid not null references automations(id) on delete cascade,
  keyword text not null,
  normalized_keyword text not null
);
create index if not exists idx_automation_keywords_norm on automation_keywords(automation_id, normalized_keyword);

create table if not exists excluded_keywords (
  id uuid primary key default gen_random_uuid(),
  automation_id uuid not null references automations(id) on delete cascade,
  keyword text not null,
  normalized_keyword text not null
);

create table if not exists comment_replies (
  id uuid primary key default gen_random_uuid(),
  automation_id uuid not null references automations(id) on delete cascade,
  response_text text not null,
  enabled boolean not null default true
);

create table if not exists automation_events (
  id uuid primary key default gen_random_uuid(),
  automation_id uuid not null references automations(id) on delete cascade,
  external_event_id text not null, -- Instagram comment/webhook event id, used for idempotency
  comment_id text,
  commenter_reference text,        -- IGSID, not the person's real identity
  event_type text not null,        -- comment_received | reply_sent | dm_sent | error
  status text not null,            -- success | failed | skipped
  error_message text,
  created_at timestamptz not null default now(),
  unique (automation_id, external_event_id, event_type)
);

create table if not exists automation_stats (
  automation_id uuid primary key references automations(id) on delete cascade,
  comments_triggered int not null default 0,
  dms_sent int not null default 0,
  replies_sent int not null default 0,
  button_clicks_if_available int not null default 0,
  updated_at timestamptz not null default now()
);

-- Row Level Security: every user only sees their own data
alter table profiles enable row level security;
alter table instagram_accounts enable row level security;
alter table automations enable row level security;
alter table automation_keywords enable row level security;
alter table excluded_keywords enable row level security;
alter table comment_replies enable row level security;
alter table automation_events enable row level security;
alter table automation_stats enable row level security;

create policy "own profile" on profiles for select using (auth_user_id = auth.uid());
create policy "own ig accounts" on instagram_accounts for select using (
  profile_id in (select id from profiles where auth_user_id = auth.uid())
);
create policy "own automations" on automations for all using (
  profile_id in (select id from profiles where auth_user_id = auth.uid())
);
create policy "own keywords" on automation_keywords for all using (
  automation_id in (select id from automations a join profiles p on a.profile_id = p.id where p.auth_user_id = auth.uid())
);
create policy "own excluded" on excluded_keywords for all using (
  automation_id in (select id from automations a join profiles p on a.profile_id = p.id where p.auth_user_id = auth.uid())
);
create policy "own replies" on comment_replies for all using (
  automation_id in (select id from automations a join profiles p on a.profile_id = p.id where p.auth_user_id = auth.uid())
);
create policy "own events" on automation_events for select using (
  automation_id in (select id from automations a join profiles p on a.profile_id = p.id where p.auth_user_id = auth.uid())
);
create policy "own stats" on automation_stats for select using (
  automation_id in (select id from automations a join profiles p on a.profile_id = p.id where p.auth_user_id = auth.uid())
);

-- NOTE: The backend uses the SERVICE ROLE key (bypasses RLS) for webhook writes,
-- since webhook requests come from Meta, not from a logged-in Supabase user.
-- RLS above protects direct client (anon key) access only.
