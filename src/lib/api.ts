import { supabase } from './supabase';
import type { Session } from './auth';

export interface SubmissionInput {
  submitted_layer: string | null;
  submitted_tools: string[];
  submitted_problem: string | null;
  submitted_solution: string | null;
  trace_note: string | null;
  diagnosis_path: string[];
}

// Speichert die Einreichung über die serverseitig geprüfte RPC submit_ticket
// (Passwort aus der Session). `reveal=true` schaltet die Musterlösung frei.
// Der Server setzt submitted_by/submitted_at und erzwingt die Schreibrechte.
export async function saveSubmission(
  ticketId: number,
  input: SubmissionInput,
  session: Session,
  reveal: boolean,
): Promise<void> {
  const { error } = await supabase.rpc('submit_ticket', {
    p_username: session.username,
    p_password: session.password,
    p_ticket_id: ticketId,
    p_layer: input.submitted_layer,
    p_tools: input.submitted_tools ?? [],
    p_problem: input.submitted_problem,
    p_solution: input.submitted_solution,
    p_trace: input.trace_note,
    p_path: input.diagnosis_path ?? [],
    p_reveal: reveal,
  });
  if (error) throw new Error(error.message);
}

// Startet die Bearbeitungszeit: setzt tickets.opened_at beim ERSTEN Aufruf durch
// das zuständige Team (serverseitig geprüft; Lehrkraft/fremde Teams sind No-ops).
export async function openTicket(ticketId: number, session: Session): Promise<void> {
  const { error } = await supabase.rpc('open_ticket', {
    p_username: session.username,
    p_password: session.password,
    p_ticket_id: ticketId,
  });
  if (error) throw new Error(error.message);
}

// Lehrer-Reset über die RPC reset_tickets (serverseitig auf role='teacher' geprüft).
// Leert NUR die Schülereingaben aller Tickets, die Vorlagen bleiben erhalten.
export async function resetAllSubmissions(session: Session): Promise<void> {
  const { error } = await supabase.rpc('reset_tickets', {
    p_username: session.username,
    p_password: session.password,
  });
  if (error) throw new Error(error.message);
}
