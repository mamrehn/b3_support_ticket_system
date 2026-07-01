import { toolLabel } from './constants';
import { LAYER_STEPS, parseFlow } from './flowchart';
import type { Ticket } from './types';

// Vergleicht die Einreichung eines Teams mit der Musterlösung – Basis für den
// freundlichen Kommentar der erfahrenen Kollegin (src/components/ColleagueFeedback).
// Da die Diagnose dem Ablaufdiagramm Schicht für Schicht folgt, lässt sich
// präzise sagen, WO ein falscher Weg abgebogen ist: zu früh gestoppt (eine
// intakte Schicht als Fehler markiert) oder an der Fehler-Schicht mit "OK"
// vorbeigelaufen.
export interface FeedbackData {
  layerCorrect: boolean;
  faultDocumented: boolean; // Diagnoseweg endet mit "Fehler gefunden"
  submittedLayer: string | null;
  correctLayer: string;
  // Nur bei falscher Schicht gesetzt (genau eines von beiden):
  stoppedEarly: boolean; // Fehler zu früh gemeldet – diese Schicht war noch OK
  ranPast: boolean; // an der Fehler-Schicht mit "OK" vorbeigelaufen
  faultStepQuestion: string | null; // Prüffrage der (zu früh) gemeldeten Schicht
  correctStepQuestion: string | null; // Prüffrage der tatsächlichen Fehler-Schicht
  rightTools: string[]; // Labels: richtig eingesetzt
  missingTools: { label: string; layer: number | null }[]; // fehlen noch (+ zugehörige Prüf-Schicht)
  extraTools: string[]; // Labels: an der Fehler-Schicht überflüssig angehakt
  hasIssues: boolean;
  modelProblem: string;
  modelSolution: string;
}

export function buildFeedback(t: Ticket): FeedbackData {
  const flow = parseFlow(t.diagnosis_path);
  const submitted = new Set(t.submitted_tools ?? []);
  const correct = new Set(t.correct_tools ?? []);

  const rightTools = [...correct].filter((k) => submitted.has(k)).map(toolLabel);
  const missingTools = [...correct]
    .filter((k) => !submitted.has(k))
    .map((k) => ({
      label: toolLabel(k),
      layer: LAYER_STEPS.find((s) => s.tools.includes(k))?.layer ?? null,
    }));
  // Überflüssige Werkzeuge nur an der Fehler-Schicht bemängeln – die unteren
  // Schichten verlangt der geführte Weg ja ausdrücklich zu prüfen.
  const extraTools = (flow.fault ? flow.fault.tools : [...submitted])
    .filter((k) => !correct.has(k))
    .map(toolLabel);

  const layerCorrect = !!t.submitted_layer && t.submitted_layer === t.correct_layer;
  const faultDocumented = flow.fault !== null;

  const correctStep = LAYER_STEPS.find((s) => s.layerValue === t.correct_layer) ?? null;
  const faultStep = flow.fault?.step ?? null;
  const stoppedEarly =
    !layerCorrect && !!faultStep && !!correctStep && faultStep.layer < correctStep.layer;
  const ranPast =
    !layerCorrect && !!faultStep && !!correctStep && faultStep.layer > correctStep.layer;

  return {
    layerCorrect,
    faultDocumented,
    submittedLayer: t.submitted_layer,
    correctLayer: t.correct_layer,
    stoppedEarly,
    ranPast,
    faultStepQuestion: faultStep?.question ?? null,
    correctStepQuestion: correctStep?.question ?? null,
    rightTools,
    missingTools,
    extraTools,
    hasIssues:
      !layerCorrect || !faultDocumented || missingTools.length > 0 || extraTools.length > 0,
    modelProblem: t.model_problem,
    modelSolution: t.model_solution,
  };
}

// Deutsche Aufzählung: "A", "A und B", "A, B und C".
export function joinDe(items: string[]): string {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  return `${items.slice(0, -1).join(', ')} und ${items[items.length - 1]}`;
}
