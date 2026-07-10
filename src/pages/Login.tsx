import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Banner } from '../components/Banner';
import { useAuth } from '../context/AuthContext';
import { isSupabaseConfigured } from '../lib/supabase';

const ERROR_MESSAGES = {
  invalid: 'Anmeldedaten ungültig – Klassen-Code, Benutzername und Passwort prüfen.',
  unavailable: 'Server nicht erreichbar – bitte Verbindung prüfen und erneut versuchen.',
} as const;

export function Login() {
  const { session, login } = useAuth();
  const navigate = useNavigate();
  // Klassen-Code aus dem geteilten Link/QR-Code (…#/login?class=QKZP) vorbefüllen.
  const [searchParams] = useSearchParams();
  const [classCode, setClassCode] = useState(
    () => searchParams.get('class')?.toUpperCase() ?? '',
  );
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<keyof typeof ERROR_MESSAGES | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (session) return <Navigate to="/" replace />;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    const result = await login(classCode, username, password);
    setSubmitting(false);
    if (result === 'ok') {
      navigate('/', { replace: true });
    } else {
      setError(result);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-md bg-accent-600 text-sm font-bold text-white">
            DS
          </span>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">DataSol IT-Support</h1>
            <p className="text-xs text-gray-500">Interne Anmeldung</p>
          </div>
        </div>

        {!isSupabaseConfigured && (
          <div className="mb-4">
            <Banner tone="warning">
              <span className="font-medium">Supabase ist nicht konfiguriert.</span> Eine
              Anmeldung ist nicht möglich. Bitte <code>VITE_SUPABASE_URL</code> und{' '}
              <code>VITE_SUPABASE_ANON_KEY</code> hinterlegen.
            </Banner>
          </div>
        )}

        <form
          onSubmit={onSubmit}
          className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          <div>
            <label htmlFor="class-code" className="block text-sm font-medium text-gray-700">
              Klassen-Code
            </label>
            <input
              id="class-code"
              type="text"
              autoComplete="off"
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              autoFocus={!classCode}
              value={classCode}
              onChange={(e) => {
                setClassCode(e.target.value.toUpperCase());
                setError(null);
              }}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm uppercase tracking-widest shadow-sm outline-none focus:border-accent-600 focus:ring-1 focus:ring-accent-600"
              placeholder="z. B. QKZP"
            />
            <p className="mt-1 text-xs text-gray-400">
              Steht auf eurem Zugangszettel – über den QR-Code/Link ist er schon ausgefüllt.
            </p>
          </div>

          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              Benutzername
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              autoFocus={!!classCode}
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError(null);
              }}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm outline-none focus:border-accent-600 focus:ring-1 focus:ring-accent-600"
              placeholder="z. B. user1"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Passwort
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(null);
              }}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm outline-none focus:border-accent-600 focus:ring-1 focus:ring-accent-600"
            />
          </div>

          {error && (
            <p role="alert" className="text-sm font-medium text-red-600">
              {ERROR_MESSAGES[error]}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-accent-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Anmelden …' : 'Anmelden'}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-gray-400">
          Zugangsdaten erhaltet ihr von eurer Lehrkraft.
        </p>
      </div>
    </div>
  );
}
