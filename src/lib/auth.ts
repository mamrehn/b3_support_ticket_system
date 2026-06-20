// Anmeldung & Schreibschutz (README §2 + §10).
//
// Die Anmeldung wird SERVERSEITIG geprüft: app_login() vergleicht
// Benutzername+Passwort gegen die teams-Tabelle. Passwörter liegen in der DB,
// NICHT im öffentlichen Bundle. Schreibzugriffe laufen über die RPCs
// submit_ticket()/reset_tickets() (siehe src/lib/api.ts), die das Passwort
// erneut serverseitig prüfen – daher wird das eigene Passwort in der Session
// gehalten (nur clientseitig, im sessionStorage dieses Geräts).

import { supabase } from './supabase';

export type Role = 'team' | 'teacher';

export interface Session {
  username: string;
  role: Role;
  ticketId?: number; // nur für Teams: das eigene Ticket
  password: string; // wird für die Schreib-RPCs benötigt (nur clientseitig)
}

interface LoginRow {
  username: string;
  role: Role;
  ticket_id: number | null;
}

const STORAGE_KEY = 'datasol-session';

// Serverseitige Prüfung der Anmeldedaten. Gibt die Session zurück oder null.
export async function authenticate(
  username: string,
  password: string,
): Promise<Session | null> {
  const u = username.trim();
  if (!u || !password) return null;

  const { data, error } = await supabase.rpc('app_login', {
    p_username: u,
    p_password: password,
  });

  if (error) {
    // Echte Fehler (Netz/RPC fehlt) protokollieren; nach außen "ungültig".
    console.error('app_login fehlgeschlagen:', error.message);
    return null;
  }

  const row = (Array.isArray(data) ? data[0] : null) as LoginRow | null;
  if (!row) return null;

  return {
    username: row.username ?? u,
    role: row.role ?? 'team',
    ticketId: row.ticket_id ?? undefined,
    password,
  };
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
// Lehrer: jedes Ticket. Team: nur das eigene. (Serverseitig zusätzlich erzwungen.)
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
