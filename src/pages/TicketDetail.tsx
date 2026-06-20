import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { StatusChip } from '../components/StatusChip';
import { Banner } from '../components/Banner';
import { useAuth } from '../context/AuthContext';
import { useTickets } from '../context/TicketsContext';
import { canEditTicket, type Session } from '../lib/auth';
import { LAYERS, TOOLS, toolLabel } from '../lib/constants';
import { saveSubmission } from '../lib/api';
import { formatDateTime } from '../lib/format';
import { isSubmissionComplete, type Ticket } from '../lib/types';

interface FormState {
  layer: string;
  tools: string[];
  problem: string;
  solution: string;
  trace: string;
}

function fromTicket(t: Ticket): FormState {
  return {
    layer: t.submitted_layer ?? '',
    tools: t.submitted_tools ?? [],
    problem: t.submitted_problem ?? '',
    solution: t.submitted_solution ?? '',
    trace: t.trace_note ?? '',
  };
}

export function TicketDetail() {
  const { id } = useParams<{ id: string }>();
  const ticketId = Number(id);
  const { session } = useAuth();
  const { loading, getTicket } = useTickets();
  const ticket = getTicket(ticketId);

  if (loading && !ticket) {
    return (
      <Layout>
        <p className="py-12 text-center text-sm text-gray-500">Ticket wird geladen …</p>
      </Layout>
    );
  }

  if (!ticket || !session) {
    return (
      <Layout>
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
          <p className="text-sm text-gray-600">Dieses Ticket existiert nicht.</p>
          <Link to="/" className="mt-3 inline-block text-sm font-medium text-accent-700 hover:underline">
            ← Zurück zur Übersicht
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <TicketDetailView
      key={ticket.id}
      ticket={ticket}
      editable={canEditTicket(session, ticket.id)}
      session={session}
    />
  );
}

function TicketDetailView({
  ticket,
  editable,
  session,
}: {
  ticket: Ticket;
  editable: boolean;
  session: Session;
}) {
  const { refetch } = useTickets();
  const [form, setForm] = useState<FormState>(() => fromTicket(ticket));
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const loadedId = useRef(ticket.id);

  // Formular mit dem Server-Stand synchronisieren – aber lokale, noch nicht
  // gespeicherte Eingaben nicht überschreiben (z. B. bei Realtime-Updates).
  useEffect(() => {
    if (loadedId.current !== ticket.id || !dirty) {
      setForm(fromTicket(ticket));
      setDirty(false);
      loadedId.current = ticket.id;
    }
  }, [ticket, dirty]);

  const complete = isSubmissionComplete({
    submitted_layer: form.layer || null,
    submitted_tools: form.tools,
    submitted_problem: form.problem || null,
    submitted_solution: form.solution || null,
  });

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
    setSavedAt(null);
  };

  const toggleTool = (key: string) => {
    update(
      'tools',
      form.tools.includes(key) ? form.tools.filter((k) => k !== key) : [...form.tools, key],
    );
  };

  const persist = async (reveal: boolean) => {
    setSaving(true);
    setError(null);
    try {
      await saveSubmission(
        ticket.id,
        {
          submitted_layer: form.layer || null,
          submitted_tools: form.tools,
          submitted_problem: form.problem.trim() || null,
          submitted_solution: form.solution.trim() || null,
          trace_note: form.trace.trim() || null,
        },
        session,
        reveal,
      );
      await refetch();
      setDirty(false);
      setSavedAt(Date.now());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Speichern fehlgeschlagen.');
    } finally {
      setSaving(false);
    }
  };

  const hasFilius = !!ticket.filius_deeplink && !ticket.filius_deeplink.includes('<');

  return (
    <Layout>
      <Link to="/" className="text-sm font-medium text-accent-700 hover:underline">
        ← Zurück zur Übersicht
      </Link>

      {/* Kopf */}
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium text-gray-400">#{ticket.id}</span>
        <h1 className="text-xl font-semibold text-gray-900">{ticket.title}</h1>
        <StatusChip ticket={ticket} />
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Hauptspalte */}
        <div className="space-y-6">
          {/* Störungsmeldung */}
          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Störungsmeldung
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-800">{ticket.reporter_text}</p>

            {ticket.concept_hint && (
              <div className="mt-4 rounded-lg border border-accent-200 bg-accent-50 p-3">
                <p className="text-xs font-semibold text-accent-800">Hinweis – Was du dafür wissen musst</p>
                <p className="mt-1 text-sm leading-relaxed text-accent-800/90">
                  {ticket.concept_hint}
                </p>
              </div>
            )}
          </section>

          {/* Diagnose-Formular */}
          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">Diagnose</h2>
              {!editable && (
                <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                  Nur Lesezugriff
                </span>
              )}
            </div>

            <div className="mt-4 space-y-5">
              {/* Schicht */}
              <div>
                <label htmlFor="layer" className="block text-sm font-medium text-gray-700">
                  Schicht
                </label>
                <select
                  id="layer"
                  value={form.layer}
                  disabled={!editable}
                  onChange={(e) => update('layer', e.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm outline-none focus:border-accent-600 focus:ring-1 focus:ring-accent-600 disabled:bg-gray-50 disabled:text-gray-500"
                >
                  <option value="">– bitte wählen –</option>
                  {LAYERS.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>

              {/* Werkzeuge */}
              <fieldset>
                <legend className="text-sm font-medium text-gray-700">Eingesetzte Werkzeuge</legend>
                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {TOOLS.map((tool) => (
                    <label
                      key={tool.key}
                      className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${
                        editable ? 'cursor-pointer hover:bg-gray-50' : 'cursor-default'
                      } ${
                        form.tools.includes(tool.key)
                          ? 'border-accent-300 bg-accent-50'
                          : 'border-gray-300 bg-white'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={form.tools.includes(tool.key)}
                        disabled={!editable}
                        onChange={() => toggleTool(tool.key)}
                        className="h-4 w-4 rounded border-gray-300 text-accent-600 focus:ring-accent-600 disabled:opacity-60"
                      />
                      <span className="text-gray-800">{tool.label}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              {/* Problembeschreibung */}
              <div>
                <label htmlFor="problem" className="block text-sm font-medium text-gray-700">
                  Problembeschreibung
                </label>
                <textarea
                  id="problem"
                  rows={3}
                  value={form.problem}
                  disabled={!editable}
                  onChange={(e) => update('problem', e.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm outline-none focus:border-accent-600 focus:ring-1 focus:ring-accent-600 disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="Was ist die Ursache der Störung?"
                />
              </div>

              {/* Lösung */}
              <div>
                <label htmlFor="solution" className="block text-sm font-medium text-gray-700">
                  Lösung
                </label>
                <textarea
                  id="solution"
                  rows={3}
                  value={form.solution}
                  disabled={!editable}
                  onChange={(e) => update('solution', e.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm outline-none focus:border-accent-600 focus:ring-1 focus:ring-accent-600 disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="Wie wurde die Störung behoben?"
                />
              </div>

              {/* Wireshark-Trace */}
              <div>
                <label htmlFor="trace" className="block text-sm font-medium text-gray-700">
                  Wireshark-Trace <span className="font-normal text-gray-400">(optional)</span>
                </label>
                <input
                  id="trace"
                  type="text"
                  value={form.trace}
                  disabled={!editable}
                  onChange={(e) => update('trace', e.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm outline-none focus:border-accent-600 focus:ring-1 focus:ring-accent-600 disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="Link oder Notiz zum Trace"
                />
              </div>
            </div>

            {error && (
              <div className="mt-4">
                <Banner tone="error">{error}</Banner>
              </div>
            )}

            {editable && (
              <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={() => persist(false)}
                  disabled={saving || !dirty}
                  title={!dirty ? 'Keine ungespeicherten Änderungen' : undefined}
                  className="rounded-md bg-accent-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? 'Speichern …' : 'Speichern'}
                </button>

                {!ticket.revealed && (
                  <span
                    title={complete ? undefined : 'Bitte zuerst alle Felder ausfüllen'}
                    className={complete ? undefined : 'cursor-not-allowed'}
                  >
                    <button
                      type="button"
                      onClick={() => persist(true)}
                      disabled={!complete || saving}
                      className="rounded-md border border-accent-300 bg-white px-4 py-2 text-sm font-semibold text-accent-700 transition hover:bg-accent-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      An einen erfahrenen Kollegen für Feedback weiterleiten
                    </button>
                  </span>
                )}

                {savedAt && !dirty && (
                  <span className="text-sm font-medium text-green-700">Gespeichert ✓</span>
                )}
              </div>
            )}

            {(ticket.submitted_by || ticket.submitted_at) && (
              <p className="mt-4 text-xs text-gray-400">
                Zuletzt bearbeitet
                {ticket.submitted_by ? ` von ${ticket.submitted_by}` : ''} am{' '}
                {formatDateTime(ticket.submitted_at)}
              </p>
            )}
          </section>

          {/* Musterlösung (nach "weiterleiten" bzw. wenn freigegeben) */}
          {ticket.revealed && <ModelSolution ticket={ticket} />}
        </div>

        {/* Seitenspalte: Filius */}
        <aside className="space-y-4">
          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Simulation</h2>
            <p className="mt-2 text-sm text-gray-600">
              Untersuche die Störung im externen Filius-Simulator.
            </p>
            {hasFilius ? (
              <a
                href={ticket.filius_deeplink!}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex w-full items-center justify-center rounded-md bg-accent-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-700"
              >
                Szenario in Filius öffnen
              </a>
            ) : (
              <span
                title="Für dieses Ticket ist noch kein Filius-Link hinterlegt"
                className="mt-3 block cursor-not-allowed"
              >
                <button
                  type="button"
                  disabled
                  className="inline-flex w-full cursor-not-allowed items-center justify-center rounded-md bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-500"
                >
                  Szenario in Filius öffnen
                </button>
              </span>
            )}
          </section>
        </aside>
      </div>
    </Layout>
  );
}

function ModelSolution({ ticket }: { ticket: Ticket }) {
  return (
    <section className="rounded-xl border border-green-200 bg-green-50 p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-green-900">Musterlösung zum Vergleich</h2>
      <p className="mt-0.5 text-xs text-green-800/80">
        Vergleiche deine Diagnose mit der Musterlösung. Keine Bewertung – nur zum Abgleich.
      </p>

      <dl className="mt-4 space-y-3 text-sm">
        <div>
          <dt className="font-medium text-green-900">Schicht</dt>
          <dd className="text-green-900/90">{ticket.correct_layer}</dd>
        </div>
        <div>
          <dt className="font-medium text-green-900">Werkzeuge</dt>
          <dd className="text-green-900/90">
            {ticket.correct_tools.length > 0
              ? ticket.correct_tools.map(toolLabel).join(', ')
              : '—'}
          </dd>
        </div>
        <div>
          <dt className="font-medium text-green-900">Problem</dt>
          <dd className="text-green-900/90">{ticket.model_problem}</dd>
        </div>
        <div>
          <dt className="font-medium text-green-900">Lösung</dt>
          <dd className="text-green-900/90">{ticket.model_solution}</dd>
        </div>
      </dl>
    </section>
  );
}
