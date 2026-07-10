-- =====================================================================
-- DataSol IT-Support – Serverseitige Auth, Klassen-Sets & Schreibschutz
-- =====================================================================
-- Reihenfolge im SQL Editor: 1) schema.sql  2) seed.sql  3) rpc-auth.sql
--
-- Mehrklassen-Version: create_class() erzeugt ein komplettes Klassen-Set
-- (Klassen-Code + 8 Konten + 7 Tickets) in Selbstbedienung – KEIN manuelles
-- SQL pro Lehrkraft mehr. Alle Passwörter liegen in der DB-Tabelle `teams`
-- (NICHT im Frontend-Bundle). Schreibzugriffe laufen ausschließlich über
-- SECURITY-DEFINER-RPCs, die Klassen-Code bzw. class_id + Benutzername +
-- Passwort serverseitig prüfen.
--
-- Re-runnable (idempotent) – auch über die alte Einzelklassen-Version.
-- ---------------------------------------------------------------------

-- Alte Funktions-Signaturen der Einzelklassen-Version entfernen.
drop function if exists app_login(text, text);
drop function if exists submit_ticket(text, text, int, text, text[], text, text, text, boolean);
drop function if exists submit_ticket(text, text, int, text, text[], text, text, text, text[], boolean);
drop function if exists open_ticket(text, text, int);
drop function if exists reset_tickets(text, text);

-- 1) Zufalls-Codes -------------------------------------------------------
-- Nur eindeutig unterscheidbare Großbuchstaben (ohne I und O, verwechselbar
-- mit 1/0) – 24 Zeichen.
-- Team-Passwörter: 4 Zeichen (bewusst kurz zum Abtippen durch Schüler:innen;
--   24^4 ≈ 332.000 – skriptbares Durchprobieren wäre möglich, aber auf einem
--   Schülerkonto gibt es nichts zu holen; akzeptiert).
-- Lehrkraft-Passwort: 6 Zeichen (24^6 ≈ 191 Mio.) – dieses Konto kann
--   zurücksetzen und alle Zugangsdaten abrufen und ist mit dem bekannten
--   Benutzernamen 'teacher' sonst das lohnendste Brute-Force-Ziel.
-- Klassen-Code: 4 Zeichen, steckt ohnehin im QR-/Link und ist kein Geheimnis.
create or replace function gen_code(p_len int)
returns text
language sql
volatile
set search_path = public
as $$
  select string_agg(
    substr('ABCDEFGHJKLMNPQRSTUVWXYZ', 1 + floor(random() * 24)::int, 1), ''
  )
  from generate_series(1, p_len);
$$;
-- bewusst KEIN grant – nur intern von den RPCs genutzt.
revoke all on function gen_code(int) from public, anon, authenticated;

-- 2) Klassen-Set erstellen (öffentlich – der Sinn des geteilten Links) ----
-- Legt Klasse, 8 Konten (user1..user7 + teacher) und 7 Tickets (Kopie der
-- Vorlagen) an und gibt Klassen-Code + alle Zugangsdaten EINMAL zurück.
-- Die Lehrkraft kann sie später per list_credentials() erneut abrufen.
-- Missbrauchsbremse: max. 20 neue Klassen pro Stunde, max. 500 insgesamt.
create or replace function create_class(p_label text default null)
returns table(class_code text, username text, password text, role text, ticket_id int)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_class_id uuid;
  v_code     text;
