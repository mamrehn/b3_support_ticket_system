import { toolLabel } from '../lib/constants';
import {
  encodeStep,
  parseFlow,
  type FlowState,
  type StepResult,
} from '../lib/flowchart';

// Geführte Fehlersuche streng nach dem Ablaufdiagramm: Schicht 1 → 2 → 3 → 4 → 7.
// Pro Schicht haken die Schüler die eingesetzten Werkzeuge ab und entscheiden
// „Ja – Schicht OK" (weiter) oder „Nein – Fehler gefunden" (Endpunkt). Am
// Endpunkt beschreiben sie kurz Ursache und Behebung. Ersetzt die früheren
// freien Eingabefelder (Schicht/Werkzeuge/Problem/Lösung werden abgeleitet).
export function DiagnosisFlowchart({
  path,
  problem,
  solution,
  editable,
  onPathChange,
  onProblemChange,
  onSolutionChange,
}: {
  path: string[];
  problem: string;
  solution: string;
  editable: boolean;
  onPathChange: (path: string[]) => void;
  onProblemChange: (value: string) => void;
  onSolutionChange: (value: string) => void;
}) {
  const flow = parseFlow(path);

  const encodeAnswers = (state: FlowState, upto: number) =>
    state.answers.slice(0, upto).map((a) => encodeStep(a.step.layer, a.result, a.tools));

  const toggleCurrentTool = (key: string) => {
    if (!flow.current) return;
    const tools = flow.currentTools.includes(key)
      ? flow.currentTools.filter((k) => k !== key)
      : [...flow.currentTools, key];
    const entries = encodeAnswers(flow, flow.answers.length);
    if (tools.length > 0) entries.push(encodeStep(flow.current.layer, null, tools));
    onPathChange(entries);
  };

  const answerCurrent = (result: StepResult) => {
    if (!flow.current) return;
    onPathChange([
      ...encodeAnswers(flow, flow.answers.length),
      encodeStep(flow.current.layer, result, flow.currentTools),
    ]);
  };

  // Schritt i erneut prüfen: spätere Antworten verwerfen, Werkzeug-Haken behalten.
  const reviseStep = (i: number) => {
    const step = flow.answers[i];
    const entries = encodeAnswers(flow, i);
    if (step.tools.length > 0) entries.push(encodeStep(step.step.layer, null, step.tools));
    onPathChange(entries);
  };

  const okAnswers = flow.answers.filter((a) => a.result === 'ok');

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="block text-sm font-medium text-gray-700">
          Fehlersuche nach Ablaufdiagramm – Schicht für Schicht
        </span>
        {flow.fault ? (
          <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 ring-1 ring-inset ring-red-300">
            Fehler gefunden
          </span>
        ) : flow.exhausted ? (
          <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-300">
            Kein Fehler gefunden
          </span>
        ) : (
          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-300">
            Prüfe Schicht {flow.current?.layer}
          </span>
        )}
      </div>
      <p className="mt-1 text-xs leading-relaxed text-gray-500">
        Prüft die Schichten der Reihe nach – wie im Ablaufdiagramm auf dem Informationsblatt.
        Erst im Netz mit den Werkzeugen prüfen und die benutzten Werkzeuge abhaken, dann die
        Frage beantworten. Jede Antwort wird als euer Diagnose-Protokoll dokumentiert.
      </p>

      {/* Fortschritts-Spur: bewusst nur der bereits gegangene Weg + aktuelle
          Schicht – kommende Schichten werden nicht vorweggenommen. */}
      {(flow.answers.length > 0 || flow.current) && (
        <ol aria-label="Bisheriger Diagnoseweg" className="mt-3 flex flex-wrap items-center gap-1">
          {flow.answers.map((a, i) => (
            <li key={a.step.layer} className="flex items-center gap-1">
              {i > 0 && (
                <span className="text-xs text-gray-300" aria-hidden>
                  →
                </span>
              )}
              <span
                title={`Schicht ${a.step.layer}: ${a.result === 'ok' ? 'OK' : 'Fehler gefunden'}`}
                className={`grid h-6 w-6 place-items-center rounded-full text-xs font-semibold ring-1 ring-inset ${
                  a.result === 'ok'
                    ? 'bg-green-100 text-green-700 ring-green-300'
                    : 'bg-red-100 text-red-800 ring-red-300'
                }`}
              >
                {a.step.layer}
              </span>
            </li>
          ))}
          {flow.current && (
            <li className="flex items-center gap-1">
              {flow.answers.length > 0 && (
                <span className="text-xs text-gray-300" aria-hidden>
                  →
                </span>
              )}
              <span
                title={`Schicht ${flow.current.layer}: in Prüfung`}
                className="grid h-6 w-6 place-items-center rounded-full bg-amber-100 text-xs font-semibold text-amber-800 ring-1 ring-inset ring-amber-300"
              >
                {flow.current.layer}
              </span>
            </li>
          )}
        </ol>
      )}

      {/* Protokoll: bereits geprüfte Schichten */}
      {okAnswers.length > 0 && (
        <ol className="mt-3 space-y-2">
          {okAnswers.map((a, i) => (
            <li
              key={a.step.layer}
              className="flex items-start gap-3 rounded-md border border-gray-200 bg-gray-50 px-3 py-2"
            >
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100 text-xs font-semibold text-green-700 ring-1 ring-inset ring-green-300">
                ✓
              </span>
              <div className="min-w-0 flex-1 text-sm">
                <p className="font-medium text-gray-800">
                  {a.step.layerValue} <span className="font-normal text-green-700">– OK</span>
                </p>
                <p className="text-xs text-gray-500">
                  {a.step.question}
                  {a.tools.length > 0 &&
                    ` · geprüft mit: ${a.tools.map(toolLabel).join(', ')}`}
                </p>
              </div>
              {editable && !flow.fault && (
                <button
                  type="button"
                  onClick={() => reviseStep(i)}
                  title="Diese Schicht erneut prüfen (spätere Antworten werden verworfen)"
                  className="mt-0.5 shrink-0 text-xs font-medium text-gray-400 transition hover:text-accent-700"
                >
                  erneut prüfen
                </button>
              )}
            </li>
          ))}
        </ol>
      )}

      {/* Aktuelle Raute (read-only nur zeigen, wenn schon etwas dokumentiert ist) */}
      {flow.current && (editable || okAnswers.length > 0 || flow.currentTools.length > 0) && (
        <div className="mt-3 rounded-md border border-accent-300 bg-accent-50/60 px-3 py-3">
          <p className="text-sm font-semibold text-gray-900">
            Schicht {flow.current.layer} OK? – {flow.current.question}
          </p>

          <p className="mt-2 text-xs font-medium text-gray-600">
            Womit habt ihr geprüft? (mindestens ein Werkzeug abhaken)
          </p>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {flow.current.tools.map((key) => (
              <label
                key={key}
                className={`flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm ${
                  editable ? 'cursor-pointer hover:bg-white' : 'cursor-default'
                } ${
                  flow.currentTools.includes(key)
                    ? 'border-accent-400 bg-white'
                    : 'border-gray-300 bg-gray-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={flow.currentTools.includes(key)}
                  disabled={!editable}
                  onChange={() => toggleCurrentTool(key)}
                  className="h-4 w-4 rounded border-gray-300 text-accent-600 focus:ring-accent-600 disabled:opacity-60"
                />
                <span className="text-gray-800">{toolLabel(key)}</span>
              </label>
            ))}
          </div>

          {editable && (
            <div className="mt-3 flex flex-wrap gap-2">
              <span
                title={
                  flow.currentTools.length === 0
                    ? 'Bitte zuerst mindestens ein Werkzeug abhaken'
                    : undefined
                }
                className={flow.currentTools.length === 0 ? 'cursor-not-allowed' : undefined}
              >
                <button
                  type="button"
                  disabled={flow.currentTools.length === 0}
                  onClick={() => answerCurrent('ok')}
                  className="rounded-md border border-green-300 bg-white px-3 py-1.5 text-sm font-semibold text-green-700 shadow-sm transition hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Ja – Schicht {flow.current.layer} OK, weiter
                </button>
              </span>
              <span
                title={
                  flow.currentTools.length === 0
                    ? 'Bitte zuerst mindestens ein Werkzeug abhaken'
                    : undefined
                }
                className={flow.currentTools.length === 0 ? 'cursor-not-allowed' : undefined}
              >
                <button
                  type="button"
                  disabled={flow.currentTools.length === 0}
                  onClick={() => answerCurrent('fehler')}
                  className="rounded-md border border-red-300 bg-white px-3 py-1.5 text-sm font-semibold text-red-700 shadow-sm transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Nein – hier liegt der Fehler
                </button>
              </span>
            </div>
          )}
          {!editable && (
            <p className="mt-2 text-xs text-gray-400">Diese Schicht ist noch in Prüfung.</p>
          )}
        </div>
      )}

      {/* Endpunkt: Fehler gefunden */}
      {flow.fault && (
        <div className="mt-3 rounded-md border border-red-300 bg-red-50 px-3 py-3">
          <p className="text-sm font-semibold text-red-900">
            Fehler gefunden: {flow.fault.step.layerValue}
          </p>
          <p className="mt-0.5 text-xs text-red-800">
            {flow.fault.step.question}{' '}
            <span className="font-semibold">→ Nein</span>
            {flow.fault.tools.length > 0 &&
              ` · geprüft mit: ${flow.fault.tools.map(toolLabel).join(', ')}`}
          </p>
          <p className="mt-1 text-xs text-red-800">
            Maßnahme laut Diagramm: {flow.fault.step.faultAction}
          </p>

          <div className="mt-3 space-y-3">
            <div>
              <label htmlFor="fault-problem" className="block text-sm font-medium text-gray-800">
                Ursache – was habt ihr beobachtet?
              </label>
              <textarea
                id="fault-problem"
                rows={2}
                value={problem}
                disabled={!editable}
                onChange={(e) => onProblemChange(e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-accent-600 focus:ring-1 focus:ring-accent-600 disabled:bg-gray-50 disabled:text-gray-500"
                placeholder="Kurz beschreiben, was auf dieser Schicht kaputt ist …"
              />
            </div>
            <div>
              <label htmlFor="fault-solution" className="block text-sm font-medium text-gray-800">
                Behebung – wie habt ihr die Störung gelöst?
              </label>
              <textarea
                id="fault-solution"
                rows={2}
                value={solution}
                disabled={!editable}
                onChange={(e) => onSolutionChange(e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-accent-600 focus:ring-1 focus:ring-accent-600 disabled:bg-gray-50 disabled:text-gray-500"
                placeholder="Kurz beschreiben, was ihr geändert habt …"
              />
            </div>
          </div>

          {editable && (
            <button
              type="button"
              onClick={() => reviseStep(flow.answers.length - 1)}
              className="mt-3 rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-800 transition hover:bg-red-100"
            >
              Entscheidung ändern – Schicht erneut prüfen
            </button>
          )}
        </div>
      )}

      {/* Endpunkt: alle Schichten OK */}
      {flow.exhausted && (
        <div className="mt-3 rounded-md border border-gray-300 bg-gray-50 px-3 py-3">
          <p className="text-sm font-semibold text-gray-800">
            Alles OK – Fehler woanders suchen
          </p>
          <p className="mt-1 text-xs leading-relaxed text-gray-600">
            Laut eurem Protokoll sind alle Schichten in Ordnung – in diesem Ticket steckt aber
            eine Störung. Geht die Schichten noch einmal von Schicht 1 an durch und prüft jede
            Antwort wirklich im laufenden Netz.
          </p>
          {editable && (
            <button
              type="button"
              onClick={() => onPathChange([])}
              className="mt-2 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-100"
            >
              Von vorn beginnen
            </button>
          )}
        </div>
      )}

      {!editable && flow.answers.length === 0 && flow.currentTools.length === 0 && (
        <p className="mt-3 text-sm text-gray-400">Noch kein Diagnoseweg dokumentiert.</p>
      )}
    </div>
  );
}
