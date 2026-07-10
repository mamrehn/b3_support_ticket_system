import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  authenticate,
  clearSession,
  loadSession,
  saveSession,
  type Session,
} from '../lib/auth';

interface AuthContextValue {
  session: Session | null;
  /** 'ok' bei Erfolg, sonst der Fehlergrund (siehe LoginResult in lib/auth). */
  login: (
    classCode: string,
    username: string,
    password: string,
  ) => Promise<'ok' | 'invalid' | 'unavailable'>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => loadSession());

  const login = useCallback(
    async (
      classCode: string,
      username: string,
      password: string,
    ): Promise<'ok' | 'invalid' | 'unavailable'> => {
      const result = await authenticate(classCode, username, password);
      if (!result.ok) return result.reason;
      saveSession(result.session);
      setSession(result.session);
      return 'ok';
    },
    [],
  );

  const logout = useCallback(() => {
    clearSession();
    setSession(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ session, login, logout }),
    [session, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth muss innerhalb von <AuthProvider> verwendet werden');
  return ctx;
}
