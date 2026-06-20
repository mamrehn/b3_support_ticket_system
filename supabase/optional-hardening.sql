-- =====================================================================
-- OPTIONAL (README §10) – etwas mehr Schreibschutz ohne echte Accounts
-- =====================================================================
-- Verschiebt Schreibzugriffe hinter eine RPC, die das Team-Passwort
-- SERVERSEITIG prüft. Passwörter liegen dann in der DB statt im Bundle.
-- Nur ausführen, wenn diese Härtung gewünscht ist. Erfordert eine
-- Anpassung im Frontend (Schreiben via rpc('submit_ticket', ...)) –
-- standardmäßig NICHT aktiviert.
-- ---------------------------------------------------------------------

create table if not exists teams (
  username text primary key,        -- 'team1' .. 'team6'
  password text not null,
  ticket_id int not null references tickets(id)
);

-- Beispieldaten – echte Passwörter eintragen:
-- insert into teams (username, password, ticket_id) values
--   ('team1','...',1), ('team2','...',2), ('team3','...',3),
--   ('team4','...',4), ('team5','...',5), ('team6','...',6);

create or replace function submit_ticket(
  p_username text,
  p_password text,
  p_ticket_id int,
  p_layer text,
  p_tools text[],
  p_problem text,
  p_solution text,
  p_trace text,
  p_reveal boolean
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ticket int;
begin
  select ticket_id into v_ticket from teams
   where username = p_username and password = p_password;

  if v_ticket is null then
    raise exception 'Anmeldedaten ungültig';
  end if;
  if v_ticket <> p_ticket_id then
    raise exception 'Kein Schreibrecht für dieses Ticket';
  end if;

  update tickets set
    submitted_layer    = p_layer,
    submitted_tools    = coalesce(p_tools, '{}'),
    submitted_problem  = p_problem,
    submitted_solution = p_solution,
    trace_note         = p_trace,
    revealed           = revealed or p_reveal,
    submitted_by       = p_username,
    submitted_at       = now()
  where id = p_ticket_id;
end $$;

-- RLS verschärfen: direktes update verbieten, nur die Funktion schreibt.
-- drop policy if exists "update all" on tickets;
