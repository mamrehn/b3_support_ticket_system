// Eine Zeile der Tabelle `tickets` (siehe supabase/schema.sql).
export interface Ticket {
  id: number;
  title: string;
  reporter_text: string;
  concept_hint: string | null;
  filius_deeplink: string | null;
  correct_layer: string;
  correct_tools: string[];
  model_problem: string;
  model_solution: string;
  submitted_layer: string | null;
  submitted_tools: string[];
  submitted_problem: string | null;
  submitted_solution: string | null;
  trace_note: string | null;
  revealed: boolean;
  submitted_by: string | null;
  submitted_at: string | null;
}

export type TicketStatus = 'offen' | 'in_bearbeitung' | 'erledigt';

export const STATUS_LABEL: Record<TicketStatus, string> = {
  offen: 'Offen',
  in_bearbeitung: 'In Bearbeitung',
  erledigt: 'Erledigt',
};

// Status wird aus dem Datenstand abgeleitet (README §4.2):
//   Erledigt        -> revealed = true
//   In Bearbeitung  -> mind. ein Eingabefeld gefüllt
//   Offen           -> sonst
export function ticketStatus(t: Ticket): TicketStatus {
  if (t.revealed) return 'erledigt';
  const hasInput =
    !!t.submitted_layer ||
    (t.submitted_tools?.length ?? 0) > 0 ||
    !!t.submitted_problem ||
    !!t.submitted_solution ||
    !!t.trace_note;
  return hasInput ? 'in_bearbeitung' : 'offen';
}

// Die Felder, die "weiterleiten" verlangt (Schicht + ≥1 Werkzeug + Problem + Lösung).
export function isSubmissionComplete(t: {
  submitted_layer: string | null;
  submitted_tools: string[];
  submitted_problem: string | null;
  submitted_solution: string | null;
}): boolean {
  return (
    !!t.submitted_layer?.trim() &&
    (t.submitted_tools?.length ?? 0) > 0 &&
    !!t.submitted_problem?.trim() &&
    !!t.submitted_solution?.trim()
  );
}
