-- ============================================================
<<<<<<< HEAD
--  Supabase-Schema — Hochzeitskamera (Kaycee & Mustafa)
=======
--  Supabase-Schema — Unseen Multi-Hochzeits-Plattform
>>>>>>> cef553901371bf220774623f8c092096541acc20
--  Im SQL-Editor von Supabase ausfuehren.
-- ============================================================
create extension if not exists pgcrypto;

<<<<<<< HEAD
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
=======
-- ---------- Admins ----------
create table if not exists public.admins (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  email text not null,
  password_hash text not null,
  created_at timestamptz not null default now()
);

-- ---------- Weddings ----------
create table if not exists public.weddings (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  couple_a text not null,
  couple_b text not null,
  date date not null,
  shoot_start timestamptz,
  shoot_end timestamptz,
  reveal_at timestamptz not null,
  voting_enabled boolean not null default false,
  voting_ends_at timestamptz,
  max_shots int not null default 36 check (max_shots between 16 and 36),
  filter_id text not null default 'vintage',
  color_scheme text not null default 'herbst',
  password_hash text not null,
  owner_id uuid not null references public.admins(id),
  created_at timestamptz not null default now()
);

-- ---------- Wedding-Admins (Zuordnung) ----------
create table if not exists public.wedding_admins (
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  admin_id uuid not null references public.admins(id) on delete cascade,
  primary key (wedding_id, admin_id)
);

-- ---------- Guests ----------
create table if not exists public.guests (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings(id),
>>>>>>> cef553901371bf220774623f8c092096541acc20
  name text not null,
  created_at timestamptz not null default now()
);

