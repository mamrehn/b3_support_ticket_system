// Anmeldung & Schreibschutz (Mehrklassen-Version).
//
// Jede Lehrkraft hat ihr eigenes Klassen-Set (Klassen-Code + 8 Konten), das
// sie sich über die Seite „Klassen-Set erstellen" selbst anlegt. Die Anmeldung
// wird SERVERSEITIG geprüft: app_login() vergleicht Klassen-Code + Benutzer-
// name + Passwort gegen die Tabellen classes/teams. Passwörter liegen in der
// DB, NICHT im öffentlichen Bundle. Schreibzugriffe laufen über die RPCs in
// src/lib/api.ts, die class_id + Benutzername + Passwort erneut serverseitig
// prüfen – daher hält die Session das eigene Passwort (nur clientseitig, im
// sessionStorage dieses Geräts/Tabs).

import { supabase } from './supabase';

export type Role = 'team' | 'teacher';

export interface Session {
  classId: string; // uuid der Klasse – scoped alle Lese-/Schreibzugriffe
  classCode: string; // Klassen-Code für Anzeige (z. B. "QKZP")
  classLabel: string | null; // optionale Bezeichnung, z. B. "Klasse 8b"
  username: string;
  role: Role;
  ticketId?: number; // nur für Teams: das eigene Ticket
  password: string; // wird für die Schreib-RPCs benötigt (nur clientseitig)
}

interface LoginRow {
  class_id: string;
  class_code: string;
  class_label: string | null;
  username: string;
  role: Role;
  ticket_id: number | null;
}

const STORAGE_KEY = 'datasol-session';

// Ergebnis der Anmeldung: 'invalid' = Zugangsdaten falsch, 'unavailable' =
// Server/Netz nicht erreichbar (oder RPC fehlt) – wird getrennt angezeigt,
// damit ein WLAN-Aussetzer nicht wie ein Tippfehler aussieht.
export type LoginResult =
  | { ok: true; session: Session }
  | { ok: false; reason: 'invalid' | 'unavailable' };

// Serverseitige Prüfung der Anmeldedaten.
export async function authenticate(
  classCode: string,
  username: string,
  password: string,
): Promise<LoginResult> {
  const code = classCode.trim();
  const u = username.trim();
  if (!code || !u || !password.trim()) return { ok: false, reason: 'invalid' };

  const { data, error } = await supabase.rpc('app_login', {
    p_class_code: code,
    p_username: u,
    p_password: password,
  });

  if (error) {
    console.error('app_login fehlgeschlagen:', error.message);
    return { ok: false, reason: 'unavailable' };
  }

  const row = (Array.isArray(data) ? data[0] : null) as LoginRow | null;
  if (!row) return { ok: false, reason: 'invalid' };

  return {
    ok: true,
    session: {
      classId: row.class_id,
      classCode: row.class_code,
      classLabel: row.class_label,
      username: row.username ?? u,
      role: row.role ?? 'team',
      ticketId: row.ticket_id ?? undefined,
      password,
    },
  };
}

export function loadSession(): Session | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as Session;
    // Sessions aus der Einzelklassen-Version (ohne classId) verwerfen.
    if (!s.classId || !s.username || !s.password) return null;
    return s;
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

// Darf diese Session das gegebene Ticket (der eigenen Klasse) bearbeiten?
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
