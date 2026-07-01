import { pathFromWalk, walkFlow } from '../lib/flowchart';

// Geführte Fehlersuche entlang des Ablaufdiagramms aus dem Informationsblatt:
// Die aktuelle Raute wird als Frage mit den Antwort-Kanten angezeigt, jede
// Antwort landet als nummerierter Protokoll-Schritt darüber. Am Endpunkt
// erscheinen Schicht + Maßnahme laut Diagramm.
export function DiagnosisFlowchart({
  path,
  editable,
  onChange,
}: {
  path: string[];
  editable: boolean;
  onChange: (path: string[]) => void;
}) {
  const walk = walkFlow(path);
  const keys = pathFromWalk(walk);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="block text-sm font-medium text-gray-700">
          Fehlersuche nach Ablaufdiagramm
        </span>
        {walk.result ? (
          <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 ring-1 ring-inset ring-green-300">
            Endpunkt erreicht ✓
          </span>
        ) : (
          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-300">
            Schritt {walk.steps.length + 1}
          </span>
        )}
      </div>
      <p className="mt-1 text-xs leading-relaxed text-gray-500">
        Arbeitet das Ablaufdiagramm vom Informationsblatt Raute für Raute ab: erst im Netz
        prüfen, dann hier die Antwort anklicken. Eure Antworten werden als Diagnose-Protokoll
        dokumentiert.
      </p>

      {/* Protokoll der beantworteten Rauten */}
      {walk.steps.length > 0 && (
        <ol className="mt-3 space-y-2">
          {walk.steps.map((step, i) => (
            <li
              key={step.decision.id}
              className="flex items-start gap-3 rounded-md border border-gray-200 bg-gray-50 px-3 py-2"
            >
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold text-gray-600">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1 text-sm">
                <p className="text-gray-800">{step.decision.question}</p>
                <p className="text-xs text-gray-400">{step.decision.check}</p>
              </div>
              <span className="mt-0.5 shrink-0 rounded bg-white px-2 py-0.5 text-xs font-semibold text-accent-700 ring-1 ring-inset ring-accent-300">
                {step.option.label}
              </span>
              {editable && (
                <button
                  type="button"
                  onClick={() => onChange(keys.slice(0, i))}
                  title="Ab diesem Schritt neu beantworten"
                  className="mt-0.5 shrink-0 text-xs font-medium text-gray-400 transition hover:text-accent-700"
                >
                  ändern
                </button>
              )}
            </li>
          ))}
        </ol>
      )}

      {/* Aktuelle Raute oder erreichter Endpunkt */}
      {walk.result ? (
        <div className="mt-3 rounded-md border border-green-300 bg-green-50 px-3 py-3">
          <p className="text-sm font-semibold text-green-900">
            Endpunkt: {walk.result.layerLabel}
          </p>
          <p className="mt-0.5 text-sm text-green-900">Maßnahme: {walk.result.action}</p>
          <p className="mt-1.5 text-xs leading-relaxed text-green-800">
            {walk.result.layers.length > 0
              ? 'Wählt unten die passende Schicht aus und beschreibt Problem und Lösung mit euren eigenen Beobachtungen aus dem Netz.'
              : 'Laut eurem Weg funktioniert alles – im Ticket steckt aber eine Störung. Geht das Diagramm noch einmal Raute für Raute durch und prüft jede Antwort im Netz.'}
          </p>
          {editable && (
            <button
              type="button"
              onClick={() => onChange([])}
              className="mt-2 rounded-md border border-green-300 bg-white px-3 py-1.5 text-xs font-medium text-green-800 transition hover:bg-green-100"
            >
              Von vorn beginnen
            </button>
          )}
        </div>
      ) : editable && walk.current ? (
        <div className="mt-3 rounded-md border border-accent-300 bg-accent-50/60 px-3 py-3">
          <p className="text-sm font-semibold text-gray-900">{walk.current.question}</p>
          <p className="mt-0.5 text-xs text-gray-500">{walk.current.check}</p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {walk.current.options.map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => onChange([...keys, opt.key])}
                className="rounded-md border border-accent-300 bg-white px-3 py-1.5 text-sm font-medium text-accent-700 shadow-sm transition hover:bg-accent-50"
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <p className="mt-3 text-sm text-gray-400">
          {walk.steps.length === 0
            ? 'Noch kein Diagnoseweg dokumentiert.'
            : 'Diagnoseweg noch nicht bis zu einem Endpunkt abgeschlossen.'}
        </p>
      )}
    </div>
  );
}
