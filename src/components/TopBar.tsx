import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { displayName } from '../lib/auth';
import { confirmDiscardUnsaved } from '../lib/unsavedGuard';

export function TopBar() {
  const { session, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    if (!confirmDiscardUnsaved()) return;
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/95 backdrop-blur print:hidden">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link
          to="/"
          onClick={(e) => {
            if (!confirmDiscardUnsaved()) e.preventDefault();
          }}
          className="flex items-center gap-2 text-sm font-semibold text-gray-900"
        >
          <span className="grid h-7 w-7 place-items-center rounded-md bg-accent-600 text-xs font-bold text-white">
            DS
          </span>
          DataSol IT-Support
        </Link>

        {session && (
          <div className="flex items-center gap-4 text-sm">
            <span className="hidden text-gray-500 sm:inline">
              Angemeldet als{' '}
              <span className="font-medium text-gray-800">{displayName(session)}</span>
            </span>
            <span
              title={session.classLabel ?? undefined}
              className="rounded-md bg-gray-100 px-2 py-1 font-mono text-xs font-semibold tracking-widest text-gray-600"
            >
              {session.classCode}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-md border border-gray-300 px-3 py-1.5 font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Abmelden
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