<<<<<<< HEAD
create table if not exists public.photos (
  id uuid primary key,
  event_id text not null references public.events(id),
=======
-- ---------- Photos ----------
create table if not exists public.photos (
  id uuid primary key,
  wedding_id uuid not null references public.weddings(id),
>>>>>>> cef553901371bf220774623f8c092096541acc20
  guest_id uuid not null references public.guests(id),
  guest_name text not null,
  storage_path text not null,
  created_at timestamptz not null default now()
);

<<<<<<< HEAD
create table if not exists public.votes (
  id uuid primary key default gen_random_uuid(),
  event_id text not null references public.events(id),
=======
-- ---------- Votes ----------
create table if not exists public.votes (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings(id),
>>>>>>> cef553901371bf220774623f8c092096541acc20
  guest_id uuid not null references public.guests(id),
  photo_id uuid not null references public.photos(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (guest_id, photo_id)
);

<<<<<<< HEAD
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
=======
-- ---------- RPC: Passwortpruefung ----------
create or replace function public.verify_wedding_password(p_wedding_id uuid, p_password text)
returns boolean language sql security definer set search_path = public as $$
  select exists (
    select 1 from public.weddings
    where id = p_wedding_id and password_hash = crypt(p_password, password_hash)
  );
$$;

-- ---------- RPC: Passwortpruefung via Slug ----------
create or replace function public.verify_wedding_password_by_slug(p_slug text, p_password text)
returns boolean language sql security definer set search_path = public as $$
  select exists (
    select 1 from public.weddings
    where slug = p_slug and password_hash = crypt(p_password, password_hash)
  );
$$;

-- ---------- RPC: Admin-Registrierung ----------
create or replace function public.admin_register(p_username text, p_email text, p_password text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
begin
  insert into public.admins (username, email, password_hash)
  values (p_username, p_email, crypt(p_password, gen_salt('bf')))
  returning id into v_id;
  return v_id;
end;
$$;

-- ---------- RPC: Admin-Login ----------
create or replace function public.admin_login(p_username text, p_password text)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_admin public.admins;
begin
  select * into v_admin from public.admins
  where username = p_username and password_hash = crypt(p_password, password_hash);
  if not found then return null; end if;
  return json_build_object('id', v_admin.id, 'username', v_admin.username, 'email', v_admin.email);
end;
$$;

-- ---------- RPC: Username verfuegbar? ----------
create or replace function public.check_username_available(p_username text)
returns boolean language sql security definer set search_path = public as $$
  select not exists (select 1 from public.admins where lower(username) = lower(p_username));
$$;

-- ---------- RPC: Slug verfuegbar? ----------
create or replace function public.check_slug_available(p_slug text)
returns boolean language sql security definer set search_path = public as $$
  select not exists (select 1 from public.weddings where slug = p_slug);
$$;

-- ---------- RPC: Hochzeit erstellen ----------
create or replace function public.create_wedding(
  p_slug text, p_name text, p_couple_a text, p_couple_b text,
  p_date date, p_shoot_start timestamptz, p_shoot_end timestamptz,
  p_reveal_at timestamptz, p_voting_enabled boolean, p_voting_ends_at timestamptz,
  p_max_shots int, p_filter_id text, p_color_scheme text,
  p_password text, p_owner_id uuid
)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
begin
  insert into public.weddings (
    slug, name, couple_a, couple_b, date,
    shoot_start, shoot_end, reveal_at,
    voting_enabled, voting_ends_at,
    max_shots, filter_id, color_scheme,
    password_hash, owner_id
  ) values (
    p_slug, p_name, p_couple_a, p_couple_b, p_date,
    p_shoot_start, p_shoot_end, p_reveal_at,
    p_voting_enabled, p_voting_ends_at,
    p_max_shots, p_filter_id, p_color_scheme,
    crypt(p_password, gen_salt('bf')), p_owner_id
  ) returning id into v_id;

  insert into public.wedding_admins (wedding_id, admin_id)
  values (v_id, p_owner_id);

  return v_id;
end;
$$;

-- ---------- Album-Vorschau ----------
create or replace function public.list_albums(p_wedding_id uuid)
>>>>>>> cef553901371bf220774623f8c092096541acc20
returns table (guest_name text, cover_path text, count bigint)
language sql security definer set search_path = public as $$
  select distinct on (p.guest_name)
         p.guest_name,
         first_value(p.storage_path) over (partition by p.guest_name order by p.created_at) as cover_path,
         count(*) over (partition by p.guest_name) as count
  from public.photos p
<<<<<<< HEAD
  where p.event_id = p_event_id
=======
  where p.wedding_id = p_wedding_id
>>>>>>> cef553901371bf220774623f8c092096541acc20
  order by p.guest_name, p.created_at;
$$;

-- ---------- Voting-Auszaehlung ----------
create or replace view public.vote_counts as
  select photo_id, count(*)::int as votes from public.votes group by photo_id;

-- ============================================================
--  Row Level Security
-- ============================================================
<<<<<<< HEAD
alter table public.events enable row level security;
=======
alter table public.admins enable row level security;
alter table public.weddings enable row level security;
alter table public.wedding_admins enable row level security;
>>>>>>> cef553901371bf220774623f8c092096541acc20
alter table public.guests enable row level security;
alter table public.photos enable row level security;
alter table public.votes  enable row level security;

<<<<<<< HEAD
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
=======
-- Admins: nur via RPC-Funktionen (security definer)
create policy "admins deny all" on public.admins for all to anon using (false);

-- Weddings: oeffentlich lesbar (fuer Slug-Lookup)
-- password_hash wird ueber eine View ausgeblendet, da RLS keine Spaltenbeschraenkung bietet
create policy "weddings read" on public.weddings for select to anon using (true);

-- View ohne password_hash fuer Client-Zugriff
create or replace view public.weddings_public as
  select id, slug, name, couple_a, couple_b, date,
         shoot_start, shoot_end, reveal_at,
         voting_enabled, voting_ends_at,
         max_shots, filter_id, color_scheme, created_at
  from public.weddings;

-- Wedding-Admins: nur via RPC
create policy "wedding_admins deny" on public.wedding_admins for all to anon using (false);

-- Guests
create policy "guests insert" on public.guests for insert to anon with check (true);
create policy "guests read"   on public.guests for select to anon using (true);

-- Photos
create policy "photos insert" on public.photos for insert to anon with check (true);
create policy "photos read after reveal" on public.photos for select to anon using (
  exists (select 1 from public.weddings w where w.id = photos.wedding_id and now() >= w.reveal_at)
);

-- Votes
create policy "votes insert" on public.votes for insert to anon with check (
  exists (select 1 from public.weddings w where w.id = votes.wedding_id and now() >= w.reveal_at)
>>>>>>> cef553901371bf220774623f8c092096541acc20
);
create policy "votes read"   on public.votes for select to anon using (true);
create policy "votes delete" on public.votes for delete to anon using (true);

-- Storage-Bucket
insert into storage.buckets (id, name, public) values ('photos','photos',true)
on conflict (id) do nothing;
create policy "photos upload" on storage.objects for insert to anon with check (bucket_id = 'photos');
<<<<<<< HEAD

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
=======
>>>>>>> cef553901371bf220774623f8c092096541acc20
