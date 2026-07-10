import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Banner } from '../components/Banner';
import { CredentialSheet } from '../components/CredentialSheet';
import { createClass, type ClassSet } from '../lib/api';
import { isSupabaseConfigured } from '../lib/supabase';

// Selbstbedienung für Lehrkräfte (öffentlich verlinkbar): erstellt ein
// eigenes Klassen-Set – Klassen-Code, Lehrer-Konto, user1..user7 mit
// generierten Passwörtern und einem frischen Satz der 7 Tickets.
export function Register() {
  const [label, setLabel] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [classSet, setClassSet] = useState<ClassSet | null>(null);

  const handleCreate = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      setClassSet(await createClass(label));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Klassen-Set konnte nicht erstellt werden.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-10 print:max-w-none print:px-0 print:py-0">
        <div className="mb-6 flex items-center gap-2 print:hidden">
          <span className="grid h-9 w-9 place-items-center rounded-md bg-accent-600 text-sm font-bold text-white">
            DS
          </span>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">DataSol IT-Support</h1>
            <p className="text-xs text-gray-500">Klassen-Set für Lehrkräfte</p>
          </div>
        </div>

        {!classSet ? (
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900">
              Eigenes Klassen-Set erstellen
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">
              Mit einem Klick erhalten Sie Ihre eigene, unabhängige Instanz des
              Ticketsystems für eine Unterrichtsstunde: einen{' '}
              <strong>Klassen-Code</strong>, ein <strong>Lehrkraft-Konto</strong> und{' '}
              <strong>7 Team-Konten</strong> (user1 … user7) mit generierten Passwörtern –
              je Team ein Ticket. Mehrere Klassen können gleichzeitig und unabhängig
              voneinander arbeiten.
            </p>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-gray-600">
              <li>
                Die Zugangsdaten werden anschließend als druckbares Blatt mit QR-Code und
                Zetteln zum Ausschneiden angezeigt.
              </li>
              <li>
                Als Lehrkraft können Sie die Zugangsdaten später jederzeit erneut abrufen,
                alle Tickets live verfolgen, zurücksetzen und als PDF exportieren.
              </li>
              <li>
                Klassen-Sets ohne Aktivität werden nach <strong>60 Tagen</strong>{' '}
                automatisch gelöscht.
              </li>
            </ul>

            {!isSupabaseConfigured && (
              <div className="mt-4">
                <Banner tone="warning">
                  <span className="font-medium">Supabase ist nicht konfiguriert.</span>{' '}
                  Klassen-Sets können nicht erstellt werden.
                </Banner>
              </div>
            )}

            <div className="mt-5">
              <label htmlFor="class-label" className="block text-sm font-medium text-gray-700">
                Bezeichnung <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <input
                id="class-label"
                type="text"
                maxLength={60}
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="z. B. Klasse 8b · Netzwerkdiagnose"
                className="mt-1 w-full max-w-sm rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm outline-none focus:border-accent-600 focus:ring-1 focus:ring-accent-600"
              />
              <p className="mt-1 text-xs text-gray-400">
                Nur für Sie – hilft beim Auseinanderhalten mehrerer Klassen-Sets.
              </p>
            </div>

            {error && (
              <div className="mt-4">
                <Banner tone="error">{error}</Banner>
              </div>
            )}

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => void handleCreate()}
                disabled={busy || !isSupabaseConfigured}
                className="rounded-md bg-accent-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy ? 'Wird erstellt …' : 'Klassen-Set erstellen'}
              </button>
              <Link to="/login" className="text-sm font-medium text-accent-700 hover:underline">
                Zur Anmeldung
              </Link>
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-4 print:hidden">
              <Banner tone="warning">
                <span className="font-medium">Jetzt drucken oder sichern!</span> Diese
                Zugangsdaten sehen Sie nur hier – und später erneut über das
                Lehrkraft-Konto (Anmelden → „Zugangsdaten &amp; QR-Code").
              </Banner>
            </div>

            <CredentialSheet classSet={classSet} />

            <div className="mt-5 flex flex-wrap items-center gap-3 print:hidden">
              <button
                type="button"
                onClick={() => window.print()}
                className="rounded-md bg-accent-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-700"
              >
                Drucken / Als PDF speichern
              </button>
              <Link
                to={`/login?class=${classSet.classCode}`}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                Zur Anmeldung (Code ausgefüllt)
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
