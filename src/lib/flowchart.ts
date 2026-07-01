// Das Ablaufdiagramm "Strukturierte Fehlersuche" aus info-sheet-troubleshooting.md,
// 1:1 als Datenstruktur: Rauten (Entscheidungen) und Endpunkte (Schicht + Maßnahme).
// Die Schüler beantworten Raute für Raute; die gewählten Antwort-Keys werden in
// tickets.diagnosis_path gespeichert und hier wieder zu einem Protokoll aufgelöst.

export interface FlowOption {
  key: string; // wird in diagnosis_path gespeichert
  label: string; // Kantenbeschriftung wie im Diagramm
  next: string; // id der nächsten Raute oder eines Endpunkts
}

export interface FlowDecision {
  id: string;
  question: string;
  check: string; // welche Schicht/welches Werkzeug diese Raute prüft
  options: FlowOption[];
}

export interface FlowResult {
  id: string;
  layerLabel: string; // Beschriftung des Endpunkts im Diagramm
  layers: string[]; // passende LAYERS-Werte (leer bei "Funktioniert")
  action: string; // Maßnahme laut Diagramm
}

export const FLOW_START = 'B';

export const FLOW_DECISIONS: Record<string, FlowDecision> = {
  B: {
    id: 'B',
    question: 'Ping zur Ziel-IP erfolgreich?',
    check: 'prüft Schicht 1–3 auf einmal · Werkzeug: ping',
    options: [
      { key: 'ja', label: 'Ja – Schicht 1–3 OK', next: 'D' },
      { key: 'nein', label: 'Nein', next: 'F' },
    ],
  },
  D: {
    id: 'D',
    question: 'Aufruf per Name möglich?',
    check: 'Schicht 7 · Werkzeug: Browser / nslookup',
    options: [
      { key: 'nein', label: 'Nein', next: 'L7a' },
      { key: 'ja', label: 'Ja', next: 'E' },
    ],
  },
  E: {
    id: 'E',
    question: 'Dienst bzw. Seite erreichbar?',
    check: 'Schicht 4/7 · Dienst läuft? Port frei?',
    options: [
      { key: 'nein', label: 'Nein', next: 'L74' },
      { key: 'ja', label: 'Ja', next: 'OK' },
    ],
  },
  F: {
    id: 'F',
    question: 'Ping ins lokale Netz erfolgreich? (Gateway / Nachbar-PC)',
    check: 'grenzt lokal und remote ein · Werkzeug: ping',
    options: [
      { key: 'nur-remote', label: 'Lokal ja – nur remote gestört', next: 'L3b' },
      { key: 'auch-lokal-nicht', label: 'Nein, auch lokal nicht', next: 'G' },
    ],
  },
  G: {
    id: 'G',
    question: 'Link vorhanden?',
    check: 'Schicht 1 · LED / Verbindungsansicht',
    options: [
      { key: 'nein', label: 'Nein', next: 'L1' },
      { key: 'ja', label: 'Ja', next: 'H' },
    ],
  },
  H: {
    id: 'H',
    question: 'Frames fehlerfrei?',
    check: 'Schicht 2 · Wireshark: FCS',
    options: [
      { key: 'fcs-fehler', label: 'FCS-Fehler', next: 'L2' },
      { key: 'frames-ok', label: 'Frames OK', next: 'I' },
    ],
  },
  I: {
    id: 'I',
    question: 'Eigene IP korrekt?',
    check: 'Schicht 3 · Werkzeug: ipconfig',
    options: [
      { key: 'nein', label: 'Nein', next: 'L3a' },
      { key: 'ja', label: 'Ja', next: 'OK' },
    ],
  },
};

export const FLOW_RESULTS: Record<string, FlowResult> = {
  L1: {
    id: 'L1',
    layerLabel: 'Schicht 1 – Bitübertragung',
    layers: ['Schicht 1 – Bitübertragung'],
    action: 'Kabel / Port / Strom prüfen',
  },
  L2: {
    id: 'L2',
    layerLabel: 'Schicht 2 – Sicherung',
    layers: ['Schicht 2 – Sicherung'],
    action: 'Defektes Kabel tauschen',
  },
  L3a: {
    id: 'L3a',
    layerLabel: 'Schicht 3 – Adressierung',
    layers: ['Schicht 3 – Vermittlung'],
    action: 'IP-Adresse / Subnetzmaske setzen',
  },
  L3b: {
    id: 'L3b',
    layerLabel: 'Schicht 3 – Routing',
    layers: ['Schicht 3 – Vermittlung'],
    action: 'Standardgateway eintragen',
  },
  L7a: {
    id: 'L7a',
    layerLabel: 'Schicht 7 – DNS',
    layers: ['Schicht 7 – Anwendung'],
    action: 'DNS-Server-Eintrag am PC korrigieren',
  },
  L74: {
    id: 'L74',
    layerLabel: 'Schicht 4/7 – Dienst & Port',
    layers: ['Schicht 4 – Transport', 'Schicht 7 – Anwendung'],
    action: 'Dienst starten oder Port freigeben',
  },
  OK: {
    id: 'OK',
    layerLabel: 'Funktioniert',
    layers: [],
    action: 'Ursache woanders suchen',
  },
};

export interface FlowStep {
  decision: FlowDecision;
  option: FlowOption;
}

export interface FlowWalk {
  steps: FlowStep[]; // gültig beantwortete Rauten in Reihenfolge
  current: FlowDecision | null; // nächste offene Raute (null, wenn Endpunkt erreicht)
  result: FlowResult | null; // erreichter Endpunkt
}

// Läuft den gespeicherten Pfad von der Start-Raute aus ab. Unbekannte Einträge
// (z. B. nach einer Änderung des Diagramms) kappen den Pfad ab dieser Stelle.
export function walkFlow(path: string[] | null | undefined): FlowWalk {
  const steps: FlowStep[] = [];
  let node: FlowDecision | undefined = FLOW_DECISIONS[FLOW_START];
  for (const key of path ?? []) {
    if (!node) break;
    const option: FlowOption | undefined = node.options.find((o) => o.key === key);
    if (!option) break;
    steps.push({ decision: node, option });
    const result = FLOW_RESULTS[option.next];
    if (result) return { steps, current: null, result };
    node = FLOW_DECISIONS[option.next];
  }
  return { steps, current: node ?? FLOW_DECISIONS[FLOW_START], result: null };
}

// Der bereinigte Pfad (nur gültige Antworten) als speicherbares Array.
export function pathFromWalk(walk: FlowWalk): string[] {
  return walk.steps.map((s) => s.option.key);
}
