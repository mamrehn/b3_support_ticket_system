import { supabase } from './supabase';

export interface SubmissionInput {
  submitted_layer: string | null;
  submitted_tools: string[];
  submitted_problem: string | null;
  submitted_solution: string | null;
  trace_note: string | null;
}

// Speichert die Schülereingabe eines Tickets und vermerkt Bearbeiter/Zeit.
// `reveal=true` schaltet zusätzlich die Musterlösung frei ("weiterleiten").
export async function saveSubmission(
  ticketId: number,
  input: SubmissionInput,
  submittedBy: string,
  reveal: boolean,
): Promise<void> {
  const patch: Record<string, unknown> = {
    ...input,
    submitted_tools: input.submitted_tools ?? [],
    submitted_by: submittedBy,
    submitted_at: new Date().toISOString(),
  };
  if (reveal) patch.revealed = true;

  const { error } = await supabase.from('tickets').update(patch).eq('id', ticketId);
  if (error) throw new Error(error.message);
}

// Lehrer-Reset: leert NUR die Schülereingaben aller Tickets, Vorlagen bleiben.
export async function resetAllSubmissions(): Promise<void> {
  const { error } = await supabase
    .from('tickets')
    .update({
      submitted_layer: null,
      submitted_tools: [],
      submitted_problem: null,
      submitted_solution: null,
      trace_note: null,
      revealed: false,
      submitted_by: null,
      submitted_at: null,
    })
    .gte('id', 1); // Filter ist bei UPDATE erforderlich; trifft alle Tickets.
  if (error) throw new Error(error.message);
}
