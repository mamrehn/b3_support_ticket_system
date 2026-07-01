-- =====================================================================
-- DataSol IT-Support – Serverseitige Auth & Schreibschutz (AKTIV, README §10)
-- =====================================================================
-- Reihenfolge im SQL Editor: 1) schema.sql  2) seed.sql  3) rpc-auth.sql
--
-- Alle Passwörter liegen in der DB-Tabelle `teams` (NICHT im Frontend-Bundle).
-- Schreibzugriffe laufen ausschließlich über SECURITY-DEFINER-RPCs, die das
-- Passwort serverseitig prüfen. Direktes anon-UPDATE auf `tickets` wird durch
-- Entfernen der Update-Policy unterbunden. Lesen (SELECT) bleibt offen, damit
-- Board + Realtime weiter funktionieren.
--
-- Re-runnable (idempotent) – auch über eine ältere Version dieser Datei.
-- ---------------------------------------------------------------------

-- 1) teams-Tabelle (falls noch nicht vorhanden) + Rollen-Spalte ----------
create table if not exists teams (
  username  text primary key,            -- 'user1' .. 'user7', 'teacher'
  password  text not null,
  ticket_id int references tickets(id),  -- NULL bei der Lehrkraft
  role      text not null default 'team' -- 'team' | 'teacher'
);

-- Falls die Tabelle aus einer früheren Version stammt: Spalten nachziehen.
alter table teams add column if not exists role text not null default 'team';
alter table teams alter column ticket_id drop not null;

-- WICHTIG: RLS an, KEINE Policy -> kein anon-/authenticated-Client liest die
-- Passwörter. Die RPCs unten sind SECURITY DEFINER und umgehen RLS.
alter table teams enable row level security;

-- 2) Stammdaten -----------------------------------------------------------
-- Beispiel mit echten Passwörtern befüllen/anpassen und EINMAL ausführen.
-- (Auskommentiert lassen, falls die teams-Zeilen bereits eingetragen sind –
--  insbesondere die teacher-Zeile nicht vergessen!)
--
-- insert into teams (username, password, role, ticket_id) values
--   ('user1','rot-3148',  'team', 1),
--   ('user2','blau-7290', 'team', 2),
--   ('user3','gruen-5063','team', 3),
--   ('user4','gelb-8217', 'team', 4),
--   ('user5','lila-4905', 'team', 5),
--   ('user6','grau-6734', 'team', 6),
--   ('user7','tuerkis-3382','team', 7),
--   ('teacher','datasol-lehrer-2026','teacher', null)
-- on conflict (username) do update
--   set password = excluded.password,
--       role      = excluded.role,
--       ticket_id = excluded.ticket_id;

-- 3) Login-Prüfung --------------------------------------------------------
-- Gibt bei gültigen Daten genau eine Zeile (username, role, ticket_id) zurück,
-- sonst keine. Das Frontend behandelt "keine Zeile" als ungültige Anmeldung.
create or replace function app_login(p_username text, p_password text)
returns table(username text, role text, ticket_id int)
language sql
security definer
set search_path = public
as $$
  select t.username, t.role, t.ticket_id
  from teams t
  where t.username = p_username and t.password = p_password;
$$;

-- 4) Einreichung speichern / Musterlösung freischalten --------------------
-- Team: nur das eigene Ticket. Lehrkraft: jedes Ticket.
-- Alte Signatur (ohne p_path) entfernen, sonst entsteht ein mehrdeutiger Overload.
drop function if exists submit_ticket(text, text, int, text, text[], text, text, text, boolean);

create or replace function submit_ticket(
  p_username   text,
  p_password   text,
  p_ticket_id  int,
  p_layer      text,
  p_tools      text[],
  p_problem    text,
  p_solution   text,
  p_trace      text,
  p_path       text[],
  p_reveal     boolean
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role   text;
  v_ticket int;
begin
  select role, ticket_id into v_role, v_ticket
  from teams
  where username = p_username and password = p_password;

  if v_role is null then
    raise exception 'Anmeldedaten ungültig';
  end if;

  -- Teams dürfen nur ihr eigenes Ticket schreiben; die Lehrkraft jedes.
  if v_role <> 'teacher' and v_ticket is distinct from p_ticket_id then
    raise exception 'Kein Schreibrecht für dieses Ticket';
  end if;

  update tickets set
    submitted_layer    = p_layer,
    submitted_tools    = coalesce(p_tools, '{}'),
    submitted_problem  = p_problem,
    submitted_solution = p_solution,
    trace_note         = p_trace,
    diagnosis_path     = coalesce(p_path, '{}'),
    revealed           = revealed or p_reveal,  -- einmal freigeschaltet, bleibt es bis Reset
    submitted_by       = p_username,
    submitted_at       = now(),
    opened_at          = coalesce(opened_at, now()) -- Fallback, falls open_ticket nie lief
  where id = p_ticket_id;
end $$;

-- 4b) Startzeit setzen: erster Aufruf des Tickets durch das zuständige Team.
-- Nur das Team startet die Uhr; Lehrkraft und fremde Teams lesen nur (kein Fehler).
create or replace function open_ticket(
  p_username  text,
  p_password  text,
  p_ticket_id int
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role   text;
  v_ticket int;
begin
  select role, ticket_id into v_role, v_ticket
  from teams
  where username = p_username and password = p_password;

  if v_role is null then
    raise exception 'Anmeldedaten ungültig';
  end if;

  if v_role <> 'team' or v_ticket is distinct from p_ticket_id then
    return; -- kein eigenes Ticket -> Uhr nicht starten
  end if;

  update tickets set opened_at = now()
  where id = p_ticket_id and opened_at is null; -- nur der ERSTE Aufruf zählt
end $$;

-- 5) Zurücksetzen (nur Lehrkraft) ----------------------------------------
create or replace function reset_tickets(p_username text, p_password text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
begin
  select role into v_role
  from teams
  where username = p_username and password = p_password;

  if v_role is distinct from 'teacher' then
    raise exception 'Nur die Lehrkraft darf zurücksetzen';
  end if;

  update tickets set
    submitted_layer    = null,
    submitted_tools    = '{}',
    submitted_problem  = null,
    submitted_solution = null,
    trace_note         = null,
    diagnosis_path     = '{}',
    revealed           = false,
    submitted_by       = null,
    submitted_at       = null,
    opened_at          = null
  where id >= 1;
end $$;

-- 6) Ausführungsrechte für die RPCs (Aufruf durch das Frontend) -----------
grant execute on function app_login(text, text) to anon, authenticated;
grant execute on function submit_ticket(text, text, int, text, text[], text, text, text, text[], boolean) to anon, authenticated;
grant execute on function open_ticket(text, text, int) to anon, authenticated;
grant execute on function reset_tickets(text, text) to anon, authenticated;

-- 7) RLS schärfen: direktes anon-UPDATE verbieten – nur die RPCs schreiben.
--    (SELECT-Policy "read all" aus schema.sql bleibt -> Board/Realtime ok.)
drop policy if exists "update all" on tickets;
