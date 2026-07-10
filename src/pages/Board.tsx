import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { StatusChip } from '../components/StatusChip';
import { ConfirmModal } from '../components/ConfirmModal';
import { Banner } from '../components/Banner';
import { useAuth } from '../context/AuthContext';
import { useTickets } from '../context/TicketsContext';
import { resetAllSubmissions } from '../lib/api';
import { formatDateTime, ticketElapsed } from '../lib/format';

export function Board() {
  const { session } = useAuth();
  const { tickets, loading, error, live, refetch } = useTickets();
  const navigate = useNavigate();
  const isTeacher = session?.role === 'teacher';

  const [resetOpen, setResetOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Laufende Bearbeitungszeiten im Blick behalten: alle 30 s neu rendern.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const handleReset = async () => {
    if (!session) return;
    setResetting(true);
    setActionError(null);
    try {
      await resetAllSubmissions(session);
      await refetch();
      setResetOpen(false);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Zurücksetzen fehlgeschlagen.');
    } finally {
      setResetting(false);
    }
  };

  return (
    <Layout>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Ticket-Übersicht</h1>
          <p className="mt-0.5 flex items-center gap-2 text-sm text-gray-500">
            Alle gemeldeten Netzwerkstörungen
            {live && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" aria-hidden /> Live
              </span>
            )}
          </p>
        </div>

        {isTeacher && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => navigate('/credentials')}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Zugangsdaten &amp; QR-Code
            </button>
            <button
              type="button"
              onClick={() => navigate('/print')}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Alle Tickets als PDF exportieren
            </button>
            <button
              type="button"
              onClick={() => setResetOpen(true)}
              className="rounded-md border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50"
            >
              Ticketsystem zurücksetzen
            </button>
          </div>
        )}
      </div>

      {actionError && (
        <div className="mb-4">
          <Banner tone="error">{actionError}</Banner>
        </div>
      )}
      {error && (
        <div className="mb-4">
          <Banner tone="error">{error}</Banner>
        </div>
      )}

      {loading ? (
        <p className="py-12 text-center text-sm text-gray-500">Tickets werden geladen …</p>
      ) : tickets.length === 0 && !error ? (
        <p className="py-12 text-center text-sm text-gray-500">
          Keine Tickets vorhanden. Wurde die Datenbank initialisiert (schema.sql + seed.sql)?
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3 w-12">#</th>
                <th className="px-4 py-3">Titel</th>
                <th className="px-4 py-3 w-36">Status</th>
                <th className="px-4 py-3 w-40">Bearbeitungszeit</th>
                <th className="px-4 py-3 w-52">Zuletzt geändert</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tickets.map((t) => {
                const isOwn = session?.ticketId === t.id;
                const elapsed = ticketElapsed(t.opened_at, t.submitted_at, now);
                return (
                  <tr
                    key={t.id}
                    onClick={() => navigate(`/ticket/${t.id}`)}
                    className={`cursor-pointer transition hover:bg-gray-50 ${
                      isOwn ? 'bg-accent-50/60 hover:bg-accent-50' : ''
                    }`}
                  >
                    <td className="px-4 py-3 font-medium text-gray-500">{t.id}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{t.title}</span>
                        {isOwn && (
                          <span className="rounded bg-accent-600 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                            Ihr Ticket
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusChip ticket={t} />
                    </td>
                    <td className="px-4 py-3">
                      {elapsed ? (
                        elapsed.running ? (
                          <span
                            className="inline-flex items-center gap-1.5 font-medium text-amber-700"
                            title="Läuft – noch nicht gespeichert"
                          >
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" aria-hidden />
                            {elapsed.label}
                          </span>
                        ) : (
                          <span className="text-gray-600" title="Vom ersten Öffnen bis zum letzten Speichern">
                            {elapsed.label}
                          </span>
                        )
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{formatDateTime(t.submitted_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmModal
        open={resetOpen}
        title="Ticketsystem zurücksetzen"
        message="Wirklich alle Schülereingaben löschen? Die Ticket-Vorlagen bleiben erhalten."
        confirmLabel="Zurücksetzen"
        danger
        busy={resetting}
        onConfirm={handleReset}
        onCancel={() => setResetOpen(false)}
      />
    </Layout>
  );
}
