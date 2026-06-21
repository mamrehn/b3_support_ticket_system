import { Avatar } from './Avatar';
import { buildFeedback, joinDe } from '../lib/feedback';
import { MENTOR } from '../lib/personas';
import type { Ticket } from '../lib/types';

// Statt einer trockenen "Musterlösung" kommentiert die erfahrene Kollegin im
// Ticket: freundlich, betont was zu überdenken ist, bestätigt Richtiges kurz.
export function ColleagueFeedback({ ticket }: { ticket: Ticket }) {
  const fb = buildFeedback(ticket);

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
            {!fb.hasIssues && (
              <p>Ehrlich – da gibt es kaum etwas zu meckern: Ihr habt die Störung genau getroffen.</p>
            )}

            {/* Ausführlicher, was zu überdenken ist */}
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