begin
  if (select count(*) from classes where created_at > now() - interval '1 hour') >= 20 then
    raise exception 'Es wurden gerade viele Klassen-Sets erstellt – bitte in einer Stunde erneut versuchen.';
  end if;
  if (select count(*) from classes) >= 500 then
    raise exception 'Maximale Anzahl an Klassen-Sets erreicht – bitte den Betreiber kontaktieren.';
  end if;
  if not exists (select from ticket_templates) then
    raise exception 'Keine Ticket-Vorlagen gefunden – bitte zuerst seed.sql ausführen.';
  end if;

  -- Eindeutigen Klassen-Code würfeln. Der UNIQUE-Index auf classes.code ist
  -- die Wahrheit: Kollisionen mit bestehenden (noch nicht aufgeräumten)
  -- Klassen – auch bei zwei GLEICHZEITIGEN Aufrufen – lösen unique_violation
  -- aus und es wird einfach neu gewürfelt. (24^4 ≈ 332.000 Codes bei max.
  -- 500 Klassen -> praktisch immer der erste Wurf.)
  loop
    v_code := gen_code(4);
    begin
      insert into classes (code, label)
      values (v_code, nullif(trim(coalesce(p_label, '')), ''))
      returning classes.id into v_class_id;
      exit;
    exception when unique_violation then
      null; -- Code schon vergeben -> neuer Versuch
    end;
  end loop;

  insert into teams (class_id, username, password, role, ticket_id)
  select v_class_id, 'user' || n, gen_code(4), 'team', n
  from generate_series(1, 7) as n;

  -- Lehrkraft bekommt 6 Zeichen (siehe §1) – sie tippt es nur einmal.
  insert into teams (class_id, username, password, role, ticket_id)
  values (v_class_id, 'teacher', gen_code(6), 'teacher', null);

  insert into tickets (class_id, id, title, reporter_text, concept_hint, filius_deeplink,
                       correct_layer, correct_tools, model_problem, model_solution)
  select v_class_id, tt.id, tt.title, tt.reporter_text, tt.concept_hint, tt.filius_deeplink,
         tt.correct_layer, tt.correct_tools, tt.model_problem, tt.model_solution
  from ticket_templates tt;

  return query
    select v_code, t.username, t.password, t.role, t.ticket_id
    from teams t
    where t.class_id = v_class_id
    order by t.ticket_id nulls last;
end $$;

-- 3) Login-Prüfung --------------------------------------------------------
-- Klassen-Code + Benutzername + Passwort. Gibt bei gültigen Daten genau eine
-- Zeile zurück, sonst keine. Eingaben werden normalisiert (Code/Passwort
-- bestehen nur aus Großbuchstaben -> Vergleich unabhängig von Groß-/Klein-
-- schreibung; spart Support im Klassenzimmer, kostet keine Sicherheit).
create or replace function app_login(p_class_code text, p_username text, p_password text)
returns table(class_id uuid, class_code text, class_label text, username text, role text, ticket_id int)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
    select c.id, c.code, c.label, t.username, t.role, t.ticket_id
    from teams t
    join classes c on c.id = t.class_id
    where c.code = upper(trim(p_class_code))
      and t.username = lower(trim(p_username))
      and t.password = upper(trim(p_password));

  if found then
    update classes c set last_activity = now()
    where c.code = upper(trim(p_class_code));
  end if;
end $$;

-- interne Hilfe: Konto einer Klasse prüfen; gibt (role, ticket_id) zurück.
-- (drop vorab: CREATE OR REPLACE scheitert, falls sich OUT-Parameter ändern.)
drop function if exists auth_team(uuid, text, text);
create function auth_team(p_class_id uuid, p_username text, p_password text,
                                     out o_role text, out o_ticket int)
language plpgsql
security definer
set search_path = public
as $$
begin
  select t.role, t.ticket_id into o_role, o_ticket
  from teams t
  where t.class_id = p_class_id
    and t.username = lower(trim(p_username))
    and t.password = upper(trim(p_password));

  if o_role is null then
    raise exception 'Anmeldedaten ungültig';
  end if;
end $$;
revoke all on function auth_team(uuid, text, text) from public, anon, authenticated;

