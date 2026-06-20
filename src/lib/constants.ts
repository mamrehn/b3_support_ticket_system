// Frontend-Konstanten (NICHT in der DB), siehe README §3.

// Die 7 OSI-Schichten als Dropdown-Optionen. Die Strings entsprechen exakt
// den Werten, die in tickets.correct_layer / submitted_layer gespeichert werden.
export const LAYERS = [
  'Schicht 1 – Bitübertragung',
  'Schicht 2 – Sicherung',
  'Schicht 3 – Vermittlung',
  'Schicht 4 – Transport',
  'Schicht 5 – Sitzung',
  'Schicht 6 – Darstellung',
  'Schicht 7 – Anwendung',
] as const;

export type Layer = (typeof LAYERS)[number];

// Werkzeug-Checkboxen: key (in correct_tools/submitted_tools gespeichert) -> deutsches Label.
export const TOOLS: { key: string; label: string }[] = [
  { key: 'ping', label: 'Ping' },
  { key: 'tracert', label: 'Tracert' },
  { key: 'ipconfig', label: 'ipconfig' },
  { key: 'arp', label: 'arp -a' },
  { key: 'nslookup', label: 'nslookup' },
  { key: 'wireshark', label: 'Wireshark (Trace)' },
  { key: 'connview', label: 'Verbindungsansicht / LED' },
  { key: 'browser', label: 'Browser-Aufruf' },
  { key: 'service', label: 'Dienststatus am Server' },
  { key: 'firewall', label: 'Firewall-Konfiguration' },
];

const TOOL_LABELS: Record<string, string> = Object.fromEntries(
  TOOLS.map((t) => [t.key, t.label]),
);

// key -> Label, mit Fallback auf den Key (falls die DB einen unbekannten Key enthält).
export function toolLabel(key: string): string {
  return TOOL_LABELS[key] ?? key;
}

export function toolLabels(keys: string[] | null | undefined): string[] {
  return (keys ?? []).map(toolLabel);
}
