import { LAYERS } from './constants';

// Strukturierte Fehlersuche streng nach dem Schichtenmodell: die Schichten
// werden der Reihe nach geprüft (Schicht 1 → 2 → 3 → 4 → 7; die Schichten 5/6
// fasst das Informationsblatt mit Schicht 7 zusammen). Jede Raute nennt die
// Prüffrage und die Werkzeuge, jeder Endpunkt Schicht + Maßnahme.
//
// Gespeichert wird jeder Schritt in tickets.diagnosis_path als
// "<schicht>:<ergebnis>:<werkzeug1,werkzeug2>". <ergebnis> ist 'ok' (weiter
// zur nächsten Schicht), 'fehler' (Fehler auf dieser Schicht gefunden) oder
// leer (Schicht gerade in Prüfung, erst Werkzeuge angehakt).

export interface LayerStep {
  layer: number; // OSI-Schichtnummer (1, 2, 3, 4, 7)
  layerValue: string; // LAYERS-Wert, wird als submitted_layer gespeichert
  question: string; // Prüffrage der Raute
  tools: string[]; // TOOLS-Keys aus der Klammer der Raute
  faultAction: string; // Maßnahme des Fehler-Endpunkts
}

export const LAYER_STEPS: LayerStep[] = [
  {
    layer: 1,
    layerValue: LAYERS[0],
    question: 'Link / LED vorhanden?',
    tools: ['connview'],
    faultAction: 'Kabel / Port / Strom prüfen, neu verbinden',
  },
  {
    layer: 2,
    layerValue: LAYERS[1],
    question: 'Frames kommen an und FCS fehlerfrei?',
    tools: ['wireshark'],
    faultAction: 'Defektes Kabel tauschen (FCS-Fehler)',
  },
  {
    layer: 3,
    layerValue: LAYERS[2],
    question: 'Andere Geräte per IP erreichbar?',
    tools: ['ipconfig', 'ping'],
    faultAction: 'Eigene IP/Maske korrekt? Standardgateway gesetzt?',
  },
  {
    layer: 4,
    layerValue: LAYERS[3],
    question: 'Dienst-Port am Server erreichbar, nicht blockiert?',
    tools: ['firewall'],
    faultAction: 'Firewall-Port für den Dienst freigeben',
  },
  {
    layer: 7,
    layerValue: LAYERS[6],
    question: 'Name löst auf und Dienst antwortet?',
    tools: ['nslookup', 'browser'],
    faultAction: 'DNS-Eintrag korrigieren / Dienst starten',
  },
];

export type StepResult = 'ok' | 'fehler';

export interface StepAnswer {
  step: LayerStep;
  tools: string[]; // angehakte Werkzeuge dieser Schicht
  result: StepResult;
}

export interface FlowState {
  answers: StepAnswer[]; // beantwortete Schichten in Reihenfolge
  current: LayerStep | null; // als Nächstes zu prüfende Schicht
  currentTools: string[]; // bereits angehakte Werkzeuge der aktuellen Schicht
  fault: StepAnswer | null; // Schicht, auf der der Fehler gefunden wurde
  exhausted: boolean; // alle Schichten OK – „Fehler woanders suchen"
}

// Läuft den gespeicherten Pfad ab Schicht 1 ab. Einträge, die nicht zur
// erwarteten Schicht passen (z. B. nach einer Diagramm-Änderung), kappen den
// Pfad ab dieser Stelle.
export function parseFlow(path: string[] | null | undefined): FlowState {
  const answers: StepAnswer[] = [];
  let currentTools: string[] = [];
  let index = 0;
  let fault: StepAnswer | null = null;

  for (const raw of path ?? []) {
    if (fault || index >= LAYER_STEPS.length) break;
    const step = LAYER_STEPS[index];
    const [layerPart, resultPart, toolsPart = ''] = raw.split(':');
    if (Number(layerPart) !== step.layer) break;
    const tools = toolsPart.split(',').filter((k) => step.tools.includes(k));
    if (resultPart === 'ok') {
      answers.push({ step, tools, result: 'ok' });
      index += 1;
    } else if (resultPart === 'fehler') {
      fault = { step, tools, result: 'fehler' };
      answers.push(fault);
    } else if (resultPart === '') {
      currentTools = tools; // Teil-Eintrag: Schicht noch in Prüfung
      break;
    } else {
      break;
    }
  }

  return {
    answers,
    current: fault || index >= LAYER_STEPS.length ? null : LAYER_STEPS[index],
    currentTools: fault ? [] : currentTools,
    fault,
    exhausted: !fault && index >= LAYER_STEPS.length,
  };
}

export function encodeStep(layer: number, result: StepResult | null, tools: string[]): string {
  return `${layer}:${result ?? ''}:${tools.join(',')}`;
}

// Der Zustand als speicherbares Array (beantwortete Schichten + ggf. die
// angehakten Werkzeuge der aktuellen Schicht).
export function encodeFlow(state: FlowState): string[] {
  const entries = state.answers.map((a) => encodeStep(a.step.layer, a.result, a.tools));
  if (!state.fault && state.current && state.currentTools.length > 0) {
    entries.push(encodeStep(state.current.layer, null, state.currentTools));
  }
  return entries;
}

// Alle im Verlauf angehakten Werkzeuge (wird als submitted_tools gespeichert).
export function collectTools(state: FlowState): string[] {
  const seen = new Set<string>();
  const all: string[] = [];
  for (const a of state.answers) {
    for (const k of a.tools) {
      if (!seen.has(k)) {
        seen.add(k);
        all.push(k);
      }
    }
  }
  for (const k of state.currentTools) {
    if (!seen.has(k)) {
      seen.add(k);
      all.push(k);
    }
  }
  return all;
}
