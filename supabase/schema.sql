-- =====================================================================
-- DataSol IT-Support – Datenbankschema (Supabase / Postgres)
-- Mehrklassen-Version: Lehrkräfte erstellen sich ihr Klassen-Set selbst
-- über die App (Seite „Klassen-Set erstellen"). Ein Klassen-Set besteht aus
-- 1 Lehrer-Konto + 7 Team-Konten (user1..user7) + 7 Tickets und einem
-- Klassen-Code für den Login. Beliebig viele Klassen laufen unabhängig
-- und gleichzeitig.
-- =====================================================================
-- Im Supabase-Projekt unter "SQL Editor" ausführen.
-- Reihenfolge: 1) schema.sql  2) seed.sql  3) rpc-auth.sql
-- Danach prüfen: Database -> Replication -> Realtime ist für "tickets" aktiv.
-- ---------------------------------------------------------------------

-- EINMALIGE Migration von der Einzelklassen-Version: die alten Tabellen
-- (erkennbar am Fehlen von class_id) werden ersetzt – alte Zugangsdaten
-- verlieren ihre Gültigkeit (bewusste Entscheidung). Beim erneuten Ausführen
-- passiert hier nichts mehr, bestehende Klassen bleiben unangetastet.
do $$
begin
  if exists (select from information_schema.tables
             where table_schema = 'public' and table_name = 'tickets')
     and not exists (select from information_schema.columns
                     where table_schema = 'public' and table_name = 'tickets'
                       and column_name = 'class_id') then
    drop table tickets cascade;
  end if;
  if exists (select from information_schema.tables
             where table_schema = 'public' and table_name = 'teams')
     and not exists (select from information_schema.columns
                     where table_schema = 'public' and table_name = 'teams'
                       and column_name = 'class_id') then
    drop table teams cascade;
  end if;
end $$;

-- Vorlagen der 7 Übungs-Tickets (global; Inhalte siehe seed.sql).
-- create_class() kopiert sie in die Klassen-Tickets. Änderungen an den
-- Vorlagen wirken auf NEU erstellte Klassen sofort; bestehende Klassen
-- übernehmen sie erst, wenn die Lehrkraft zurücksetzt (reset_tickets
-- kopiert die Vorlagen-Inhalte erneut) – laufende Runden bleiben stabil.
create table if not exists ticket_templates (
  id              int primary key,          -- 1..7
  title           text not null,
  reporter_text   text not null,            -- die Beschwerde des Anwenders (deutsch)
  concept_hint    text,                     -- "Was du dafür wissen musst" (v.a. L4/L7-Tickets)
  filius_deeplink text,                     -- URL in das Filius-Szenario
  correct_layer   text not null,            -- Musterlösung: Schicht
  correct_tools   text[] not null default '{}',
  model_problem   text not null,
  model_solution  text not null
);

-- Ein Klassen-Set pro Lehrkraft (Selbstbedienung, siehe rpc-auth.sql §2).
create table if not exists classes (
  id            uuid primary key default gen_random_uuid(),
  code          text not null unique,       -- Klassen-Code für den Login, z. B. "QKZP"
  label         text,                       -- optional, z. B. "Klasse 8b"
  created_at    timestamptz not null default now(),
  last_activity timestamptz not null default now() -- Login/Speichern; Basis des Aufräumjobs
);

-- 8 Konten je Klasse: user1..user7 (je ein Ticket) + teacher.
create table if not exists teams (
  class_id  uuid not null references classes(id) on delete cascade,
  username  text not null,                  -- 'user1'..'user7', 'teacher'
  password  text not null,                  -- generiert: 6 Großbuchstaben ohne I/O
  role      text not null default 'team',   -- 'team' | 'teacher'
  ticket_id int,                            -- 1..7, NULL bei der Lehrkraft
  primary key (class_id, username)
);

-- 7 Tickets je Klasse: Kopie der Vorlage + Einreichung der Schülerteams.
create table if not exists tickets (
  class_id           uuid not null references classes(id) on delete cascade,
  id                 int not null,          -- Ticketnummer 1..7 innerhalb der Klasse
  title              text not null,
  reporter_text      text not null,
  concept_hint       text,
  filius_deeplink    text,
  correct_layer      text not null,
  correct_tools      text[] not null default '{}',
  model_problem      text not null,
  model_solution     text not null,
  -- Schülereingabe (wird beim Zurücksetzen geleert):
  submitted_layer    text,
  submitted_tools    text[] default '{}',
  submitted_problem  text,
  submitted_solution text,
  trace_note         text,                  -- optionaler Wireshark-Trace (Screenshot-Data-URL)
  diagnosis_path     text[] not null default '{}', -- Antwort-Keys des Ablaufdiagramms (src/lib/flowchart.ts)
  revealed           boolean not null default false,
  submitted_by       text,
  submitted_at       timestamptz,
  opened_at          timestamptz,           -- erster Aufruf durch das zuständige Team (Startzeit)
  primary key (class_id, id)
);

-- RLS: classes und teams sind komplett gesperrt (keine Policies) – niemand
-- liest Passwörter oder fremde Klassen-Codes. Zugriff nur über die
-- SECURITY-DEFINER-RPCs (rpc-auth.sql).
alter table classes enable row level security;
alter table teams   enable row level security;
alter table tickets enable row level security;

-- tickets: Lesen bleibt offen (Board + Realtime brauchen SELECT als anon).
-- BEKANNTE GRENZE: technisch kann damit jeder mit dem (öffentlichen) anon-Key
-- alle Tickets ALLER Klassen lesen – inkl. Musterlösungen vor der Freigabe.
-- Für den Unterrichtseinsatz akzeptiert (wie bisher); echte Abschottung würde
-- Supabase-Auth mit JWT-Claims erfordern.
drop policy if exists "read all" on tickets;
create policy "read all" on tickets for select using (true);

-- Kein insert/update/delete für anon – Schreiben läuft nur über die RPCs.
drop policy if exists "update all" on tickets;

-- Realtime aktivieren, damit die Lehrer-Übersicht live mitläuft.
do $$
begin
  alter publication supabase_realtime add table tickets;
exception
  when duplicate_object then null; -- bereits hinzugefügt
end $$;
