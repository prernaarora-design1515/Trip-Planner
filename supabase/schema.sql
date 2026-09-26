-- Tripwise schema. Mirrors the shapes in src/lib/types.ts so swapping
-- src/lib/db.ts for Supabase calls is a mechanical change, not a redesign.
--
-- IDs are `text`, not `uuid`: the app generates its own prefixed ids
-- (e.g. "trip_<uuid>", "mem_<uuid>") via lib/id.ts and passes them in on
-- insert, rather than letting Postgres generate bare uuids.

create table trips (
  id text primary key,
  name text not null,
  creator_member_id text, -- fk added below, after members exists
  deadline timestamptz not null,
  date_range_start date not null,
  date_range_end date not null,
  status text not null default 'collecting'
    check (status in ('collecting', 'planning', 'ready', 'decided', 'split')),
  voting_round int not null default 1,
  allowed_option_ids text[], -- null = all shortlisted options are votable
  decided_option_id text,
  planned_at timestamptz,
  created_at timestamptz not null default now()
);

create table members (
  id text primary key,
  trip_id text not null references trips (id) on delete cascade,
  name text not null,
  device_token text, -- set on first "claim" from the join screen
  "order" int not null
);

alter table trips
  add constraint trips_creator_member_id_fkey
  foreign key (creator_member_id) references members (id);

create index members_trip_id_idx on members (trip_id);

create table responses (
  id text primary key,
  trip_id text not null references trips (id) on delete cascade,
  member_id text not null references members (id) on delete cascade,
  budget_min int not null,
  budget_max int not null,
  date_start date not null,
  date_end date not null,
  home_city text not null,
  vibes text[] not null, -- 1-2 of: beach, mountains, city, adventure, chill
  trip_length_days int not null,
  hard_no_tags text[] not null default '{}',
  hard_no_text text not null default '',
  submitted_at timestamptz not null default now(),
  unique (member_id) -- one submission per member, ever
);

create index responses_trip_id_idx on responses (trip_id);

-- Shortlisted, scored candidates for a trip (post veto-filter + scorer).
-- Only ever 3 rows per trip per planning run.
create table candidates (
  id text primary key,
  trip_id text not null references trips (id) on delete cascade,
  destination text not null,
  date_start date not null,
  date_end date not null,
  vibe_tags text[] not null,
  plan_summary text not null,
  cost_per_person jsonb not null, -- { [member_id]: number }
  member_scores jsonb not null, -- { [member_id]: { total, budget, date, vibe, travel } }
  min_score int not null,
  avg_score int not null,
  reasons jsonb not null default '{}', -- { [member_id]: string }, cached AI call #2 output
  rank int not null, -- 0 = best fit, 1 = runner-up, 2 = third
  created_at timestamptz not null default now()
);

create index candidates_trip_id_idx on candidates (trip_id);

create table votes (
  id text primary key,
  trip_id text not null references trips (id) on delete cascade,
  member_id text not null references members (id) on delete cascade,
  round int not null default 1,
  option_id text not null references candidates (id) on delete cascade,
  voted_at timestamptz not null default now(),
  unique (member_id, round) -- one vote per member per voting round, never editable
);

create index votes_trip_id_idx on votes (trip_id);
