import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function Login() {
  const { session, login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (session) return <Navigate to="/" replace />;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(false);
    const ok = await login(username, password);
    setSubmitting(false);
    if (ok) {
      navigate('/', { replace: true });
    } else {
      setError(true);
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

        <form
          onSubmit={onSubmit}
          className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              Benutzername
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              autoFocus
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError(false);
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
                setError(false);
              }}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm outline-none focus:border-accent-600 focus:ring-1 focus:ring-accent-600"
            />
          </div>

          {error && (
            <p role="alert" className="text-sm font-medium text-red-600">
              Anmeldedaten ungültig
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
          Zugangsdaten erhalten Sie von Ihrer Lehrkraft.
        </p>
      </div>
    </div>
  );
}
