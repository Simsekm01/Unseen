-- ============================================================
--  Supabase-Schema — Hochzeitskamera (Kaycee & Mustafa)
--  Im SQL-Editor von Supabase ausfuehren.
-- ============================================================
create extension if not exists pgcrypto;

create table if not exists public.events (
  id text primary key,
  couple_a text not null,
  couple_b text not null,
  wedding_date date not null,
  reveal_at timestamptz not null,
  password_hash text not null,
  max_shots int not null default 36,
  votes_per_guest int not null default 3
);

create table if not exists public.guests (
  id uuid primary key default gen_random_uuid(),
  event_id text not null references public.events(id),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.photos (
  id uuid primary key,
  event_id text not null references public.events(id),
  guest_id uuid not null references public.guests(id),
  guest_name text not null,
  storage_path text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.votes (
  id uuid primary key default gen_random_uuid(),
  event_id text not null references public.events(id),
  guest_id uuid not null references public.guests(id),
  photo_id uuid not null references public.photos(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (guest_id, photo_id)
);

-- ---------- Passwortpruefung (serverseitig) ----------
create or replace function public.verify_event_password(p_event_id text, p_password text)
returns boolean language sql security definer set search_path = public as $$
  select exists (
    select 1 from public.events
    where id = p_event_id and password_hash = crypt(p_password, password_hash)
  );
$$;

-- ---------- Album-Vorschau (auch VOR dem Reveal): Name + Cover + Anzahl ----------
-- Security definer, damit die Kacheln schon vorher sichtbar sind (Cover wird im UI verschwommen).
create or replace function public.list_albums(p_event_id text)
returns table (guest_name text, cover_path text, count bigint)
language sql security definer set search_path = public as $$
  select distinct on (p.guest_name)
         p.guest_name,
         first_value(p.storage_path) over (partition by p.guest_name order by p.created_at) as cover_path,
         count(*) over (partition by p.guest_name) as count
  from public.photos p
  where p.event_id = p_event_id
  order by p.guest_name, p.created_at;
$$;

-- ---------- Voting-Auszaehlung ----------
create or replace view public.vote_counts as
  select photo_id, count(*)::int as votes from public.votes group by photo_id;

-- ============================================================
--  Row Level Security
-- ============================================================
alter table public.events enable row level security;
alter table public.guests enable row level security;
alter table public.photos enable row level security;
alter table public.votes  enable row level security;

create policy "guests insert" on public.guests for insert to anon with check (true);
create policy "guests read"   on public.guests for select to anon using (true);

create policy "photos insert" on public.photos for insert to anon with check (true);
-- Fotos lesen erst ab reveal_at (Galerie). Eigene Rolle laeuft ueber guest_id-Filter im Client.
create policy "photos read after reveal" on public.photos for select to anon using (
  exists (select 1 from public.events e where e.id = photos.event_id and now() >= e.reveal_at)
);

-- Votes erst ab reveal_at moeglich, nur eigene loeschbar.
create policy "votes insert" on public.votes for insert to anon with check (
  exists (select 1 from public.events e where e.id = votes.event_id and now() >= e.reveal_at)
);
create policy "votes read"   on public.votes for select to anon using (true);
create policy "votes delete" on public.votes for delete to anon using (true);

-- Storage-Bucket
insert into storage.buckets (id, name, public) values ('photos','photos',true)
on conflict (id) do nothing;
create policy "photos upload" on storage.objects for insert to anon with check (bucket_id = 'photos');

-- ============================================================
--  Event anlegen — PASSWORT anpassen!
-- ============================================================
insert into public.events (id, couple_a, couple_b, wedding_date, reveal_at, password_hash, max_shots, votes_per_guest)
values (
  'kaycee-mustafa', 'Kaycee', 'Mustafa',
  '2026-09-02', '2026-09-03 00:00:00+02',
  crypt('liebe2026', gen_salt('bf')), 36, 3
)
on conflict (id) do nothing;
