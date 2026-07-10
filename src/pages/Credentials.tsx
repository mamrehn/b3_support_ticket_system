import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Banner } from '../components/Banner';
import { CredentialSheet } from '../components/CredentialSheet';
import { useAuth } from '../context/AuthContext';
import { fetchCredentials, type ClassSet } from '../lib/api';

// Zugangsdaten der eigenen Klasse erneut anzeigen/drucken (nur Lehrkraft).
export function Credentials() {
  const { session } = useAuth();
  const [classSet, setClassSet] = useState<ClassSet | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    fetchCredentials(session)
      .then((cs) => {
        if (!cancelled) setClassSet(cs);
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Zugangsdaten konnten nicht geladen werden.');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [session]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Bildschirm-Steuerleiste – wird beim Drucken ausgeblendet */}
      <div className="border-b border-gray-200 bg-white print:hidden">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link to="/" className="text-sm font-medium text-accent-700 hover:underline">
            ← Zurück zur Übersicht
          </Link>
          {classSet && (
            <button
              type="button"
              onClick={() => window.print()}
              className="rounded-md bg-accent-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-700"
            >
              Drucken / Als PDF speichern
            </button>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-6 print:max-w-none print:px-0 print:py-0">
        <h1 className="mb-4 text-xl font-semibold text-gray-900 print:hidden">
          Zugangsdaten Ihrer Klasse
        </h1>
        {error ? (
          <Banner tone="error">{error}</Banner>
        ) : classSet ? (
          <CredentialSheet classSet={classSet} />
        ) : (
          <p className="py-12 text-center text-sm text-gray-500">
            Zugangsdaten werden geladen …
          </p>
        )}
      </div>
    </div>
  );
}
