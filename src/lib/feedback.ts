import { toolLabel } from './constants';
import type { Ticket } from './types';

// Vergleicht die Einreichung eines Teams mit der Musterlösung – Basis für den
// freundlichen Kommentar der erfahrenen Kollegin (src/components/ColleagueFeedback).
export interface FeedbackData {
  layerCorrect: boolean;
  submittedLayer: string | null;
  correctLayer: string;
  rightTools: string[]; // Labels: richtig eingesetzt
  missingTools: string[]; // Labels: fehlen noch
  extraTools: string[]; // Labels: überflüssig
  hasIssues: boolean;
  modelProblem: string;
  modelSolution: string;
}

export function buildFeedback(t: Ticket): FeedbackData {
  const submitted = new Set(t.submitted_tools ?? []);
  const correct = new Set(t.correct_tools ?? []);

  const rightTools = [...correct].filter((k) => submitted.has(k)).map(toolLabel);
  const missingTools = [...correct].filter((k) => !submitted.has(k)).map(toolLabel);
  const extraTools = [...submitted].filter((k) => !correct.has(k)).map(toolLabel);

  const layerCorrect = !!t.submitted_layer && t.submitted_layer === t.correct_layer;

  return {
    layerCorrect,
    submittedLayer: t.submitted_layer,
    correctLayer: t.correct_layer,
    rightTools,
    missingTools,
    extraTools,
    hasIssues: !layerCorrect || missingTools.length > 0 || extraTools.length > 0,
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