-- 4) Einreichung speichern / Musterlösung freischalten --------------------
-- Team: nur das eigene Ticket der eigenen Klasse. Lehrkraft: jedes Ticket
-- der eigenen Klasse.
create or replace function submit_ticket(
  p_class_id   uuid,
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
  select o_role, o_ticket into v_role, v_ticket from auth_team(p_class_id, p_username, p_password);

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
    submitted_by       = lower(trim(p_username)),
    submitted_at       = now(),
    opened_at          = coalesce(opened_at, now()) -- Fallback, falls open_ticket nie lief
  where class_id = p_class_id and id = p_ticket_id;

  update classes set last_activity = now() where id = p_class_id;
end $$;

-- 4b) Startzeit setzen: erster Aufruf des Tickets durch das zuständige Team.
-- Nur das Team startet die Uhr; Lehrkraft und fremde Teams lesen nur (kein Fehler).
create or replace function open_ticket(
  p_class_id  uuid,
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
  select o_role, o_ticket into v_role, v_ticket from auth_team(p_class_id, p_username, p_password);

  if v_role <> 'team' or v_ticket is distinct from p_ticket_id then
    return; -- kein eigenes Ticket -> Uhr nicht starten
  end if;

  update tickets set opened_at = now()
  where class_id = p_class_id and id = p_ticket_id and opened_at is null; -- nur der ERSTE Aufruf

  update classes set last_activity = now() where id = p_class_id;
end $$;

-- 5) Zurücksetzen (nur Lehrkraft, nur die eigene Klasse) -------------------
create or replace function reset_tickets(p_class_id uuid, p_username text, p_password text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role   text;
  v_ticket int;
begin
  select o_role, o_ticket into v_role, v_ticket from auth_team(p_class_id, p_username, p_password);

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
  where class_id = p_class_id;

  update classes set last_activity = now() where id = p_class_id;
end $$;

-- 5b) Zugangsdaten erneut abrufen (nur Lehrkraft, nur die eigene Klasse) ---
-- Für den Fall, dass der Zettel weg ist oder die Erstellungsseite geschlossen
-- wurde. (Passwörter liegen ohnehin im Klartext in der DB – das ist das
-- bestehende, bewusst einfache Modell dieses Unterrichtswerkzeugs.)
create or replace function list_credentials(p_class_id uuid, p_username text, p_password text)
returns table(class_code text, class_label text, username text, password text, role text, ticket_id int)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role   text;
  v_ticket int;
begin
  select o_role, o_ticket into v_role, v_ticket from auth_team(p_class_id, p_username, p_password);

  if v_role is distinct from 'teacher' then
    raise exception 'Nur die Lehrkraft darf die Zugangsdaten abrufen';
  end if;

  return query
    select c.code, c.label, t.username, t.password, t.role, t.ticket_id
    from teams t
    join classes c on c.id = t.class_id
    where t.class_id = p_class_id
    order by t.ticket_id nulls last;
end $$;

-- 6) Ausführungsrechte für die RPCs (Aufruf durch das Frontend) -----------
grant execute on function create_class(text) to anon, authenticated;
grant execute on function app_login(text, text, text) to anon, authenticated;
grant execute on function submit_ticket(uuid, text, text, int, text, text[], text, text, text, text[], boolean) to anon, authenticated;
grant execute on function open_ticket(uuid, text, text, int) to anon, authenticated;
grant execute on function reset_tickets(uuid, text, text) to anon, authenticated;
grant execute on function list_credentials(uuid, text, text) to anon, authenticated;

-- 7) Aufräumjob: Klassen ohne Aktivität seit 100 Tagen löschen -------------
-- (per ON DELETE CASCADE verschwinden auch Konten + Tickets inkl. der teuren
-- Screenshot-Spalten). Läuft nachts um 3:15 UTC. Falls pg_cron im Projekt
-- nicht verfügbar ist, wird nur ein Hinweis ausgegeben – dann gelegentlich
-- von Hand löschen:  delete from classes where last_activity < now() - interval '100 days';
do $$
begin
  begin
    create extension if not exists pg_cron;
  exception when others then
    raise notice 'pg_cron nicht verfügbar (%) – Aufräumjob NICHT eingerichtet.', sqlerrm;
    return;
  end;

  -- cron.schedule mit Job-Namen ist ein Upsert (ersetzt einen bestehenden Job
  -- gleichen Namens). Direktes DML auf cron.job scheitert auf Supabase an
  -- fehlenden Rechten der postgres-Rolle – daher nur über die Funktion.
  begin
    perform cron.schedule(
      'datasol-cleanup-classes',
      '15 3 * * *',
      $job$ delete from public.classes where last_activity < now() - interval '100 days' $job$
    );
  exception when others then
    raise notice 'Aufräumjob konnte nicht eingerichtet werden (%) – bei Bedarf von Hand löschen.', sqlerrm;
  end;
end $$;
