import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { StatusChip } from '../components/StatusChip';
import { Banner } from '../components/Banner';
import { useAuth } from '../context/AuthContext';
import { useTickets } from '../context/TicketsContext';
import { canEditTicket, type Session } from '../lib/auth';
import { LAYERS, TOOLS } from '../lib/constants';
import { openTicket, saveSubmission } from '../lib/api';
import { formatDateTime } from '../lib/format';
import { isSubmissionComplete, type Ticket } from '../lib/types';
import { reporterFor } from '../lib/personas';
import { Avatar } from '../components/Avatar';
import { ColleagueFeedback } from '../components/ColleagueFeedback';
import { DiagnosisFlowchart } from '../components/DiagnosisFlowchart';
import { TraceField } from '../components/TraceField';

interface FormState {
  layer: string;
  tools: string[];
  problem: string;
  solution: string;
  trace: string;
  path: string[];
}

function fromTicket(t: Ticket): FormState {
  return {
    layer: t.submitted_layer ?? '',
    tools: t.submitted_tools ?? [],
    problem: t.submitted_problem ?? '',
    solution: t.submitted_solution ?? '',
    trace: t.trace_note ?? '',
    path: t.diagnosis_path ?? [],
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

  // Startzeit setzen: erster Aufruf durch das zuständige Team (README §4.2).
  // Fehler sind unkritisch (z. B. RPC noch nicht migriert) – nur Zeitmessung.
  const openRequested = useRef(false);
  useEffect(() => {
    if (openRequested.current || ticket.opened_at) return;
    if (session.role !== 'team' || session.ticketId !== ticket.id) return;
    openRequested.current = true;
    openTicket(ticket.id, session)
      .then(() => refetch())
      .catch((e) => console.error('open_ticket fehlgeschlagen:', e));
  }, [ticket.id, ticket.opened_at, session, refetch]);

  const complete = isSubmissionComplete({
    submitted_layer: form.layer || null,
    submitted_tools: form.tools,
    submitted_problem: form.problem || null,
    submitted_solution: form.solution || null,
    diagnosis_path: form.path,
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
          diagnosis_path: form.path,
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
  const reporter = reporterFor(ticket.id);

  return (
    <Layout>
      <div className="mx-auto max-w-3xl">
      <Link to="/" className="text-sm font-medium text-accent-700 hover:underline">
        ← Zurück zur Übersicht
      </Link>

      {/* Kopf */}
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium text-gray-400">#{ticket.id}</span>
        <h1 className="text-xl font-semibold text-gray-900">{ticket.title}</h1>
        <StatusChip ticket={ticket} />
      </div>

      <div className="mt-5 space-y-6">
          {/* Störungsmeldung – als Nachricht des meldenden Kollegen */}
          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <Avatar name={reporter.name} tone="neutral" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span className="font-semibold text-gray-900">{reporter.name}</span>
                  <span className="text-xs text-gray-500">{reporter.department}</span>
                </div>
                <p className="text-xs text-gray-400">hat diese Störung gemeldet</p>
                <p className="mt-3 text-sm leading-relaxed text-gray-800">
                  „{ticket.reporter_text}"
                </p>

                {ticket.concept_hint && (
                  <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <p className="text-xs font-semibold text-gray-600">
                      Hinweis – Was du dafür wissen musst
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-gray-600">
                      {ticket.concept_hint}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Roter Faden: ohne Netzanalyse keine Diagnose */}
          <section className="rounded-xl border-2 border-accent-300 bg-accent-50 p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-accent-700">
              Dein Lösungsweg
            </p>
            <h2 className="mt-1 text-lg font-semibold text-gray-900">
              Netzwerk in Echtzeit analysieren
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-gray-700">
              Die Ursache dieser Störung erkennst du <strong>nur im laufenden Netz</strong>. Öffne
              den Link, beobachte den Datenverkehr und prüfe mit deinen Werkzeugen, wo es
              hakt – erst dann kannst du die Diagnose unten zuverlässig stellen.
            </p>
            {hasFilius ? (
              <a
                href={ticket.filius_deeplink!}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center justify-center gap-2 rounded-md bg-accent-600 px-5 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-accent-700"
              >
                Netzwerk in Echtzeit analysieren
                <svg
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-4 w-4"
                  aria-hidden
                >
                  <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                  <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                </svg>
              </a>
            ) : (
              <span
                title="Für dieses Ticket ist noch kein Netzwerk-Link hinterlegt"
                className="mt-4 inline-block cursor-not-allowed"
              >
                <button
                  type="button"
                  disabled
                  className="inline-flex cursor-not-allowed items-center justify-center rounded-md bg-gray-200 px-5 py-3 text-base font-semibold text-gray-500"
                >
                  Netzwerk in Echtzeit analysieren
                </button>
              </span>
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
              {/* Geführte Fehlersuche entlang des Ablaufdiagramms (Informationsblatt) */}
              <DiagnosisFlowchart
                path={form.path}
                editable={editable}
                onChange={(p) => update('path', p)}
              />

              {/* Schicht */}
              <div>
                <label htmlFor="layer" className="block text-sm font-medium text-gray-700">
                  Schicht
                </label>
                <div className="relative mt-1">
                  <select
                    id="layer"
                    value={form.layer}
                    disabled={!editable}
                    onChange={(e) => update('layer', e.target.value)}
                    className="w-full cursor-pointer appearance-none rounded-md border border-gray-300 bg-white px-3 py-2 pr-10 text-sm font-medium text-gray-900 shadow-sm outline-none transition hover:border-accent-400 focus:border-accent-600 focus:ring-2 focus:ring-accent-600/30 disabled:cursor-default disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-500"
                  >
                    <option value="">– bitte wählen –</option>
                    {LAYERS.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                  <svg
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden
                    className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-accent-600"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
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

              {/* Wireshark-Trace als Screenshot */}
              <TraceField
                value={form.trace}
                editable={editable}
                onChange={(v) => update('trace', v)}
              />
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
                    title={
                      complete
                        ? undefined
                        : 'Bitte zuerst das Ablaufdiagramm bis zu einem Endpunkt durchlaufen und alle Felder ausfüllen'
                    }
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

          {/* Antwort der erfahrenen Kollegin (nach "weiterleiten") */}
          {ticket.revealed && <ColleagueFeedback ticket={ticket} />}
        </div>
      </div>
    </Layout>
  );
}
