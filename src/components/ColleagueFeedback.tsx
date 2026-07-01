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
            <p>
              Hi zusammen, ich hab mir euer Ticket eben angeschaut
              {fb.faultDocumented ? ' – schön dokumentiert! 🙂' : '.'}
            </p>

            {/* Kurz, was passt */}
            {fb.faultDocumented && fb.layerCorrect && (
              <p>
                Euer Prüfprotokoll sitzt: Schicht für Schicht durchgegangen und den Fehler auf{' '}
                <strong>{fb.correctLayer}</strong> sauber festgenagelt – genau so sieht
                strukturierte Fehlersuche aus.
              </p>
            )}
            {fb.rightTools.length > 0 && (
              <p>{joinDe(fb.rightTools)} habt ihr genau richtig eingesetzt.</p>
            )}
            {!fb.hasIssues && (
              <p>Ehrlich – da gibt es kaum etwas zu meckern: Ihr habt die Störung genau getroffen.</p>
            )}

            {/* Ausführlicher, was zu überdenken ist */}
            {!fb.faultDocumented && (
              <p>
                Mir fehlt euer dokumentierter Prüfweg – arbeitet das Ablaufdiagramm Schicht für
                Schicht ab (1 → 2 → 3 → 4 → 7), dann führt euch jede Antwort fast von allein zur
                richtigen Schicht.
              </p>
            )}
            {fb.stoppedEarly && (
              <p>
                Eine Sache solltet ihr nochmal überdenken: Ihr habt schon auf{' '}
                <em>{fb.submittedLayer}</em> Stopp gemacht – dort war aber noch alles in Ordnung.
                Prüft die Frage „{fb.faultStepQuestion}" nochmal in Ruhe im laufenden Netz: Sie
                ist hier mit <strong>Ja</strong> zu beantworten. Der Fehler sitzt weiter oben, auf{' '}
                <strong>{fb.correctLayer}</strong>.
              </p>
            )}
            {fb.ranPast && (
              <p>
                Eine Sache solltet ihr nochmal überdenken: An{' '}
                <strong>{fb.correctLayer}</strong> seid ihr mit „OK" vorbeigelaufen. Genau bei der
                Frage „{fb.correctStepQuestion}" hättet ihr genauer hinsehen müssen – die Antwort
                ist hier <strong>Nein</strong>. Auf {fb.submittedLayer ?? 'der gemeldeten Schicht'}{' '}
                war dagegen nichts zu finden.
              </p>
            )}
            {fb.faultDocumented && !fb.layerCorrect && !fb.stoppedEarly && !fb.ranPast && (
              <p>
                Eine Sache solltet ihr nochmal überdenken: Euer Prüfweg endet auf{' '}
                {fb.submittedLayer ? <em>{fb.submittedLayer}</em> : 'der falschen Schicht'} – die
                Störung liegt aber auf <strong>{fb.correctLayer}</strong>. Geht die Schichten noch
                einmal von Schicht 1 an durch und prüft jede Antwort wirklich im laufenden Netz.
              </p>
            )}
            {fb.missingTools.length > 0 && (
              <p>
                Beim Abhaken hätte ich noch{' '}
                <strong>
                  {joinDe(
                    fb.missingTools.map((m) =>
                      m.layer !== null ? `${m.label} (bei Schicht ${m.layer})` : m.label,
                    ),
                  )}
                </strong>{' '}
                erwartet – genau damit seht ihr an dieser Stelle, woran es wirklich hängt.
              </p>
            )}
            {fb.extraTools.length > 0 && (
              <p>
                <strong>{joinDe(fb.extraTools)}</strong> braucht ihr an der Fehler-Schicht
                eigentlich nicht; das führt euch eher auf eine falsche Fährte.
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
