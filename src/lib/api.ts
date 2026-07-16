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
// (class_id + Passwort aus der Session). `reveal=true` schaltet die Muster-
// lösung frei. Der Server setzt submitted_by/submitted_at und erzwingt die
// Schreibrechte innerhalb der eigenen Klasse.
export async function saveSubmission(
  ticketId: number,
  input: SubmissionInput,
  session: Session,
  reveal: boolean,
): Promise<void> {
  const { error } = await supabase.rpc('submit_ticket', {
    p_class_id: session.classId,
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
    p_class_id: session.classId,
    p_username: session.username,
    p_password: session.password,
    p_ticket_id: ticketId,
  });
  if (error) throw new Error(error.message);
}

// Lehrer-Reset über die RPC reset_tickets (serverseitig auf role='teacher'
// geprüft). Leert die Schülereingaben der EIGENEN Klasse und bringt die
// Ticket-Inhalte auf den aktuellen Stand der Vorlagen (ticket_templates).
export async function resetAllSubmissions(session: Session): Promise<void> {
  const { error } = await supabase.rpc('reset_tickets', {
    p_class_id: session.classId,
    p_username: session.username,
    p_password: session.password,
  });
  if (error) throw new Error(error.message);
}

// --- Klassen-Sets (Selbstbedienung für Lehrkräfte) -------------------------

export interface ClassCredential {
  username: string;
  password: string;
  role: 'team' | 'teacher';
  ticketId: number | null;
}

export interface ClassSet {
  classCode: string;
  classLabel: string | null;
  credentials: ClassCredential[];
}

interface CredentialRow {
  class_code: string;
  class_label?: string | null;
  username: string;
  password: string;
  role: 'team' | 'teacher';
  ticket_id: number | null;
}

function toClassSet(rows: CredentialRow[], fallbackLabel: string | null): ClassSet {
  return {
    classCode: rows[0].class_code,
    classLabel: rows[0].class_label ?? fallbackLabel,
    credentials: rows.map((r) => ({
      username: r.username,
      password: r.password,
      role: r.role,
      ticketId: r.ticket_id,
    })),
  };
}

// Erstellt ein neues Klassen-Set (Klassen-Code + 8 Konten + 7 Tickets) und
// liefert alle Zugangsdaten zurück – öffentlich aufrufbar (geteilter Link),
// serverseitig ratenbegrenzt.
export async function createClass(label: string): Promise<ClassSet> {
  const { data, error } = await supabase.rpc('create_class', {
    p_label: label.trim() || null,
  });
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as CredentialRow[];
  if (rows.length === 0) throw new Error('Es wurden keine Zugangsdaten zurückgegeben.');
  return toClassSet(rows, label.trim() || null);
}

// Ruft die Zugangsdaten der eigenen Klasse erneut ab (nur Lehrkraft).
export async function fetchCredentials(session: Session): Promise<ClassSet> {
  const { data, error } = await supabase.rpc('list_credentials', {
    p_class_id: session.classId,
    p_username: session.username,
    p_password: session.password,
  });
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as CredentialRow[];
  if (rows.length === 0) throw new Error('Keine Zugangsdaten gefunden.');
  return toClassSet(rows, session.classLabel);
}
