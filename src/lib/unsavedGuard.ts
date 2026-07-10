// Ungespeicherte Änderungen im Ticket-Formular: Navigation (Zurück-Link,
// Topbar, Abmelden) fragt vorher nach, statt Eingaben stillschweigend zu
// verwerfen. Bewusst KEIN Autosave – Speichern soll eine bewusste Entscheidung
// bleiben (aktiviert u. a. das Weiterleiten an den 2nd-Level-Support).
//
// Tab schließen / Neuladen deckt der beforeunload-Handler im TicketDetail ab.

let hasUnsaved = false;

export function setUnsavedChanges(value: boolean): void {
  hasUnsaved = value;
}

// true = Navigation fortsetzen (nichts ungespeichert oder Nutzer bestätigt).
export function confirmDiscardUnsaved(): boolean {
  if (!hasUnsaved) return true;
  return window.confirm(
    'Es gibt ungespeicherte Änderungen an eurer Diagnose. Wirklich verlassen? Die Eingaben gehen sonst verloren.',
  );
}
