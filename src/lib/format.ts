// Deutsche Datums-/Zeitformatierung für "zuletzt geändert".
const dtf = new Intl.DateTimeFormat('de-DE', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return `${dtf.format(d)} Uhr`;
}

const df = new Intl.DateTimeFormat('de-DE', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

export function formatDate(value: Date = new Date()): string {
  return df.format(value);
}

// Dauer als "< 1 min" / "12 min" / "1 h 05 min".
export function formatDuration(ms: number): string {
  const totalMin = Math.floor(Math.max(0, ms) / 60_000);
  if (totalMin < 1) return '< 1 min';
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h > 0 ? `${h} h ${String(m).padStart(2, '0')} min` : `${m} min`;
}

// Für PDF-Dateinamen (Browser verwenden document.title beim „Als PDF
// speichern"): Umlaute umschreiben, alles andere auf A-Za-z0-9 und "-" eindampfen.
export function sanitizeForFilename(s: string): string {
  return s
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/Ä/g, 'Ae')
    .replace(/Ö/g, 'Oe')
    .replace(/Ü/g, 'Ue')
    .replace(/ß/g, 'ss')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

// Relative Zeitangabe für den Kollegin-Kommentar: "gerade eben" / "vor 12 min".
export function formatRelativeTime(
  value: string | null | undefined,
  now: number = Date.now(),
): string {
  if (!value) return 'gerade eben';
  const t = new Date(value).getTime();
  if (Number.isNaN(t)) return 'gerade eben';
  const diff = now - t;
  if (diff < 60_000) return 'gerade eben';
  return `vor ${formatDuration(diff)}`;
}

// Bearbeitungszeit eines Tickets: vom ersten Öffnen (opened_at) bis zum letzten
// Speichern (submitted_at) – oder bis jetzt, solange noch nie gespeichert wurde.
export function ticketElapsed(
  openedAt: string | null | undefined,
  submittedAt: string | null | undefined,
  now: number = Date.now(),
): { label: string; running: boolean } | null {
  if (!openedAt) return null;
  const start = new Date(openedAt).getTime();
  if (Number.isNaN(start)) return null;
  const end = submittedAt ? new Date(submittedAt).getTime() : now;
  if (Number.isNaN(end)) return null;
  return { label: formatDuration(end - start), running: !submittedAt };
}
