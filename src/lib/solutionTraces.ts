// Optionale Referenz-Screenshots der erfahrenen Kollegin – pro Ticket.
// Diese zeigen z. B., wie der Wireshark-Trace zur korrekten Lösung aussieht.
// Sie werden im Kollegin-Kommentar NUR angezeigt, wenn für das Ticket ein Bild
// hinterlegt ist (sonst erscheint nichts).
//
// So fügst du ein Bild hinzu (zur Build-Zeit gebündelt):
//   1) Bilddatei unter src/assets/solution-traces/ ablegen, z. B. ticket-4.png
//   2) hier importieren und der Ticket-ID zuordnen:
//        import trace4 from '../assets/solution-traces/ticket-4.png';
//        export const SOLUTION_TRACES: Record<number, string> = { 4: trace4 };
//
// Der Import liefert eine URL (Vite-Asset-Handling). Solange die Map leer ist,
// wird kein Referenz-Screenshot angezeigt.

export const SOLUTION_TRACES: Record<number, string> = {
  // Hier Einträge ergänzen, z. B.  4: trace4,
};

export function solutionTraceFor(ticketId: number): string | undefined {
  return SOLUTION_TRACES[ticketId];
}
