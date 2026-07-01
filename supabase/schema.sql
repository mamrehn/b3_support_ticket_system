-- =====================================================================
-- DataSol IT-Support – Datenbankschema (Supabase / Postgres)
-- =====================================================================
-- Im Supabase-Projekt unter "SQL Editor" ausführen.
-- Reihenfolge: 1) schema.sql  2) seed.sql
-- Danach prüfen: Database -> Replication -> Realtime ist für "tickets" aktiv.
-- ---------------------------------------------------------------------

create table if not exists tickets (
  id                 int primary key,
  title              text not null,
  reporter_text      text not null,          -- die Beschwerde des Anwenders (deutsch)
  concept_hint       text,                   -- "Was du dafür wissen musst" (v.a. L7-Tickets)
  filius_deeplink    text,                   -- URL in das Filius-Szenario
  correct_layer      text not null,          -- Musterlösung: Schicht
  correct_tools      text[] not null default '{}',
  model_problem      text not null,
  model_solution     text not null,
  -- Schülereingabe (wird beim Zurücksetzen geleert):
  submitted_layer    text,
  submitted_tools    text[] default '{}',
  submitted_problem  text,
  submitted_solution text,
  trace_note         text,                   -- optionaler Wireshark-Trace (Link/Notiz)
  diagnosis_path     text[] not null default '{}', -- Antwort-Keys des Ablaufdiagramms (src/lib/flowchart.ts)
  revealed           boolean not null default false,
  submitted_by       text,
  submitted_at       timestamptz,
  opened_at          timestamptz             -- erster Aufruf durch das zuständige Team (Startzeit)
);

-- Bestehende Installationen: neue Spalten nachziehen (idempotent).
alter table tickets add column if not exists diagnosis_path text[] not null default '{}';
alter table tickets add column if not exists opened_at timestamptz;

alter table tickets enable row level security;

-- Jeder (anon) darf alle Tickets lesen ...
drop policy if exists "read all" on tickets;
create policy "read all" on tickets for select using (true);

-- ... und jedes Ticket aktualisieren. Der Schreibschutz pro Team ist
-- bewusst nur clientseitig (siehe README §2). Optionale Härtung: §10.
drop policy if exists "update all" on tickets;
create policy "update all" on tickets for update using (true) with check (true);

-- Kein insert/delete für anon – die Ticket-Zeilen werden einmalig per seed.sql angelegt.

-- Realtime aktivieren, damit die Lehrer-Übersicht live mitläuft.
do $$
begin
  alter publication supabase_realtime add table tickets;
exception
  when duplicate_object then null; -- bereits hinzugefügt
end $$;
