// Clientseitige Anmeldung (README §2). BEWUSSTE ENTSCHEIDUNG: keine
// serverseitige Auth. Der anon-Key und diese Zuordnung sind im öffentlichen
// Bundle sichtbar – das ist akzeptiert. Ziel ist nur, das Schreiben in ein
// FREMDES Ticket etwas zu erschweren und jedem Team sein Ticket zu zeigen.
//
// >>> Vor dem Unterricht anpassen und auf Papier ausdrucken: <<<
// Passwörter ersetzen. Stärkere Variante: README §10 (Passwörter in der DB).

export type Role = 'team' | 'teacher';

export interface UserConfig {
  password: string;
  role: Role;
  ticketId?: number; // nur für Teams: das eigene Ticket
}

export const USERS: Record<string, UserConfig> = {
  team1: { password: 'rot-3148', role: 'team', ticketId: 1 },
  team2: { password: 'blau-7290', role: 'team', ticketId: 2 },
  team3: { password: 'gruen-5063', role: 'team', ticketId: 3 },
  team4: { password: 'gelb-8217', role: 'team', ticketId: 4 },
  team5: { password: 'lila-4905', role: 'team', ticketId: 5 },
  team6: { password: 'grau-6734', role: 'team', ticketId: 6 },
  teacher: { password: 'datasol-lehrer-2026', role: 'teacher' },
};

export interface Session {
  username: string;
  role: Role;
  ticketId?: number;
}

const STORAGE_KEY = 'datasol-session';

// Prüft Anmeldedaten gegen USERS. Gibt die Session zurück oder null.
export function authenticate(username: string, password: string): Session | null {
  const user = USERS[username.trim()];
  if (!user || user.password !== password) return null;
  return { username: username.trim(), role: user.role, ticketId: user.ticketId };
}

export function loadSession(): Session | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export function saveSession(session: Session): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}

// Darf diese Session das gegebene Ticket bearbeiten?
// Lehrer: jedes Ticket. Team: nur das eigene.
export function canEditTicket(session: Session | null, ticketId: number): boolean {
  if (!session) return false;
  if (session.role === 'teacher') return true;
  return session.ticketId === ticketId;
}

// Anzeigename für die Topbar / Board-Spalte.
export function displayName(session: Session): string {
  if (session.role === 'teacher') return 'Lehrkraft';
  return `Team ${session.ticketId}`;
}
