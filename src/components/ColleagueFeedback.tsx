import { Avatar } from './Avatar';
import { buildFeedback, joinDe } from '../lib/feedback';
import { MENTOR } from '../lib/personas';
import { solutionTraceFor } from '../lib/solutionTraces';
import type { Ticket } from '../lib/types';

// Statt einer trockenen "Musterlösung" kommentiert die erfahrene Kollegin im
// Ticket: freundlich, betont was zu überdenken ist, bestätigt Richtiges kurz.
export function ColleagueFeedback({ ticket }: { ticket: Ticket }) {
  const fb = buildFeedback(ticket);
  const solutionTrace = solutionTraceFor(ticket.id);

  return (
    <section className="rounded-xl border border-accent-200 bg-accent-50/50 p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <Avatar name={MENTOR.name} tone="accent" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="font-semibold text-gray-900">{MENTOR.name}</span>
            <span className="text-xs text-gray-500">{MENTOR.role}</span>
          </div>
          <p className="text-xs text-gray-400">
            hat auf eure Diagnose geantwortet · gerade eben
          </p>

          <div className="mt-3 space-y-3 text-sm leading-relaxed text-gray-800">
            <p>Hi zusammen, ich hab mir euer Ticket eben angeschaut – schön dokumentiert! 🙂</p>

            {/* Kurz, was passt */}
            {fb.layerCorrect && (
              <p>
                Die Einordnung in <strong>{fb.correctLayer}</strong> passt – sauber erkannt.
              </p>
            )}
            {fb.rightTools.length > 0 && (
              <p>{joinDe(fb.rightTools)} habt ihr genau richtig eingesetzt.</p>
            )}
            {fb.pathCorrect && (
              <p>
                Euer Weg durch das Ablaufdiagramm ist sauber dokumentiert und endet genau an der
                richtigen Stelle (<strong>{fb.pathResult!.layerLabel}</strong>) – so sieht
                strukturierte Fehlersuche aus.
              </p>
            )}
            {!fb.hasIssues && (
              <p>Ehrlich – da gibt es kaum etwas zu meckern: Ihr habt die Störung genau getroffen.</p>
            )}

            {/* Ausführlicher, was zu überdenken ist */}
            {!fb.pathCorrect && (
              <p>
                {fb.pathResult ? (
                  <>
                    Euer Weg durch das Ablaufdiagramm endet bei{' '}
                    <em>{fb.pathResult.layerLabel}</em> – da hat euch eine Raute auf die falsche
                    Spur geschickt. Geht das Diagramm noch einmal Schritt für Schritt durch und
                    prüft jede Antwort wirklich im laufenden Netz.
                  </>
                ) : (
                  <>
                    Mir fehlt euer dokumentierter Weg durch das Ablaufdiagramm – arbeitet die
                    Rauten vom Informationsblatt der Reihe nach ab, dann führt euch das Diagramm
                    fast von allein zur richtigen Schicht.
                  </>
                )}
              </p>
            )}
            {!fb.layerCorrect && (
              <p>
                Eine Sache solltet ihr aber nochmal überdenken: Die betroffene Schicht ist nicht{' '}
                {fb.submittedLayer ? <em>{fb.submittedLayer}</em> : 'die gewählte'}, sondern{' '}
                <strong>{fb.correctLayer}</strong>.
              </p>
            )}
            {fb.missingTools.length > 0 && (
              <p>
                Im Werkzeugkasten würde ich noch <strong>{joinDe(fb.missingTools)}</strong>{' '}
                ergänzen – genau damit seht ihr im laufenden Netz, woran es wirklich hängt.
              </p>
            )}
            {fb.extraTools.length > 0 && (
              <p>
                <strong>{joinDe(fb.extraTools)}</strong> braucht ihr hier eigentlich nicht; das
                führt euch eher auf eine falsche Fährte.
              </p>
            )}

            {/* Die eigentliche Ursache & Lösung, in Kollegen-Stimme */}
            <p>
              <span className="font-medium text-gray-900">Worum es eigentlich geht:</span>{' '}
              {fb.modelProblem}
            </p>
            <p>
              <span className="font-medium text-gray-900">So bekommt ihr es sauber weg:</span>{' '}
              {fb.modelSolution}
            </p>

            {/* Optionaler Referenz-Screenshot der Kollegin (nur falls hinterlegt) */}
            {solutionTrace && (
              <figure className="mt-1">
                <img
                  src={solutionTrace}
                  alt="Referenz-Trace der Kollegin"
                  className="max-h-[40rem] w-full rounded-md border border-accent-200 object-contain bg-white shadow-sm"
                />
                <figcaption className="mt-1 text-xs text-gray-500">
                  Zum Vergleich – so sieht der Trace zur Lösung aus.
                </figcaption>
              </figure>
            )}

            <p>
              Schaut es euch ruhig nochmal im Netz an, dann fällt der Groschen sofort. Meldet euch,
              wenn etwas unklar ist!
            </p>
            <p className="text-gray-500">Viele Grüße, {MENTOR.name.split(' ')[0]}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
