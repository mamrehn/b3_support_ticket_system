// Personas für die Immersion (reine Darstellung, keine DB-Daten).
// Pro Ticket meldet eine Kollegin/ein Kollege aus einer Fachabteilung die
// Störung; eine erfahrene Kollegin gibt nach dem Weiterleiten Feedback.
// Über die Ticket-ID den passenden Melder zuordnen.

export interface Reporter {
  name: string;
  department: string;
}

export const REPORTERS: Record<number, Reporter> = {
  1: { name: 'Markus Hoffmann', department: 'Buchhaltung' },
  2: { name: 'Petra Wagner', department: 'Vertrieb' },
  3: { name: 'Stefan Klein', department: 'Lager & Logistik' },
  4: { name: 'Julia Becker', department: 'Marketing' },
  5: { name: 'Thomas Schäfer', department: 'Personalabteilung' },
  6: { name: 'Sabine Richter', department: 'Einkauf' },
  7: { name: 'Daniel Wolf', department: 'Haustechnik' },
};

export function reporterFor(ticketId: number): Reporter {
  return REPORTERS[ticketId] ?? { name: 'Anonyme Meldung', department: 'DataSol' };
}

// Die "erfahrene Kollegin", an die zum Feedback weitergeleitet wird.
export const MENTOR = {
  name: 'Sandra Berger',
  role: 'Netzwerkadministratorin · 2nd Level Support',
};
