import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTickets } from '../context/TicketsContext';
import { toolLabel } from '../lib/constants';
import { parseFlow } from '../lib/flowchart';
import { formatDate, sanitizeForFilename, ticketElapsed } from '../lib/format';
import type { Ticket } from '../lib/types';

function toolsLine(keys: string[] | null | undefined): string {
  const list = keys ?? [];
  return list.length > 0 ? list.map(toolLabel).join(', ') : '—';
}

export function PrintView() {
  const { session } = useAuth();
  const { tickets, loading, error } = useTickets();
  // Klassenname: mit der optionalen Bezeichnung des Klassen-Sets vorbefüllt.
  const [klasse, setKlasse] = useState(() => session?.classLabel ?? '');
  const [datum, setDatum] = useState(formatDate());

  // PDF-Dateiname wie bei den Zugangszetteln (Browser nutzen document.title):
  // "DataSol-Lernblatt-<Code>[-<Klassenname>]" – folgt dem Eingabefeld live.
  useEffect(() => {
    const prev = document.title;
    const parts = ['DataSol-Lernblatt'];
    if (session?.classCode) parts.push(session.classCode);
    const label = sanitizeForFilename(klasse);
    if (label) parts.push(label);
    document.title = parts.join('-');
    return () => {
      document.title = prev;
    };
  }, [klasse, session?.classCode]);

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Bildschirm-Steuerleiste – wird beim Drucken ausgeblendet */}
      <div className="border-b border-gray-200 bg-gray-50 print:hidden">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-6 py-3">
          <Link to="/" className="text-sm font-medium text-accent-700 hover:underline">
            ← Zurück zur Übersicht
          </Link>
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-md bg-accent-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-700"
          >
            Drucken / Als PDF speichern
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-6 py-8 print:px-0 print:py-0">
        {/* Kopf des Lernblatts */}
        <header className="mb-6 border-b border-gray-300 pb-4">
          <h1 className="text-2xl font-bold">DataSol IT-Support – Lernblatt Netzwerkdiagnose</h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-8 gap-y-2 text-sm text-gray-700">
            <label className="inline-flex items-center gap-2">
              <span className="font-medium">Klasse:</span>
              <input
                type="text"
                value={klasse}
                onChange={(e) => setKlasse(e.target.value)}
                placeholder="________"
                className="w-44 border-b border-gray-400 bg-transparent px-1 py-0.5 text-gray-900 outline-none placeholder:text-gray-300 focus:border-accent-600 print:border-gray-500"
              />
            </label>
            <label className="inline-flex items-center gap-2">
              <span className="font-medium">Datum:</span>
              <input
                type="text"
                value={datum}
                onChange={(e) => setDatum(e.target.value)}
                placeholder="________"
                className="w-32 border-b border-gray-400 bg-transparent px-1 py-0.5 text-gray-900 outline-none placeholder:text-gray-300 focus:border-accent-600 print:border-gray-500"
              />
            </label>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Übersicht aller Störungen mit Team-Diagnose und Musterlösung.
          </p>
          <p className="mt-1 text-xs text-gray-400 print:hidden">
            Tipp: Klasse und Datum hier ausfüllen – die Werte werden mitgedruckt.
          </p>
        </header>

        {loading ? (
          <p className="text-sm text-gray-500 print:hidden">Tickets werden geladen …</p>
        ) : error ? (
          <p className="text-sm text-red-600 print:hidden">{error}</p>
        ) : (
          <div className="space-y-6">
            {tickets.map((t) => (
              <TicketSheet key={t.id} ticket={t} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TicketSheet({ ticket }: { ticket: Ticket }) {
  const link =
    ticket.filius_deeplink && !ticket.filius_deeplink.includes('<')
      ? ticket.filius_deeplink
      : null;
  const flow = parseFlow(ticket.diagnosis_path);
  const elapsed = ticketElapsed(ticket.opened_at, ticket.submitted_at);

  return (
    <article className="break-inside-avoid rounded-lg border border-gray-300 p-4 print:rounded-none">
      <h2 className="text-base font-bold">
        #{ticket.id} – {ticket.title.replace(/^Ticket #\d+\s*[–-]\s*/, '')}
      </h2>

      <p className="mt-1 text-sm italic text-gray-700">„{ticket.reporter_text}"</p>

      {link && (
        <p className="mt-2 text-xs text-gray-600">
          <span className="font-medium">Netzwerk-Analyse (Filius): </span>
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="break-all text-accent-700 underline print:text-gray-900 print:no-underline"
          >
            {link}
          </a>
        </p>
      )}

      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        {/* Team-Diagnose */}
        <div className="rounded-md bg-gray-50 p-3 print:bg-white print:border print:border-gray-200">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Diagnose Team {ticket.id}
          </h3>
          <dl className="mt-2 space-y-1.5 text-sm">
            <Field
              label="Bearbeitungszeit"
              value={elapsed ? `${elapsed.label}${elapsed.running ? ' (läuft noch)' : ''}` : null}
            />
            <div>
              <dt className="font-medium text-gray-600">Diagnoseweg (Schicht für Schicht)</dt>
              <dd className="text-gray-900">
                {flow.answers.length === 0 ? (
                  '—'
                ) : (
                  <>
                    <ol className="mt-0.5 list-decimal space-y-0.5 pl-5">
                      {flow.answers.map((a) => (
                        <li key={a.step.layer}>
                          {a.step.layerValue}:{' '}
                          <span className="font-medium">
                            {a.result === 'ok' ? 'OK' : 'Fehler gefunden'}
                          </span>
                          {a.tools.length > 0 &&
                            ` (geprüft mit ${a.tools.map(toolLabel).join(', ')})`}
                        </li>
                      ))}
                    </ol>
                    <p className="mt-0.5">
                      {flow.fault
                        ? `Maßnahme laut Diagramm: ${flow.fault.step.faultAction}`
                        : flow.exhausted
                          ? 'Alle Schichten OK – Fehler woanders suchen.'
                          : 'Prüfung noch nicht abgeschlossen.'}
                    </p>
                  </>
                )}
              </dd>
            </div>
            <Field label="Schicht" value={ticket.submitted_layer} />
            <Field label="Werkzeuge" value={toolsLine(ticket.submitted_tools)} />
            <Field label="Problem" value={ticket.submitted_problem} />
            <Field label="Lösung" value={ticket.submitted_solution} />
            {ticket.trace_note && (
              <div>
                <dt className="font-medium text-gray-600">Wireshark-Trace</dt>
                <dd className="mt-1">
                  <img
                    src={ticket.trace_note}
                    alt="Wireshark-Trace Screenshot"
                    className="max-h-[28rem] w-full rounded border border-gray-300 object-contain"
                  />
                </dd>
              </div>
            )}
          </dl>
        </div>

        {/* Musterlösung */}
        <div className="rounded-md border border-green-300 bg-green-50 p-3 print:bg-white">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-green-700">
            Musterlösung
          </h3>
          <dl className="mt-2 space-y-1.5 text-sm">
            <Field label="Schicht" value={ticket.correct_layer} />
            <Field label="Werkzeuge" value={toolsLine(ticket.correct_tools)} />
            <Field label="Problem" value={ticket.model_problem} />
            <Field label="Lösung" value={ticket.model_solution} />
          </dl>
        </div>
      </div>
    </article>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="font-medium text-gray-600">{label}</dt>
      <dd className="text-gray-900">{value?.trim() ? value : '—'}</dd>
    </div>
  );
}
